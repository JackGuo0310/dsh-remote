/**
 * The `POST /env` route, driven over real HTTP against a real `RemoteWorld`
 * whose SSH transport is scripted. The probe goes through the pool, the
 * parser, and the route's response shape, so the settings page's check button
 * is exercised end to end without a live server.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { RemoteWorld } from '../src/world.ts'
import { registerRoutes } from '../src/routes.ts'
import { ForwardManager } from '../src/forward.ts'
import { ENV_PROBE_SCRIPT } from '../src/remote-env.ts'
import type { Config } from '../src/config.ts'
import type { ClientChannel, SshClientLike } from '../src/pool.ts'

/** The transcript a machine without ripgrep prints. */
const TRANSCRIPT = [
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
  'home\t/home/jack',
  'homew\t1',
  'path\t/usr/bin:/bin',
  'writepath\t',
].join('\n') + '\n'

function baseConfig(anchorRoot: string): Config {
  return {
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKeyPath: '',
    passphrase: '',
    workspace: '',
    commandTimeoutMs: 2000,
    connectTimeoutMs: 2000,
    maxOutputChars: 2000,
    maxFileBytes: 1024,
    hostKeyMode: 'accept-new',
    useAgent: false,
    keyboardInteractive: false,
    proxy: { host: '', port: 22, username: '', password: '', privateKeyPath: '', passphrase: '' },
    auditLog: false,
    anchorRoot,
    remoteRipgrep: 'rg',
    localPicker: 'browse',
    maxForwards: 8,
  }
}

function fakeChannel(): ClientChannel {
  const listeners = new Map<string, (v?: unknown) => void>()
  return {
    on(event: string, fn: (v?: unknown) => void): void { listeners.set(event, fn) },
    stderr: { on(): void {} },
    signal(): void {},
    close(): void {},
    end(): void {},
    emit(event: string, v?: unknown): void { listeners.get(event)?.(v) },
  } as unknown as ClientChannel
}

/**
 * A scripted SSH client: platform detection answers Linux, the environment
 * probe answers the transcript, and every other exec is a no-op. The probe
 * count lets a test prove the cache (not the pool) served a repeated read.
 */
function scripted(transcript: string): { factory: () => SshClientLike; probes: () => number } {
  let probeCount = 0
  const factory = (): SshClientLike => {
    const handlers = new Map<string, (v?: unknown) => void>()
    const client = {
      on(event: string, fn: (v?: unknown) => void): unknown { handlers.set(event, fn); return undefined },
      connect(): void { queueMicrotask(() => handlers.get('ready')?.()) },
      exec(command: string, _o: unknown, cb: (err: Error | undefined, stream: ClientChannel) => void): void {
        if (command === ENV_PROBE_SCRIPT) probeCount += 1
        const out = command === 'uname -s' ? 'Linux' : command === ENV_PROBE_SCRIPT ? transcript : ''
        const stream = fakeChannel()
        queueMicrotask(() => {
          cb(undefined, stream)
          queueMicrotask(() => stream.emit('data', Buffer.from(out)))
          queueMicrotask(() => stream.emit('close', 0, undefined))
        })
      },
      sftp(cb: (err: Error | undefined, sftp: unknown) => void): void { cb(new Error('unused'), undefined) },
      forwardOut(): void {},
      end(): void {},
    }
    return client as unknown as SshClientLike
  }
  return { factory, probes: () => probeCount }
}

/** A live HTTP server with the plugin's routes mounted, plus its base URL. */
async function serve(world: RemoteWorld): Promise<{ url: string; close: () => Promise<void> }> {
  const registered: { dispose: () => void }[] = []
  const server: Server = createServer()
  // One listener per registered route: the count is the route table, not a leak.
  server.setMaxListeners(0)
  const ctx = new Context()
  ctx.effect(() => () => { for (const d of registered) d.dispose() })
  const webServer = {
    register(route: { path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }) {
      const onRequest = (req: IncomingMessage, res: ServerResponse): void => { void route.handler(req, res) }
      server.on('request', (req, res) => {
        if ((req.url ?? '').split('?')[0] === route.path) onRequest(req, res)
      })
      const dispose = (): void => { server.off('request', undefined as never) }
      registered.push({ dispose })
      return dispose
    },
  }
  registerRoutes(ctx, webServer as never, world, new ForwardManager(world))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return {
    url: `http://127.0.0.1:${port}/dsh-remote-development`,
    close: async () => { await new Promise<void>((resolve) => server.close(() => resolve())) },
  }
}

interface EnvResponse {
  ok: boolean
  error?: string
  problems?: { id: string; severity: string; commands: { label: string; command: string }[] }[]
  environment?: { platform: string; arch: string; rgPath: string; checkedAt: string }
}

async function postEnv(base: string, body: Record<string, unknown>): Promise<EnvResponse> {
  const res = await fetch(`${base}/env`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return await res.json() as EnvResponse
}

/** One isolated world over a temporary anchor root. */
function makeWorld(): { world: RemoteWorld; script: ReturnType<typeof scripted>; root: string } {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-env-route-'))
  const script = scripted(TRANSCRIPT)
  const world = new RemoteWorld(baseConfig(root), script.factory)
  world.upsertMachine({ host: '100.117.157.9', port: 22, username: 'jack', name: 'build', password: 'secret' })
  return { world, script, root }
}

test('POST /env probes the machine and reports the missing prerequisites', async () => {
  const { world, root } = makeWorld()
  const server = await serve(world)
  try {
    const body = await postEnv(server.url, { machineId: world.listMachines()[0]!.id })
    assert.equal(body.ok, true)
    assert.equal(body.environment?.platform, 'Linux')
    assert.equal(body.environment?.arch, 'x86_64')
    assert.equal(body.problems?.length, 1, 'only ripgrep is missing in this transcript')
    assert.equal(body.problems?.[0]?.id, 'rg')
    assert.deepEqual(body.problems?.[0]?.commands.map((c) => c.label), ['apt', 'no sudo'])
    assert.match(body.problems?.[0]!.commands[0]!.command, /apt-get install -y ripgrep/)
  } finally {
    await server.close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('POST /env serves the cache unless the caller asks for a refresh', async () => {
  const { world, script, root } = makeWorld()
  const server = await serve(world)
  try {
    const machineId = world.listMachines()[0]!.id
    await postEnv(server.url, { machineId })
    assert.equal(script.probes(), 1, 'the first call measures the machine')
    await postEnv(server.url, { machineId })
    assert.equal(script.probes(), 1, 'a repeated read is answered from the cached verdict')
    await postEnv(server.url, { machineId, refresh: true })
    assert.equal(script.probes(), 2, 'refresh is the settings page\'s re-check')
  } finally {
    await server.close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('POST /env rejects an unknown machine without probing', async () => {
  const { world, script, root } = makeWorld()
  const server = await serve(world)
  try {
    const res = await fetch(`${server.url}/env`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'nowhere|22|nobody' }),
    })
    assert.equal(res.status, 400)
    const body = await res.json() as { ok: boolean; error: string }
    assert.equal(body.ok, false)
    assert.match(body.error, /no saved machine matches/)
    assert.equal(script.probes(), 0)
  } finally {
    await server.close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
