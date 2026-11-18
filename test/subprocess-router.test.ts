import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { Context } from '@deepseek-ai/cordis'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { RoutingSubprocessRuntime } from '../src/subprocess-router.ts'
import type { RemoteWorld, MachineRef } from '../src/world.ts'
import type { AnchorInfo, AnchorRoute } from '../src/anchors.ts'
import type { ClientChannel, SshClientLike } from '../src/pool.ts'
import type { SubprocessSpawnSpec, SubprocessTerminalSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import { parseEnvironment, ENV_HINT_PREFIX } from '../src/remote-env.ts'
import type { RemoteEnvironment } from '../src/remote-env.ts'

const ANCHOR: AnchorInfo = {
  dir: path.join(tmpdir(), 'rdv-fake-anchor'),
  meta: { host: 'dev.example.com', port: 22, username: 'dev', remotePath: '/home/dev/myapp', createdAt: '2026-01-01T00:00:00.000Z' },
  remoteRoot: '/home/dev/myapp',
}

const MACHINE: MachineRef = {
  source: 'registry',
  machine: {
    id: 'dev.example.com|22|dev', name: 'dev', host: 'dev.example.com', port: 22, username: 'dev',
    password: '', privateKeyPath: '', passphrase: '', useAgent: false, keyboardInteractive: false, hostKeyMode: 'accept-new', workspace: '', color: '',
  },
}

/** Fake channel: scripted stdout/stderr, then one close. */
type FakeStream = ClientChannel & {
  emit(event: string, ...args: unknown[]): void
  emitStderr(data: string): void
}

function fakeStream(): FakeStream {
  const listeners = new Map<string, (...args: unknown[]) => void>()
  const stderrListeners = new Map<string, (v?: unknown) => void>()
  return {
    on(event: string, fn: (...args: unknown[]) => void): void { listeners.set(event, fn) },
    stderr: { on(event: string, fn: (v?: unknown) => void): void { stderrListeners.set(event, fn) } },
    signal(): void {},
    close(): void {},
    end(): void {},
    write(): void {},
    emit(event: string, ...args: unknown[]): void { listeners.get(event)?.(...args) },
    emitStderr(data: string): void { stderrListeners.get('data')?.(Buffer.from(data)) },
  } as unknown as FakeStream
}

/**
 * A world double exposing only the surface the routing subprocess runtime
 * reads. `classify` decides remote vs local for every cwd; remote routes hand
 * commands to `onCommand` and settle with `exitCode`.
 */
function fakeWorld(options: {
  classify: (cwd: string) => { kind: 'remote'; route: AnchorRoute } | { kind: 'local' }
  machine?: MachineRef | null
  onCommand?: (command: string) => void
  exitCode?: number
  /** What the fake remote shell writes to stderr before the channel closes. */
  stderr?: string
  /** The cached probe the hint path reads, when one exists. */
  environment?: RemoteEnvironment
}): RemoteWorld {
  const client = (): SshClientLike => ({
    exec(command: string, _opts: unknown, cb: (err: Error | undefined, stream: ClientChannel) => void): void {
      options.onCommand?.(command)
      const stream = fakeStream()
      queueMicrotask(() => {
        cb(undefined, stream)
        queueMicrotask(() => {
          if (options.stderr !== undefined) stream.emitStderr(options.stderr)
          stream.emit('close', options.exitCode ?? 0, undefined)
        })
      })
    },
    sftp(): void {},
    forwardOut(): void {},
    end(): void {},
  }) as unknown as SshClientLike
  return {
    config: { remoteRipgrep: 'rg' },
    classifyHostPath: (cwd: string) => options.classify(cwd),
    machineForAnchor: () => options.machine === undefined ? MACHINE : options.machine,
    poolFor: () => ({
      connect: async () => client(),
      exec: async () => ({ code: 0, signal: undefined, timedOut: false, stdout: '', stderr: '' }),
      tunables: { maxOutputChars: 1000 },
    }),
    execOn: async () => ({ code: 0, signal: null, stdout: '', stderr: '', timedOut: false }),
    audit: () => {},
    anchors: () => [ANCHOR],
    cachedEnvironment: () => options.environment,
  } as unknown as RemoteWorld
}

function spawnSpec(cwd: string, argv: readonly string[]): SubprocessSpawnSpec {
  return {
    argv: [...argv],
    cwd,
    stdio: { stdin: 'ignore', stdout: { maxBytes: 1000, spill: { maxBytes: 1000 } }, stderr: { maxBytes: 1000, spill: { maxBytes: 1000 } } },
    graceMs: 100,
  }
}

test('anchor spawns route to the remote machine on every host platform', async () => {
  const commands: string[] = []
  const world = fakeWorld({
    classify: (cwd) => cwd.startsWith(ANCHOR.dir)
      ? { kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp/src' } }
      : { kind: 'local' },
    onCommand: (command) => commands.push(command),
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const handle = router.spawn(spawnSpec(path.join(ANCHOR.dir, 'src'), ['rg', 'pattern', 'src']))
  const outcome = await handle.done
  assert.equal(outcome.exitCode, 0)
  assert.equal(commands.length, 1, 'the spawn must cross the SSH exec channel exactly once')
  assert.match(commands[0]!, /'rg' 'pattern'/, 'the argv must travel as a quoted remote command line')
  assert.match(
    commands[0]!,
    new RegExp(`^cd '/home/dev/myapp/src'`),
    'the remote command must start in the mapped workspace path, not the SSH default cwd',
  )
  assert.match(
    commands[0]!,
    /< \/dev\/null$/,
    "stdin 'ignore' must translate to /dev/null, not a closed pipe: programs that branch on pipe-ness (ripgrep) change behavior at EOF",
  )
})

test('stdin data travels verbatim without a /dev/null redirect', async () => {
  const commands: string[] = []
  const world = fakeWorld({
    classify: () => ({ kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp' } }),
    onCommand: (command) => commands.push(command),
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const handle = router.spawn({
    ...spawnSpec(ANCHOR.dir, ['cat']),
    stdio: { stdin: { data: 'payload' }, stdout: { maxBytes: 1000, spill: { maxBytes: 1000 } }, stderr: { maxBytes: 1000, spill: { maxBytes: 1000 } } },
  })
  await handle.done
  assert.equal(commands.length, 1)
  assert.ok(!commands[0]!.includes('/dev/null'), 'genuine stdin data must not be redirected away')
})

test('local spawns delegate to the inherited runtime and never touch the pool', async () => {
  let pooled = false
  const world = fakeWorld({
    classify: () => ({ kind: 'local' }),
    onCommand: () => { pooled = true },
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const handle = router.spawn(spawnSpec(tmpdir(), [process.execPath, '-e', 'process.exit(0)']))
  const outcome = await handle.done
  assert.equal(outcome.exitCode, 0)
  assert.equal(pooled, false, 'a local cwd must not open an SSH channel')
})

test('a remote terminal spawns a pty shell on the machine instead of a local one', async () => {
  const commands: string[] = []
  let pty: { rows?: number; cols?: number } | undefined
  const listeners = new Map<string, (...args: unknown[]) => void>()
  const channel = {
    on(event: string, fn: (...args: unknown[]) => void): void { listeners.set(event, fn) },
    stderr: { on(): void {} },
    signal(): void {},
    close(): void { listeners.get('close')?.(0, undefined) },
    end(): void {},
    write(): void {},
    setWindow(): void {},
  }
  const world = fakeWorld({
    classify: (cwd) => cwd.startsWith(ANCHOR.dir)
      ? { kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp' } }
      : { kind: 'local' },
  })
  ;(world.poolFor as unknown as (ref: unknown) => unknown) = () => ({
    connect: async () => ({
      exec(command: string, opts: { pty?: { rows?: number; cols?: number } }, cb: (err: undefined, stream: unknown) => void): void {
        commands.push(command)
        pty = opts.pty
        queueMicrotask(() => cb(undefined, channel))
      },
    }),
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const spec = { cwd: ANCHOR.dir, rows: 24, cols: 80, terminalType: 'dumb', graceMs: 10 } as SubprocessTerminalSpawnSpec
  const handle = await router.spawnTerminal(spec)
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(commands.length, 1, 'the terminal crosses the SSH exec channel exactly once')
  assert.ok(commands[0]!.includes('/home/dev/myapp'), 'the remote cwd is the shell\'s start directory')
  assert.ok(commands[0]!.includes(']133;D;'), 'the prompt marker the host emulator reads as readiness')
  assert.deepEqual(pty, { term: 'xterm-256color', rows: 24, cols: 80 })
  channel.close()
  await handle.terminate()
})

test('a remote terminal whose machine is gone refuses instead of running locally', async () => {
  const world = fakeWorld({
    classify: () => ({ kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp' } }),
    machine: null,
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const spec = { cwd: ANCHOR.dir } as SubprocessTerminalSpawnSpec
  await assert.rejects(router.spawnTerminal(spec), /no longer configured/)
})

/** The cached verdict a machine that lacks rg would have. */
const RG_MISSING: RemoteEnvironment = parseEnvironment([
  'os\tLinux',
  'arch\tx86_64',
  'bash\tGNU bash, version 5.1.16(1)-release',
  'rg\t',
  'rgver\t',
  'git\t/usr/bin/git',
  'tar\t/usr/bin/tar',
  'curl\t/usr/bin/curl',
  'wget\t',
  'sudo\t/usr/bin/sudo',
  'home\t/home/dev',
  'homew\t1',
  'path\t/usr/bin:/bin',
  'writepath\t',
].join('\n'), 'dev.example.com|22|dev', '2026-01-01T00:00:00.000Z')

test('a rewritten ripgrep that exits 127 explains itself in the captured stderr', async () => {
  const world = fakeWorld({
    classify: () => ({ kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp' } }),
    exitCode: 127,
    stderr: 'bash: rg: command not found\n',
    environment: RG_MISSING,
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const handle = router.spawn(spawnSpec(ANCHOR.dir, ['rg', '--files', 'src']))
  await handle.done
  const stderr = handle.collected.stderr?.readFrom(0).text ?? ''
  assert.match(stderr, /bash: rg: command not found/, 'the remote shell evidence is preserved')
  assert.ok(stderr.includes(ENV_HINT_PREFIX), 'the hint rides the same stderr the search tools quote')
  assert.match(stderr, /dev@dev\.example\.com:22/, 'the hint names the machine')
  assert.match(stderr, /sudo apt-get update && sudo apt-get install -y ripgrep/)
})

test('exit 127 from a command that was not ripgrep gets no environment hint', async () => {
  const world = fakeWorld({
    classify: () => ({ kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp' } }),
    exitCode: 127,
    stderr: 'bash: npm: command not found\n',
    environment: RG_MISSING,
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  const handle = router.spawn(spawnSpec(ANCHOR.dir, ['npm', 'run', 'build']))
  await handle.done
  const stderr = handle.collected.stderr?.readFrom(0).text ?? ''
  assert.equal(stderr.includes(ENV_HINT_PREFIX), false, 'only the rewrite this plugin performed is explained')
})

test('an anchor whose machine is gone refuses instead of running locally', () => {
  const world = fakeWorld({
    classify: () => ({ kind: 'remote', route: { anchor: ANCHOR, remotePath: '/home/dev/myapp' } }),
    machine: null,
  })
  const router = new RoutingSubprocessRuntime(new Context(), world)
  assert.throws(() => router.spawn(spawnSpec(ANCHOR.dir, ['rg', 'x'])), /no longer configured/)
})
