/**
 * The remote terminal branch: the bootstrap command it composes, and the
 * handle's translation of the terminal contract onto an SSH pty channel. A
 * fake channel stands in for the machine, so the pty/readiness/signal rules are
 * pinned without a live server.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import type { ClientChannel } from 'ssh2'
import type { SubprocessTerminalSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import { RemoteTerminalHandle, remoteTerminalCommand } from '../src/remote-terminal.ts'
import type { MachineRef, RemoteWorld } from '../src/world.ts'

const MACHINE = { source: 'registry', machine: { id: 'dev.example.com|22|dev' } } as unknown as MachineRef

function spec(overrides: Partial<SubprocessTerminalSpawnSpec> = {}): SubprocessTerminalSpawnSpec {
  return {
    argv: ['bash', '--noprofile', '--norc', '-i'],
    cwd: '/home/dev/app',
    rows: 24,
    cols: 80,
    terminalType: 'dumb',
    graceMs: 20,
    ...overrides,
  }
}

/** One fake pty channel recording what the handle sent it. */
class FakeChannel {
  readonly writes: string[] = []
  window: { rows: number; cols: number } | null = null
  closed = false
  private readonly listeners = new Map<string, (...args: unknown[]) => void>()

  on(event: string, fn: (...args: unknown[]) => void): void { this.listeners.set(event, fn) }

  write(data: string): void { this.writes.push(data) }

  setWindow(rows: number, cols: number): void { this.window = { rows, cols } }

  close(): void { this.closed = true; this.emit('close', 0, undefined) }

  emit(event: string, ...args: unknown[]): void { this.listeners.get(event)?.(...args) }
}

/** A world double: one pooled client handing out the fake channel, plus exec. */
function fakeWorld(channel: FakeChannel): { world: RemoteWorld; commands: string[]; execs: string[]; spawns: { rows?: number; cols?: number; term?: string }[] } {
  const commands: string[] = []
  const execs: string[] = []
  const spawns: { rows?: number; cols?: number; term?: string }[] = []
  const world = {
    poolFor: () => ({
      connect: async () => ({
        exec(command: string, opts: { pty?: { rows?: number; cols?: number; term?: string } }, cb: (err: undefined, stream: ClientChannel) => void): void {
          commands.push(command)
          spawns.push({ ...(opts.pty ?? {}) })
          queueMicrotask(() => cb(undefined, channel as unknown as ClientChannel))
        },
      }),
    }),
    execOn: async (_ref: unknown, command: string) => {
      execs.push(command)
      if (command.startsWith('cat ')) return { code: 0, signal: null, stdout: '4242\n', stderr: '', timedOut: false }
      return { code: 0, signal: null, stdout: '', stderr: '', timedOut: false }
    },
  } as unknown as RemoteWorld
  return { world, commands, execs, spawns }
}

test('the bootstrap cd-guards, records its pid, and loads the machine profile', () => {
  const command = remoteTerminalCommand("/home/dev/it's here", spec({ env: { DSH_HOME: '/home/dev/.dsh' } }), '/tmp/.term.pid', '/tmp/.term.rc')
  assert.ok(command.startsWith(`cd '/home/dev/it'\\''s here' ||`), 'the cd guard quotes the path')
  assert.match(command, /echo \$\$ > '\/tmp\/\.term\.pid'/, 'exec keeps the recorded pid as the shell pid')
  assert.match(command, /export DSH_HOME='\/home\/dev\/\.dsh'/, "the backend's environment crosses before the profile")
  assert.match(command, /export TERM='xterm-256color'/, 'a dumb terminal type is raised for a real emulator')
  // The rc file runs the login chain the way an interactive login shell would:
  // /etc/profile first, then the first user profile that exists.
  assert.ok(command.includes("cat > '/tmp/.term.rc' <<'DSH_RDV_RC'"), 'one generated rc file replaces the shell rc')
  assert.match(command, /\. \/etc\/profile/)
  assert.match(command, /\$HOME\/\.bash_profile/)
  assert.match(command, /\$HOME\/\.profile/)
  // The prompt and marker come after the profile, which would otherwise win.
  const rc = command.slice(command.indexOf('DSH_RDV_RC'))
  assert.ok(rc.indexOf('__rdv_prompt()') > rc.indexOf('$HOME/.profile'), 'the host prompt is installed last')
  assert.ok(command.includes('PROMPT_COMMAND=__rdv_prompt'))
  // The whole prompt is assigned to PS1 — readline only measures what it
  // prints itself, so the visible prompt must not be printed around it.
  const fn = command.slice(command.indexOf('__rdv_prompt()'), command.indexOf('PROMPT_COMMAND=__rdv_prompt'))
  assert.ok(fn.includes('PS1="'), 'PROMPT_COMMAND builds PS1 instead of printing it')
  assert.ok(!fn.includes("printf '\\033]133;D"), 'the marker is not printed separately from the prompt')
  assert.match(fn, /\\033\[1;32m\\]/, 'the prompt shows user@host in color')
  assert.match(fn, /\\033\[1;36m\\]/, 'and the working directory')
  assert.ok(fn.indexOf('${__rdv_path}') < fn.indexOf(']133;D;'), 'the path precedes the marker on the same line')
  assert.ok(fn.includes(']133;D;${__rdv_status}'), 'the marker carries the last exit status')
  // Marker and controlled token live inside ONE readline non-printing region,
  // and the cursor steps back over the token's cells: the emulator reads
  // `dsh> ` after the marker, while the prompt ends where the path ends.
  assert.match(fn, /\\\[\\033\]133;D;\$\{__rdv_status\}\\007\\033\[8mdsh> \\033\[0m\\033\[5D\\\]/,
    'the controlled token is emitted but neither shown nor counted')
  assert.ok(command.endsWith(`exec bash --rcfile '/tmp/.term.rc' -i`), 'the shell starts interactive with that rc')
  assert.ok(!command.includes('--noprofile'), 'the machine profile is no longer skipped')
})

test('spawn opens one pty channel with the requested geometry', async () => {
  const channel = new FakeChannel()
  const { world, commands, spawns } = fakeWorld(channel)
  const handle = new RemoteTerminalHandle({ world, machine: MACHINE, remotePath: '/home/dev/app', spec: spec() })
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(commands.length, 1)
  assert.deepEqual(spawns[0], { term: 'xterm-256color', rows: 24, cols: 80 })
  assert.equal(handle.pid, -1, 'SSH exposes no synchronous remote pid')
  channel.emit('data', Buffer.from('hello'))
  await new Promise((resolve) => setTimeout(resolve, 5))
  assert.ok(channel.writes.length >= 0)
  await handle.terminate()
})

test('output, input, and resize cross the channel unchanged', async () => {
  const channel = new FakeChannel()
  const { world } = fakeWorld(channel)
  const handle = new RemoteTerminalHandle({ world, machine: MACHINE, remotePath: '/home/dev/app', spec: spec() })
  await new Promise((resolve) => setTimeout(resolve, 20))
  let seen = ''
  handle.output.on('data', (chunk: Buffer) => { seen += chunk.toString('utf8') })
  channel.emit('data', Buffer.from('remote-term-ok\r\n'))
  await handle.write('echo hi\r')
  await handle.resize(120, 40)
  // A Readable delivers pushed chunks on the next macrotask.
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(seen, 'remote-term-ok\r\n')
  assert.deepEqual(channel.writes.at(-1), 'echo hi\r')
  assert.deepEqual(channel.window, { rows: 40, cols: 120 }, 'resize maps the contract order onto ssh2 setWindow(rows, cols)')
  await handle.terminate()
})

test('the pwsh setup line is swallowed, later input is not', async () => {
  const channel = new FakeChannel()
  const { world } = fakeWorld(channel)
  const handle = new RemoteTerminalHandle({ world, machine: MACHINE, remotePath: '/home/dev/app', spec: spec() })
  await new Promise((resolve) => setTimeout(resolve, 20))
  await handle.write("[Console]::OutputEncoding = [Text.UTF8Encoding]::new()\n")
  await handle.write('ls\r')
  assert.deepEqual(channel.writes, ['ls\r'], 'a remote bash cannot parse the PowerShell setup line')
  await handle.terminate()
})

test('signals use the pty control keys and the recorded process group', async () => {
  const channel = new FakeChannel()
  const { world, execs } = fakeWorld(channel)
  const handle = new RemoteTerminalHandle({ world, machine: MACHINE, remotePath: '/home/dev/app', spec: spec() })
  await new Promise((resolve) => setTimeout(resolve, 20))
  const pid = await handle.signalForeground('SIGINT')
  assert.equal(pid, 4242, 'the shell pid comes from the file the bootstrap wrote')
  assert.ok(channel.writes.includes('\x03'), 'SIGINT rides the tty, so the foreground job sees it')
  await handle.signalForeground('SIGTERM')
  assert.ok(execs.some((command) => command.includes('kill -TERM -- -4242')), 'non-key signals kill the shell group')
  assert.equal(await handle.inspectForeground(), undefined, 'SSH exposes no foreground process group')
  assert.equal((await handle.inspectActivity()).state, 'unknown')
  await handle.terminate()
})

test('terminate is idempotent and settles the handle once', async () => {
  const channel = new FakeChannel()
  const { world } = fakeWorld(channel)
  const handle = new RemoteTerminalHandle({ world, machine: MACHINE, remotePath: '/home/dev/app', spec: spec() })
  await new Promise((resolve) => setTimeout(resolve, 20))
  const done = handle.done.then((outcome) => outcome)
  await handle.terminate()
  const second = await handle.terminate()
  assert.equal(second, undefined)
  channel.close()
  const outcome = await done
  assert.equal(outcome.exitCode, 0)
})
