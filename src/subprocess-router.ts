/**
 * The routing `ctx.subprocess` provider: extends the local runtime with a
 * remote branch for spawn requests whose cwd sits under an anchor directory.
 * Remote argv runs over the SSH exec channel as a quoted command line (the
 * seam's "argv is never shell-interpreted" is preserved by quoting every
 * element) behind a cd guard into the mapped remote path — the spawn's cwd
 * travels as the remote working directory, not merely as a routing decision.
 * The spawn's stdin dispositions travel faithfully too: `ignore` becomes a
 * `/dev/null` redirect because a channel's stdin is a pipe, and programs that
 * branch on pipe-ness (ripgrep with no search path) would silently change
 * behavior at EOF. The packaged ripgrep is re-pointed at the remote `rg` so
 * the grep and glob tools keep parsing identical output. Routing keys on the
 * workdir alone — the host platform only matters for the local fallback,
 * which is the inherited runtime.
 *
 * Remote terminal sessions run on an SSH pty through {@link RemoteTerminalHandle}:
 * the interactive shell is real, while the facts SSH cannot report (foreground
 * process group, shell activity) answer the contract's documented "unknown"
 * shapes instead of being invented.
 * @module dsh-remote-development/subprocess-router
 */

import { Context } from '@deepseek-ai/cordis'
import { LocalSubprocessRuntime } from '@deepseek-ai/dsh-subprocess-local'
import type {
  SubprocessHandle,
  SubprocessOutcome,
  SubprocessOutputRead,
  SubprocessOutputReader,
  SubprocessSpawnSpec,
  SubprocessTerminalHandle,
  SubprocessTerminalSpawnSpec,
} from '@deepseek-ai/dsh-subprocess'
import type { ClientChannel } from 'ssh2'
import { RemoteWorld } from './world.ts'
import type { MachineRef } from './world.ts'
import { unconfiguredMachineMessage } from './world.ts'
import { argvToRemoteCommand, shq } from './paths.ts'
import { rgMissingHint } from './remote-env.ts'
import { RemoteTerminalHandle } from './remote-terminal.ts'

/** Tail-keeping byte buffer with whole-stream offset reads. */
class CollectBuffer {
  private bytes: Uint8Array = new Uint8Array(0)
  private dropped = 0
  private received = 0

  /**
   * @param maxBytes - in-memory cap; overflow keeps the tail.
   */
  constructor(readonly maxBytes: number) {}

  /** Append bytes, discarding the head beyond the cap. */
  push(chunk: Uint8Array): void {
    this.received += chunk.length
    const merged = new Uint8Array(this.bytes.length + chunk.length)
    merged.set(this.bytes, 0)
    merged.set(chunk, this.bytes.length)
    if (this.maxBytes > 0 && merged.length > this.maxBytes) {
      const cut = merged.length - this.maxBytes
      this.dropped += cut
      this.bytes = merged.slice(cut)
      return
    }
    this.bytes = merged
  }

  /** Total bytes ever received. */
  get total(): number {
    return this.received
  }

  /**
   * Offset-based, non-consuming read.
   * @param fromByte - whole-stream offset to resume from.
   * @returns the delta read.
   */
  readFrom(fromByte: number): SubprocessOutputRead {
    if (fromByte < this.dropped) {
      return { text: new TextDecoder().decode(this.bytes), nextOffset: this.received, lossy: true }
    }
    const start = Math.min(Math.max(fromByte, 0), this.received) - this.dropped
    return {
      text: new TextDecoder().decode(this.bytes.slice(Math.max(start, 0))),
      nextOffset: Math.max(fromByte, this.received),
      lossy: false,
    }
  }
}

/** Build an offset-based reader view over one buffer. */
function readerOf(buffer: CollectBuffer): SubprocessOutputReader {
  return { readFrom: (fromByte: number) => buffer.readFrom(fromByte) }
}

/** Opened-channel state (absent until the SSH exec channel exists). */
interface ChannelState {
  channel: ClientChannel
  stdoutBuffer: CollectBuffer | undefined
  stderrBuffer: CollectBuffer | undefined
  stdinPipe: boolean
  stdoutPipe: boolean
}

/**
 * One remote managed process over an SSH exec channel. The channel IS the
 * process lifetime: `done` settles at channel close with the remote exit
 * facts and rejects only when the channel cannot be opened (a spawn-level
 * failure). Remote PIDs are not observable over SSH, so `pid` is -1.
 */
class RemoteSpawnHandle implements SubprocessHandle {
  readonly pid = -1
  readonly done: Promise<SubprocessOutcome>
  private state: ChannelState | null = null
  private terminated = false
  private readonly spec: SubprocessSpawnSpec
  private readonly world: RemoteWorld
  private readonly machine: MachineRef
  /** Whether this spawn's argv[0] was re-pointed at the remote `rg`. */
  private rgRouted = false

  /**
   * Start the remote process for one spec. The SSH round trip begins
   * immediately; `spawn()` returns this handle synchronously.
   * @param world - remote world (pool access).
   * @param machine - target machine.
   * @param remotePath - the mapped remote cwd the spec's local cwd stands for.
   * @param spec - fully-specified spawn request.
   */
  constructor(world: RemoteWorld, machine: MachineRef, remotePath: string, spec: SubprocessSpawnSpec) {
    this.spec = spec
    this.world = world
    this.machine = machine
    let resolveDone: (outcome: SubprocessOutcome) => void
    let rejectDone: (err: Error) => void
    this.done = new Promise<SubprocessOutcome>((resolve, reject) => {
      resolveDone = resolve
      rejectDone = reject
    })
    if (spec.signal) {
      if (spec.signal.aborted) this.terminate()
      else spec.signal.addEventListener('abort', () => this.terminate(), { once: true })
    }
    void this.open(world, machine, remotePath, resolveDone!, rejectDone!)
  }

  private async open(
    world: RemoteWorld,
    machine: MachineRef,
    remotePath: string,
    resolveDone: (outcome: SubprocessOutcome) => void,
    rejectDone: (err: Error) => void,
  ): Promise<void> {
    try {
      const pool = world.poolFor(machine)
      const client = await pool.connect()
      const rewrite = rewriteRipgrep(this.spec.argv, world.config.remoteRipgrep)
      // Remember the rewrite: exit 127 from this spawn means the remote `rg`
      // is missing, not that the caller's own program was.
      this.rgRouted = rewrite.rewritten
      const command = buildRemoteCommand(rewrite.argv, this.spec.env)
      // The exec channel hands the string to the remote login shell, so the
      // cd guard is shell syntax by necessity; every argv element stays
      // quoted, preserving the seam's "argv is never shell-interpreted"
      // fact. A refused cwd fails loud with a self-descriptive stderr line
      // and exit 125 — the tool layer classifies it, no marker needed.
      // The local seam's stdin 'ignore' hands the child /dev/null — a
      // character device, not a pipe — while a channel's stdin is a pipe,
      // and a program that branches on pipe-ness (ripgrep with no path
      // reads stdin instead of searching the directory) would silently
      // change behavior at EOF. The redirect keeps the translation faithful.
      const stdinRedirect = this.spec.stdio.stdin === 'ignore' ? ' < /dev/null' : ''
      const guarded = `cd ${shq(remotePath)} || { echo ${shq(`cannot use remote working directory ${remotePath}`)} >&2; exit 125; }\n${command}${stdinRedirect}`
      await new Promise<void>((resolve, reject) => {
        client.exec(guarded, {}, (err, channel) => {
          if (err) {
            reject(new Error(`remote spawn failed: ${err.message}`))
            return
          }
          this.attach(channel, resolveDone)
          resolve()
        })
      })
    } catch (err) {
      rejectDone(err as Error)
    }
  }

  private attach(channel: ClientChannel, resolveDone: (outcome: SubprocessOutcome) => void): void {
    const spec = this.spec
    const state: ChannelState = {
      channel,
      stdoutBuffer: spec.stdio.stdout !== 'pipe' && spec.stdio.stdout !== 'inherit'
        ? new CollectBuffer(spec.stdio.stdout.maxBytes)
        : undefined,
      stderrBuffer: spec.stdio.stderr !== 'pipe' && spec.stdio.stderr !== 'inherit'
        ? new CollectBuffer(spec.stdio.stderr.maxBytes)
        : undefined,
      stdinPipe: spec.stdio.stdin === 'pipe',
      stdoutPipe: spec.stdio.stdout === 'pipe',
    }
    this.state = state
    if (state.stdoutBuffer) {
      channel.on('data', (d: Buffer) => state.stdoutBuffer?.push(new Uint8Array(d)))
    }
    if (state.stderrBuffer) {
      channel.stderr?.on('data', (d: Buffer) => state.stderrBuffer?.push(new Uint8Array(d)))
    }
    if (spec.stdio.stderr === 'inherit') {
      channel.stderr?.on('data', (d: Buffer) => process.stderr.write(d))
    }
    if (spec.stdio.stdin === 'ignore') {
      try { channel.end() } catch { /* stdin already closed */ }
    } else if (spec.stdio.stdin !== 'pipe') {
      channel.write(spec.stdio.stdin.data, 'utf8')
      try { channel.end() } catch { /* stdin already closed */ }
    }
    channel.on('close', (code: number | undefined, sig: string | undefined) => {
      // A rewritten ripgrep that never started is the failure the operator can
      // fix; explain it in the same stderr the search tools quote, before the
      // outcome settles.
      if (code === 127 && this.rgRouted) this.explainMissingRipgrep(state)
      resolveDone({
        exitCode: typeof code === 'number' ? code : null,
        signal: (sig as SubprocessOutcome['signal']) ?? null,
      })
    })
    channel.on('error', () => {
      // A transport error after open settles as a signal death, not a spawn
      // failure — the command ran.
      resolveDone({ exitCode: null, signal: null })
    })
    if (this.terminated) this.terminate()
  }

  get stdin(): ClientChannel | undefined {
    return this.state?.stdinPipe ? this.state.channel : undefined
  }

  get stdout(): ClientChannel | undefined {
    return this.state?.stdoutPipe ? this.state.channel : undefined
  }

  get stderr(): undefined {
    // Remote stderr pipes are not exposed: the collect mode covers every
    // remote consumer (search tools), and protocol framing stays local-only.
    return undefined
  }

  get collected(): { stdout?: SubprocessOutputReader; stderr?: SubprocessOutputReader } {
    const state = this.state
    if (!state) return {}
    return {
      ...state.stdoutBuffer ? { stdout: readerOf(state.stdoutBuffer) } : {},
      ...state.stderrBuffer ? { stderr: readerOf(state.stderrBuffer) } : {},
    }
  }

  get control(): undefined {
    // No caller-owned byte channel crosses the SSH exec channel: the collect
    // mode covers every remote consumer, and protocol framing stays local-only.
    return undefined
  }

  /**
   * Append the actionable explanation for a missing remote `rg` to the captured
   * stderr. The probe result is read from the world's cache — never re-probed
   * here, because an error path must not pay a second round trip.
   * @param state - the opened channel's buffers.
   */
  private explainMissingRipgrep(state: ChannelState): void {
    const machineId = this.machine.machine.id
    const text = `\n${rgMissingHint(machineId, this.world.cachedEnvironment(machineId))}\n`
    if (state.stderrBuffer !== undefined) state.stderrBuffer.push(new TextEncoder().encode(text))
    else process.stderr.write(text)
  }

  terminate(): void {
    this.terminated = true
    const state = this.state
    if (!state) return
    try {
      state.channel.signal('SIGTERM')
    } catch { /* server without signal support */ }
    setTimeout(() => {
      try { state.channel.close() } catch { /* already closed */ }
    }, 500).unref()
  }

  async waitForExit(signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) return false
    return Promise.race([
      this.done.then(() => true),
      ...signal
        ? [new Promise<false>((resolve) => {
            const onAbort = (): void => resolve(false)
            signal.addEventListener('abort', onAbort, { once: true })
          })]
        : [],
    ])
  }
}

/**
 * Re-point the packaged ripgrep binary at the remote `rg` command.
 * @param argv - the local argv vector.
 * @param remoteRipgrep - the remote ripgrep command name.
 * @returns the argv to run, and whether argv[0] was the packaged ripgrep
 *   (reported explicitly: the remote name is often also `rg`, so the strings
 *   alone cannot tell a rewrite from an untouched command).
 */
function rewriteRipgrep(argv: readonly string[], remoteRipgrep: string): { argv: string[]; rewritten: boolean } {
  const first = argv[0] ?? ''
  const rest = argv.slice(1)
  const base = first.replace(/\\/g, '/').split('/').pop() ?? ''
  if (base === 'rg' || base === 'rg.exe') return { argv: [remoteRipgrep, ...rest], rewritten: true }
  return { argv: [first, ...rest], rewritten: false }
}

/** Compose the remote command line: optional env prefix, then the quoted argv. */
function buildRemoteCommand(argv: readonly string[], env: NodeJS.ProcessEnv | undefined): string {
  if (env) {
    const parts: string[] = []
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) continue
      parts.push(`${key}=${shq(value)}`)
    }
    if (parts.length > 0) return `env ${parts.join(' ')} ${argvToRemoteCommand(argv)}`
  }
  return argvToRemoteCommand(argv)
}

/**
 * The routing subprocess runtime. Construction registers `ctx.subprocess`;
 * the workdir classification alone decides between the remote branch and the
 * inherited local runtime, so routing behavior is identical on every host
 * platform.
 */
export class RoutingSubprocessRuntime extends LocalSubprocessRuntime {
  private readonly world: RemoteWorld

  /**
   * @param ctx - plugin context.
   * @param world - the remote world coordinator.
   */
  constructor(ctx: Context, world: RemoteWorld) {
    super(ctx)
    this.world = world
  }

  override spawn(spec: SubprocessSpawnSpec): SubprocessHandle {
    const route = this.world.classifyHostPath(spec.cwd)
    if (route.kind !== 'remote') return super.spawn(spec)
    const machine = this.world.machineForAnchor(route.route.anchor)
    // Refuse instead of falling back: a local spawn would silently run the
    // command on the wrong host.
    if (!machine) throw new Error(unconfiguredMachineMessage(route.route.anchor))
    return new RemoteSpawnHandle(this.world, machine, route.route.remotePath, spec)
  }

  override async spawnTerminal(spec: SubprocessTerminalSpawnSpec): Promise<SubprocessTerminalHandle> {
    const route = this.world.classifyHostPath(spec.cwd)
    if (route.kind !== 'remote') return super.spawnTerminal(spec)
    const machine = this.world.machineForAnchor(route.route.anchor)
    // Refuse instead of falling back: a local terminal would open a shell on
    // the wrong host while the model believes it is the machine.
    if (!machine) throw new Error(unconfiguredMachineMessage(route.route.anchor))
    return new RemoteTerminalHandle({
      world: this.world,
      machine,
      remotePath: route.route.remotePath,
      spec,
    })
  }
}
