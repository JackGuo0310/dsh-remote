/**
 * Remote terminal branch of the routing subprocess runtime: one interactive
 * POSIX shell on the machine over an SSH pty channel.
 *
 * The host's terminal backend decides the dialect it expects on the other side
 * (a POSIX host runs the bash backend, a Windows host runs the same package in
 * pwsh mode). SSH gives us a byte pipe, not a pty driver, so the branch starts
 * the remote shell with one bootstrap line that:
 *   • loads the machine's own login configuration first (`/etc/profile`, then
 *     the user's profile), so aliases (`ls` colors), PATH additions, and shell
 *     options behave like the machine's terminal instead of a bare shell;
 *   • exports a prompt and a `PROMPT_COMMAND` emitting the OSC 133;D marker the
 *     backend's emulator reads as "shell is ready for input" — the same marker
 *     the pwsh prompt setup writes, so the bash-dialect and pwsh-dialect
 *     backends both see readiness. Both are set AFTER the profile chain, which
 *     would otherwise replace them;
 *   • records the shell's PID, so a signal can reach its PROCESS GROUP; every
 *     later command the operator runs is text on the same pty.
 *
 * What SSH cannot report is the FOREGROUND process group: sshd exposes no job
 * control facts. `inspectForeground` therefore answers undefined and activity
 * answers `unknown` — the contract's documented "provider cannot resolve it"
 * shape — while signals fall back to the pty's own control keys (SIGINT/SIGTSTP
 * are delivered by the remote tty to whatever runs in the foreground) and to a
 * process-group kill for the rest.
 * @module dsh-remote-development/remote-terminal
 */

import { Readable } from 'node:stream'
import type { ClientChannel } from 'ssh2'
import type {
  SubprocessOutcome,
  SubprocessTerminalActivity,
  SubprocessTerminalForeground,
  SubprocessTerminalHandle,
  SubprocessTerminalSignal,
  SubprocessTerminalSpawnSpec,
} from '@deepseek-ai/dsh-subprocess'
import type { RemoteWorld } from './world.ts'
import type { MachineRef } from './world.ts'
import { shq } from './paths.ts'

/** Signals a POSIX tty turns into itself when its control key arrives. */
const CONTROL_KEYS: Partial<Record<SubprocessTerminalSignal, string>> = {
  SIGINT: '\x03',
  SIGTSTP: '\x1a',
}

/** `kill -<name>` spelling for every signal the terminal contract allows. */
const KILL_NAMES: Record<SubprocessTerminalSignal, string> = {
  SIGINT: 'INT',
  SIGTERM: 'TERM',
  SIGKILL: 'KILL',
  SIGTSTP: 'TSTP',
  SIGHUP: 'HUP',
}

/** Grace between the terminal's SIGTERM and its SIGKILL escalation. */
const DEFAULT_KILL_GRACE_MS = 3_000

/**
 * The first write a pwsh-dialect terminal backend sends: it defines the prompt
 * marker for a PowerShell shell. A remote POSIX shell cannot parse it, and the
 * bootstrap line already exports the same marker, so the branch swallows it.
 */
const PWSH_SETUP = /\[Console\]::OutputEncoding|function\s+prompt\s*\{/

/**
 * Compose the remote command line: cd guard, pid record, prompt bootstrap, then
 * the interactive shell. `exec` keeps the recorded PID as the shell's PID.
 * @param remotePath - the mapped remote working directory.
 * @param spec - the spawn request (environment, terminal type).
 * @param pidFile - remote file the shell writes its own PID into.
 * @returns the command line for the pty exec channel.
 */
export function remoteTerminalCommand(remotePath: string, spec: SubprocessTerminalSpawnSpec, pidFile: string, rcFile: string): string {
  const lines = [
    `cd ${shq(remotePath)} || { echo ${shq(`cannot use remote working directory ${remotePath}`)} >&2; exit 125; }`,
    `echo $$ > ${shq(pidFile)}`,
    `export TERM=${shq(spec.terminalType === 'dumb' ? 'xterm-256color' : spec.terminalType)}`,
    // Ordinary environment entries the backend carried for this session, before
    // the profile runs: the operator's own profile may extend them.
    ...Object.entries(spec.env ?? {})
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([key, value]) => `export ${key}=${shq(value)}`),
    // The shell loads the machine's login/interactive configuration the way an
    // interactive login shell would — `--rcfile` replaces every built-in rc, so
    // the file does the chain itself. That is what makes aliases (`ls` colors),
    // PATH additions, and shell options behave like the machine's own terminal.
    `cat > ${shq(rcFile)} <<'DSH_RDV_RC'`,
    '[ -r /etc/profile ] && . /etc/profile',
    'if [ -r "$HOME/.bash_profile" ]; then . "$HOME/.bash_profile";'
      + ' elif [ -r "$HOME/.bash_login" ]; then . "$HOME/.bash_login";'
      + ' elif [ -r "$HOME/.profile" ]; then . "$HOME/.profile"; fi',
    // The whole prompt is built inside PS1, not printed by PROMPT_COMMAND:
    // readline only measures the text it prints itself, so a prompt printed
    // around it makes its column math wrong (typed text drifts right of the
    // prompt). The visible part is `user@host:path`; the host emulator only
    // accepts `dsh> ` as the text following OSC 133;D (exactly, within six
    // characters), so the controlled token sits after the marker and is drawn
    // concealed.
    '__rdv_prompt() {',
    '  __rdv_status=$?',
    '  __rdv_host=${HOSTNAME%%.*}',
    '  [ -n "$__rdv_host" ] || __rdv_host=$(hostname -s 2>/dev/null || uname -n)',
    '  __rdv_path=$PWD',
    '  case $__rdv_path in "$HOME") __rdv_path=\'~\';; "$HOME"/*) __rdv_path=~${__rdv_path#"$HOME"};; esac',
    '  PS1="\\[\\033[1;32m\\]${USER:-$(id -un 2>/dev/null)}@${__rdv_host}\\[\\033[0m\\]:'
      // One visible space before the marker keeps typed input off the path.
      + '\\[\\033[1;36m\\]${__rdv_path}\\[\\033[0m\\] '
      // The whole marker + controlled token sits inside one readline
      // non-printing region, and the cursor steps back over the token's cells:
      // the token is emitted (the host emulator must read `dsh> ` there) but
      // neither shown nor counted, so typing starts right after the path.
      + '\\[\\033]133;D;${__rdv_status}\\007\\033[8mdsh> \\033[0m\\033[5D\\]"',
    '}',
    'PROMPT_COMMAND=__rdv_prompt',
    'DSH_RDV_RC',
    `exec bash --rcfile ${shq(rcFile)} -i`,
  ]
  return lines.join('\n')
}

/** Everything one remote terminal needs to know about its target. */
interface RemoteTerminalOptions {
  world: RemoteWorld
  machine: MachineRef
  remotePath: string
  spec: SubprocessTerminalSpawnSpec
}

/**
 * One interactive shell on a remote machine, exposed through the terminal
 * handle contract. Construction opens the pty channel immediately.
 */
export class RemoteTerminalHandle implements SubprocessTerminalHandle {
  /** SSH does not report a remote PID; the recorded shell PID is asynchronous. */
  readonly pid = -1
  readonly output: Readable
  readonly done: Promise<SubprocessOutcome>

  private readonly world: RemoteWorld
  private readonly machine: MachineRef
  private readonly remotePath: string
  private readonly spec: SubprocessTerminalSpawnSpec
  private readonly pidFile: string
  private readonly rcFile: string
  private readonly out = new Readable({ read(): void { /* pushed by the channel */ } })
  private channel: ClientChannel | null = null
  private closed = false
  private terminated = false
  private resolveDone!: (outcome: SubprocessOutcome) => void
  private rejectDone!: (err: Error) => void
  private resolveClosed!: () => void
  private readonly closedPromise: Promise<void>
  private remotePid: number | null = null
  private activityRevision = 0
  private swallowedPwshSetup = false

  /**
   * Open the pty channel and start the shell.
   * @param options - world, machine, remote cwd, and the spawn request.
   */
  constructor(options: RemoteTerminalOptions) {
    this.world = options.world
    this.machine = options.machine
    this.remotePath = options.remotePath
    this.spec = options.spec
    const id = Math.random().toString(36).slice(2, 10)
    this.pidFile = `/tmp/.dsh-rdv-term-${id}.pid`
    this.rcFile = `/tmp/.dsh-rdv-term-${id}.rc`
    this.output = this.out
    this.closedPromise = new Promise<void>((resolve) => { this.resolveClosed = resolve })
    this.done = new Promise<SubprocessOutcome>((resolve, reject) => {
      this.resolveDone = resolve
      this.rejectDone = reject
    })
    if (options.spec.signal) {
      if (options.spec.signal.aborted) this.fail(new Error('remote terminal cancelled before start'))
      else options.spec.signal.addEventListener('abort', () => { this.fail(new Error('remote terminal cancelled before start')) }, { once: true })
    }
    void this.open()
  }

  private async open(): Promise<void> {
    try {
      const client = await this.world.poolFor(this.machine).connect()
      const command = remoteTerminalCommand(this.remotePath, this.spec, this.pidFile, this.rcFile)
      const stream = await new Promise<ClientChannel>((resolve, reject) => {
        client.exec(command, {
          pty: {
            term: 'xterm-256color',
            rows: Math.max(1, this.spec.rows),
            cols: Math.max(1, this.spec.cols),
          },
        }, (err, channel) => {
          if (err) {
            reject(new Error(`remote terminal failed to start: ${err.message}`))
            return
          }
          resolve(channel)
        })
      })
      if (this.closed) {
        try { stream.close() } catch { /* already gone */ }
        return
      }
      this.channel = stream
      stream.on('data', (chunk: Buffer) => {
        if (!this.out.destroyed) this.out.push(chunk)
      })
      stream.stderr?.on('data', (chunk: Buffer) => {
        if (!this.out.destroyed) this.out.push(chunk)
      })
      stream.on('close', (code: number | undefined, signal: string | undefined) => {
        this.settle(typeof code === 'number' ? code : null, (signal as SubprocessOutcome['signal']) ?? null)
      })
      stream.on('error', (err: Error) => {
        if (this.closed) return
        // A transport failure after publication settles as a signal death; the
        // shell did run. A failure before any byte arrived is still an error.
        this.settle(null, null)
        if (!this.out.destroyed) this.out.destroy(err)
      })
    } catch (error) {
      this.fail(error as Error)
    }
  }

  private settle(exitCode: number | null, signal: SubprocessOutcome['signal']): void {
    if (this.closed) return
    this.closed = true
    if (!this.out.destroyed) this.out.push(null)
    this.resolveClosed()
    this.resolveDone({ exitCode, signal })
    // The pid file is a scratch file on the remote machine; best-effort only.
    void this.world.execOn(this.machine, `rm -f ${shq(this.pidFile)} ${shq(this.rcFile)}`, { timeoutMs: 5_000 }).catch(() => { /* best-effort */ })
  }

  private fail(error: Error): void {
    if (this.closed) return
    this.closed = true
    if (!this.out.destroyed) this.out.destroy(error)
    this.resolveClosed()
    this.rejectDone(error)
  }

  /**
   * Deliver terminal input. The first pwsh-dialect setup line is dropped: a
   * remote bash cannot parse it, and the bootstrap already exports the marker
   * it defines.
   * @param data - text without implicit newline conversion.
   */
  async write(data: string): Promise<void> {
    if (this.closed) return
    if (!this.swallowedPwshSetup) {
      this.swallowedPwshSetup = true
      if (PWSH_SETUP.test(data)) return
    }
    if (this.channel === null) {
      // The channel opens asynchronously; buffer through the same dispatch so
      // the backend's startup text is not lost.
      await this.waitForChannel()
      if (this.closed) return
    }
    this.channel?.write(data)
  }

  /**
   * Resize the remote pty.
   * @param cols - positive column count.
   * @param rows - positive row count.
   */
  async resize(cols: number, rows: number): Promise<void> {
    if (this.closed) return
    try {
      this.channel?.setWindow(Math.max(1, rows), Math.max(1, cols), 0, 0)
    } catch {
      // A channel that closed mid-resize reports the size it had; the shell
      // keeps running with the previous geometry.
    }
  }

  /** SSH exposes no foreground process-group facts. */
  async inspectForeground(): Promise<SubprocessTerminalForeground | undefined> {
    return undefined
  }

  /** The provider cannot observe shell activity; the contract's unknown shape. */
  async inspectActivity(): Promise<SubprocessTerminalActivity> {
    this.activityRevision += 1
    return { state: 'unknown', revision: this.activityRevision }
  }

  /**
   * Signal the remote shell's process group. Control-key signals ride the pty
   * (the remote tty delivers them to whatever runs in the foreground); the
   * rest kill the recorded shell group over a separate exec channel.
   * @param signal - permitted terminal signal.
   * @returns the process-group id targeted (0 when the shell PID was not
   *   observable yet).
   */
  async signalForeground(signal: SubprocessTerminalSignal): Promise<number> {
    const key = CONTROL_KEYS[signal]
    if (key !== undefined) {
      this.channel?.write(key)
      return await this.shellPid()
    }
    const pid = await this.shellPid()
    if (pid > 0) await this.killGroup(signal, pid)
    return pid
  }

  /** Terminate the whole remote session and wait for the channel to close. */
  async terminate(): Promise<void> {
    if (this.terminated) return this.closedPromise
    this.terminated = true
    const pid = await this.shellPid()
    // The backend's own close path also awaits this; the grace gives the shell
    // a chance to run its EXIT trap before the escalation.
    if (pid > 0) await this.killGroup('SIGTERM', pid)
    const grace = setTimeout(() => {
      if (this.closed) return
      if (pid > 0) void this.killGroup('SIGKILL', pid)
      try { this.channel?.close() } catch { /* already closed */ }
    }, this.spec.graceMs > 0 ? this.spec.graceMs : DEFAULT_KILL_GRACE_MS)
    grace.unref()
    if (this.channel === null) {
      // Nothing started: closing is complete.
      this.fail(new Error('remote terminal terminated before start'))
      clearTimeout(grace)
    }
    await this.closedPromise
    clearTimeout(grace)
  }

  /** Wait until the pty channel exists (or the terminal already failed). */
  private async waitForChannel(): Promise<void> {
    for (let i = 0; i < 100 && this.channel === null && !this.closed; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  /** Read (and cache) the PID the bootstrap script recorded. */
  private async shellPid(): Promise<number> {
    if (this.remotePid !== null) return this.remotePid
    try {
      const result = await this.world.execOn(this.machine, `cat ${shq(this.pidFile)} 2>/dev/null || true`, { timeoutMs: 5_000 })
      const parsed = Number.parseInt(result.stdout.trim(), 10)
      if (Number.isFinite(parsed) && parsed > 0) this.remotePid = parsed
    } catch {
      // The shell may not have written the file yet; the caller gets 0.
    }
    return this.remotePid ?? 0
  }

  /** Signal the shell's process group (a pty session's leader owns it). */
  private async killGroup(signal: SubprocessTerminalSignal, pid: number): Promise<void> {
    await this.world.execOn(this.machine, `kill -${KILL_NAMES[signal]} -- -${pid} 2>/dev/null || kill -${KILL_NAMES[signal]} ${pid} 2>/dev/null || true`, {
      timeoutMs: 5_000,
    }).catch(() => { /* best-effort: closing the channel still tears the session down */ })
  }
}
