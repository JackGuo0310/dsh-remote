/**
 * The remote Git routes and the session-scope route, driven through the real
 * handlers with a scripted `execOn`: authorization (a path must belong to the
 * named machine's anchor), command composition, and response shapes are
 * exercised without SSH or a browser.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { RemoteWorld } from '../src/world.ts'
import { registerRoutes } from '../src/routes.ts'
import { ForwardManager } from '../src/forward.ts'
import type { Config } from '../src/config.ts'

const REMOTE_ROOT = '/home/dev/app'

function baseConfig(anchorRoot: string): Config {
  return {
    host: '', port: 22, username: '', password: '', privateKeyPath: '', passphrase: '', workspace: '',
    commandTimeoutMs: 2000, connectTimeoutMs: 2000, maxOutputChars: 20000, maxFileBytes: 1024,
    hostKeyMode: 'accept-new', useAgent: false, keyboardInteractive: false,
    proxy: { host: '', port: 22, username: '', password: '', privateKeyPath: '', passphrase: '' },
    auditLog: false, anchorRoot, remoteRipgrep: 'rg', localPicker: 'browse', maxForwards: 8,
  }
}

/** A response double that captures the JSON body the handler wrote. */
class FakeResponse {
  status = 0
  private text = ''
  writeHead(status: number): this { this.status = status; return this }
  end(chunk?: string): void { this.text = chunk ?? '' }
  get body(): Record<string, unknown> { return this.text === '' ? {} : JSON.parse(this.text) as Record<string, unknown> }
}

/** One registered route handler, as the plugin's web server would hold it. */
type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>

/** A scripted exec result. */
interface ExecResult { code: number; signal: null; stdout: string; stderr: string; timedOut: boolean }

/**
 * Boot the plugin's routes over a live world whose exec is scripted.
 * @param script - decides each command's result.
 */
function boot(script: (command: string, opts: { stdin?: string }) => ExecResult): {
  call: (method: string, route: string, body?: unknown) => Promise<{ status: number; body: Record<string, unknown> }>
  calls: { command: string; stdin?: string }[]
  world: RemoteWorld
  root: string
  ctx: Context
} {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-git-routes-'))
  const world = new RemoteWorld(baseConfig(root))
  world.upsertMachine({ name: 'build', host: 'dev.example.com', port: 22, username: 'dev', password: 'pw' })
  const machine = world.listMachines()[0]!
  world.createAnchor(machine, REMOTE_ROOT)
  const calls: { command: string; stdin?: string }[] = []
  world.execOn = (async (_ref: unknown, command: string, opts: { stdin?: string } = {}) => {
    calls.push({ command, ...(opts.stdin === undefined ? {} : { stdin: opts.stdin }) })
    return script(command, opts)
  }) as never

  const handlers = new Map<string, Handler>()
  const ctx = new Context()
  registerRoutes(ctx, {
    register(route: { path: string; handler: Handler }) {
      handlers.set(route.path, route.handler)
      return () => handlers.delete(route.path)
    },
  } as never, world, new ForwardManager(world))

  const call = async (method: string, route: string, body?: unknown): Promise<{ status: number; body: Record<string, unknown> }> => {
    const handler = handlers.get('/dsh-remote-development' + route.split('?')[0]!)
    assert.ok(handler, `route ${route} must be registered`)
    const req = new PassThrough() as unknown as IncomingMessage
    Object.assign(req, { method, url: '/dsh-remote-development' + route })
    ;(req as unknown as PassThrough).end(body === undefined ? '' : JSON.stringify(body))
    const res = new FakeResponse()
    await handler(req, res as unknown as ServerResponse)
    return { status: res.status, body: res.body }
  }
  return { call, calls, world, root, ctx }
}

/** The default scripted remote: one repo with one modified and one new file. */
function gitScript(command: string): ExecResult {
  if (command.includes('rev-parse --show-toplevel')) return { code: 0, signal: null, stdout: `${REMOTE_ROOT}\n`, stderr: '', timedOut: false }
  if (command.includes('status --porcelain')) {
    return { code: 0, signal: null, stdout: '## main\u0000 M a.txt\u0000?? b.txt\u0000', stderr: '', timedOut: false }
  }
  if (command.includes('--no-index')) return { code: 1, signal: null, stdout: 'diff --git a/dev/null b/b.txt\n+new\n', stderr: '', timedOut: false }
  if (command.includes(' diff ')) return { code: 0, signal: null, stdout: 'diff --git a/a.txt b/a.txt\n-x\n+y\n', stderr: '', timedOut: false }
  if (command.includes('commit')) return { code: 0, signal: null, stdout: '[main 1a2b3c4] msg\n', stderr: '', timedOut: false }
  return { code: 0, signal: null, stdout: '', stderr: '', timedOut: false }
}

test('status resolves the repository root and parses the porcelain rows', async () => {
  const { call, world, root } = boot(gitScript)
  try {
    const machineId = world.listMachines()[0]!.id
    const answer = await call('POST', '/git/status', { machineId, path: REMOTE_ROOT })
    assert.equal(answer.status, 200)
    assert.equal(answer.body.ok, true)
    const status = answer.body.status as { isRepo: boolean; root: string; branch: string; entries: { path: string; xy: string }[] }
    assert.equal(status.isRepo, true)
    assert.equal(status.root, REMOTE_ROOT)
    assert.equal(status.branch, 'main')
    assert.deepEqual(status.entries, [{ path: 'a.txt', xy: ' M' }, { path: 'b.txt', xy: '??' }])
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('an untracked diff treats exit 1 as content, not failure', async () => {
  const { call, world, root } = boot(gitScript)
  try {
    const machineId = world.listMachines()[0]!.id
    const answer = await call('POST', '/git/diff', { machineId, path: REMOTE_ROOT, file: 'b.txt', untracked: true })
    assert.equal(answer.body.ok, true)
    assert.match(String(answer.body.diff), /\+new/)
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('a workspace outside every anchor is refused before any command runs', async () => {
  const { call, world, root, calls } = boot(gitScript)
  try {
    const machineId = world.listMachines()[0]!.id
    const answer = await call('POST', '/git/status', { machineId, path: '/etc' })
    assert.equal(answer.status, 400)
    assert.match(String(answer.body.error), /under a workspace anchor/)
    assert.deepEqual(calls, [], 'an unauthorized path must not reach the machine')
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('stage and unstage quote every path and stay inside the repository', async () => {
  const { call, world, root, calls } = boot(gitScript)
  try {
    const machineId = world.listMachines()[0]!.id
    await call('POST', '/git/stage', { machineId, path: REMOTE_ROOT, files: ["a.txt", "it's b.txt"] })
    await call('POST', '/git/unstage', { machineId, path: REMOTE_ROOT, files: ['a.txt'] })
    assert.ok(calls.some((entry) => entry.command === `git -C '${REMOTE_ROOT}' add -- 'a.txt' 'it'\\''s b.txt'`), calls.map((c) => c.command).join('\n'))
    assert.ok(calls.some((entry) => entry.command === `git -C '${REMOTE_ROOT}' restore --staged -- 'a.txt'`))
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('commit carries the message on stdin and refuses an empty one', async () => {
  const { call, world, root, calls } = boot(gitScript)
  try {
    const machineId = world.listMachines()[0]!.id
    const empty = await call('POST', '/git/commit', { machineId, path: REMOTE_ROOT, message: '   ' })
    assert.equal(empty.status, 400)
    assert.equal(calls.length, 0, 'nothing runs without a message')
    const answer = await call('POST', '/git/commit', { machineId, path: REMOTE_ROOT, message: 'fix: quote "this"' })
    assert.equal(answer.body.ok, true)
    assert.equal(calls.at(-1)?.stdin, 'fix: quote "this"', 'the message never becomes shell syntax')
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('session-remote says pending until the host has loaded the session', async () => {
  const { call, world, root, ctx } = boot(gitScript)
  try {
    // The session store starts empty (as a restored tab's first request can
    // find it) and gains the session the moment the host loads it.
    let loaded = false
    const machine = world.listMachines()[0]!
    const anchor = world.createAnchor(machine, REMOTE_ROOT)
    ;(ctx as unknown as { provide(name: string, value: unknown): void }).provide('sessions', {
      get: (id: string) => (id === 's1' && loaded ? { header: { cwd: anchor } } : undefined),
    })
    const before = await call('GET', '/session-remote?sessionId=s1')
    assert.deepEqual(before.body, { remote: false, pending: true }, 'an unknown session is not a local workspace')
    loaded = true
    const after = await call('GET', '/session-remote?sessionId=s1')
    assert.equal(after.body.remote, true)
    assert.equal(after.body.remotePath, REMOTE_ROOT)
    assert.equal(after.body.machineId, machine.id)
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
