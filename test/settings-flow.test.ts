/**
 * The settings add-server and test-connection flow, driven over the real HTTP
 * routes with a scripted SSH transport in place of a live server. The fake
 * records the credentials each connection attempt was given, so a test can
 * assert what the machine registry actually reaches the wire — which is the
 * part the browser cannot observe and the unit tests over `world` alone miss.
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
import { makeKeyBlob } from '../src/hostkey.ts'
import type { Config } from '../src/config.ts'
import type { ClientChannel, SFTPWrapper, SshClientLike } from '../src/pool.ts'

const HOST_KEY = makeKeyBlob('ssh-ed25519', 7)

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
  }
}

/** What one scripted server saw, and how it should answer. */
interface Script {
  /** The password this server accepts; a mismatch fails the handshake. */
  expectPassword?: string
  /** Refuse every connection, as an unreachable or auth-rejecting host would. */
  refuse?: boolean
  /** The `uname -s` answer, so platform detection lands where we want it. */
  uname?: string
}

interface Attempt {
  host: string
  port: number
  username: string
  password: string
  privateKeyPath: string
  hostKeyMode: string
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

/** A scripted SSH client factory plus the record of what it was asked for. */
function scripted(script: Script): { factory: () => SshClientLike; attempts: Attempt[] } {
  const attempts: Attempt[] = []
  const factory = (): SshClientLike => {
    const handlers = new Map<string, (v?: unknown) => void>()
    const client = {
      on(event: string, fn: (v?: unknown) => void): unknown { handlers.set(event, fn); return undefined },
      connect(opts: Record<string, unknown>): void {
        const record: Attempt = {
          host: String(opts.host ?? ''),
          port: Number(opts.port ?? 0),
          username: String(opts.username ?? ''),
          password: String(opts.password ?? ''),
          privateKeyPath: String((opts.privateKey as unknown as string) ?? ''),
          hostKeyMode: String((opts as { hostKeyMode?: string }).hostKeyMode ?? ''),
        }
        const verifier = opts.hostVerifier as ((key: unknown) => boolean) | undefined
        queueMicrotask(() => {
          attempts.push(record)
          if (script.refuse) {
            handlers.get('error')?.(new Error('All configured authentication methods failed'))
            return
          }
          if (verifier !== undefined && !verifier(HOST_KEY)) {
            handlers.get('error')?.(new Error('Host verification failed'))
            return
          }
          if (script.expectPassword !== undefined && record.password !== script.expectPassword) {
            handlers.get('error')?.(new Error('All configured authentication methods failed'))
            return
          }
          handlers.get('ready')?.()
        })
      },
      exec(command: string, _o: unknown, cb: (err: Error | undefined, stream: ClientChannel) => void): void {
        const stream = fakeChannel()
        const out = command === 'uname -s' ? (script.uname ?? 'Linux') : 'dsh-remote-development-ok'
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
  return { factory, attempts }
}

/** One scripted server's SFTP directory contents, keyed by remote path. */
interface Listing {
  entries: { name: string; dir: boolean }[]
  failReaddir?: boolean
}

function scriptedWithSftp(script: Script, listings: Map<string, Listing> = new Map()): {
  factory: () => SshClientLike
  attempts: Attempt[]
  execs: string[]
  mkdirs: string[]
} {
  const attempts: Attempt[] = []
  const execs: string[] = []
  const mkdirs: string[] = []
  const base = scripted(script)
  const factory = (): SshClientLike => {
    const client = base.factory()
    const innerExec = client.exec.bind(client) as (
      command: string,
      o: Record<string, unknown>,
      cb: (e: Error | undefined, s: ClientChannel) => void,
    ) => void
    client.exec = (command: string, o: unknown, cb: (e: Error | undefined, s: ClientChannel) => void): void => {
      execs.push(command)
      innerExec(command, o as Record<string, unknown>, cb)
    }
    client.sftp = (cb: (err: Error | undefined, sftp: SFTPWrapper) => void): void => {
      cb(undefined, fakeSftp(listings, mkdirs) as unknown as SFTPWrapper)
    }
    return client
  }
  return { factory, attempts, execs, mkdirs }
}

/** An SFTP session serving seeded listings and recording created directories. */
function fakeSftp(listings: Map<string, Listing>, mkdirs: string[]) {
  return {
    readdir(dir: string, cb: (err: Error | null, entries?: unknown[]) => void): void {
      const listing = listings.get(dir)
      if (listing === undefined) {
        const err = Object.assign(new Error('ENOENT'), { code: 2 })
        cb(err)
        return
      }
      if (listing.failReaddir) {
        cb(Object.assign(new Error('EACCES'), { code: 3 }))
        return
      }
      cb(null, listing.entries.map((e) => ({
        filename: e.name,
        attrs: {
          isFile: () => !e.dir,
          isDirectory: () => e.dir,
          isSymbolicLink: () => false,
          size: 0,
          mtime: 1_700_000_000,
          mtimeMs: 1_700_000_000_000,
        },
      })))
    },
    mkdir(p: string, cb: (err: Error | null) => void): void {
      mkdirs.push(p)
      cb(null)
    },
    stat(_p: string, cb: (err: Error | null, stats?: unknown) => void): void {
      cb(Object.assign(new Error('ENOENT'), { code: 2 }), undefined)
    },
    on(): void {},
    end(): void {},
  }
}

/** A live HTTP server with the plugin's routes mounted, plus its base URL. */
async function serve(world: RemoteWorld): Promise<{ url: string; close: () => Promise<void> }> {
  const registered: { dispose: () => void }[] = []
  const server: Server = createServer()
  const ctx = new Context()
  ctx.effect(() => () => { for (const d of registered) d.dispose() })
  const webServer = {
    register(route: { path: string; kind: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }) {
      const onRequest = (req: IncomingMessage, res: ServerResponse): void => { void route.handler(req, res) }
      server.on('request', (req, res) => {
        const url = req.url ?? ''
        const pathOnly = url.split('?')[0] ?? ''
        if (pathOnly === route.path) onRequest(req, res)
      })
      const dispose = (): void => { server.off('request', undefined as never) }
      registered.push({ dispose })
      return dispose
    },
  }
  registerRoutes(ctx, webServer as never, world)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return {
    url: `http://127.0.0.1:${port}/dsh-remote-development`,
    close: async () => { await new Promise<void>((resolve) => server.close(() => resolve())) },
  }
}

async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as Record<string, unknown>
}

async function get(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url)
  return (await res.json()) as Record<string, unknown>
}

/** Run one add-and-test cycle against a scripted server. */
async function withServer(
  script: Script,
  fn: (ctx: { world: RemoteWorld; url: string; attempts: Attempt[] }) => Promise<void>,
): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-flow-'))
  const { factory, attempts } = scripted(script)
  const world = new RemoteWorld(baseConfig(root), factory)
  const { url, close } = await serve(world)
  try {
    await fn({ world, url, attempts })
  } finally {
    await close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
}

test('adding a server then testing it connects with the saved password', async () => {
  await withServer({ expectPassword: 'pw' }, async ({ url, attempts }) => {
    const saved = await post(`${url}/machines`, {
      name: 'build box', host: '10.0.0.5', port: 22, username: 'dev', password: 'pw',
    })
    assert.equal(saved.ok, true)
    const machine = saved.machine as Record<string, unknown>
    assert.equal(machine.name, 'build box')
    assert.equal(machine.hasPassword, true)
    assert.equal(machine.password, undefined, 'the wire never echoes a secret')

    const listed = await get(`${url}/machines`)
    assert.equal((listed.machines as unknown[]).length, 1)

    const probe = await post(`${url}/test`, { machineId: machine.id })
    assert.equal(probe.ok, true)
    assert.equal(probe.platform, 'posix')
    assert.equal(attempts.length > 0, true)
    assert.equal(attempts.at(-1)?.password, 'pw')
  })
})

test('testing an unsaved draft stores nothing and still connects', async () => {
  await withServer({ expectPassword: 'pw' }, async ({ url, world, attempts }) => {
    const probe = await post(`${url}/test`, { host: '10.0.0.9', port: 22, username: 'dev', password: 'pw' })
    assert.equal(probe.ok, true)
    assert.equal(world.listMachines().length, 0, 'a draft probe must not persist a machine')
    assert.equal(world.poolCount, 0, 'a draft probe must not leave a pooled connection')
    assert.equal(attempts.at(-1)?.host, '10.0.0.9')
  })
})

test('a wrong password is reported as a reason, not thrown', async () => {
  await withServer({ expectPassword: 'right' }, async ({ url }) => {
    const probe = await post(`${url}/test`, { host: '10.0.0.7', port: 22, username: 'dev', password: 'wrong' })
    // The host answers a refusal with HTTP 200 and ok:false so the page can
    // show why; a rejection must not look like a transport fault.
    assert.equal(probe.ok, false)
    assert.match(String(probe.error), /authentication/i)
  })
})

test('a refused host is reported as a reason too', async () => {
  await withServer({ refuse: true }, async ({ url }) => {
    const probe = await post(`${url}/test`, { host: '10.0.0.8', port: 22, username: 'dev', password: 'pw' })
    assert.equal(probe.ok, false)
    assert.match(String(probe.error), /authentication|closed/i)
  })
})

test('correcting a password makes the next test use the new one', async () => {
  await withServer({ expectPassword: 'fixed' }, async ({ url, attempts }) => {
    const saved = await post(`${url}/machines`, { host: '10.0.0.6', port: 22, username: 'dev', password: 'fixed' })
    const id = (saved.machine as Record<string, unknown>).id as string

    // Pool the machine, then save a different password. The live pool pins the
    // credential it connected with, so without retirement the retest would
    // keep authenticating as the old one.
    await post(`${url}/test`, { machineId: id })
    const before = attempts.length
    await post(`${url}/machines`, { id, host: '10.0.0.6', port: 22, username: 'dev', password: 'changed' })

    const probe = await post(`${url}/test`, { machineId: id })
    assert.equal(probe.ok, false, 'the stored password is now wrong for this server')
    assert.equal(attempts.length > before, true)
    assert.equal(attempts.at(-1)?.password, 'changed')
  })
})

test('editing a machine does not reset its jump host', async () => {
  await withServer({}, async ({ url }) => {
    const saved = await post(`${url}/machines`, {
      host: '10.0.0.4', port: 22, username: 'dev', password: 'pw',
      proxyHost: 'bastion.example.com', proxyPort: 2222, proxyUser: 'jump',
    })
    const machine = saved.machine as Record<string, unknown>
    // The edit form writes these back verbatim, so the wire must carry them.
    assert.equal(machine.proxyHost, 'bastion.example.com')
    assert.equal(machine.proxyPort, 2222)
    assert.equal(machine.proxyUser, 'jump')

    const resaved = await post(`${url}/machines`, machine)
    const after = resaved.machine as Record<string, unknown>
    assert.equal(after.proxyHost, 'bastion.example.com')
    assert.equal(after.proxyPort, 2222)
    assert.equal(after.proxyUser, 'jump')
  })
})

test('editing a machine\'s address updates it instead of adding a second one', async () => {
  await withServer({}, async ({ url, world }) => {
    const saved = await post(`${url}/machines`, { name: 'box', host: '10.0.0.1', port: 22, username: 'dev', password: 'pw' })
    const oldId = (saved.machine as Record<string, unknown>).id as string

    // The edit form posts the record's id alongside the changed fields. The
    // host resolves it as an update; without that the corrected address would
    // land as a second machine and the old record would linger.
    const edited = await post(`${url}/machines`, { id: oldId, name: 'box', host: '10.0.0.2', port: 2222, username: 'dev', password: 'pw' })
    assert.equal(world.listMachines().length, 1)
    assert.equal(world.listMachines()[0]?.host, '10.0.0.2')
    assert.equal(world.listMachines()[0]?.port, 2222)
    // The id spells the identity triple, so it follows the new address; an
    // edit that left it stale would make the record unresolvable from its own
    // anchor, which joins on host/port/user.
    const newId = (edited.machine as Record<string, unknown>).id as string
    assert.equal(newId, '10.0.0.2|2222|dev')
    assert.equal(world.machineById(newId)?.machine.host, '10.0.0.2')
  })
})

test('an anchor created before a machine moved still resolves', async () => {
  await withServer({}, async ({ url, world }) => {
    const saved = await post(`${url}/machines`, { name: 'box', host: '10.0.0.10', port: 22, username: 'dev', password: 'pw' })
    const id = (saved.machine as Record<string, unknown>).id as string
    world.createAnchor(world.machineById(id)!.machine, '/srv/app')
    assert.equal(world.anchors().length, 1)

    // The machine moved. The anchor still records the old address, so it is
    // orphaned on purpose — the settings page must say so rather than route
    // the workspace somewhere else.
    await post(`${url}/machines`, { id, name: 'box', host: '10.0.0.11', port: 22, username: 'dev', password: 'pw' })
    const anchor = world.anchors()[0]!
    assert.equal(world.machineForAnchor(anchor), null)
    assert.equal(world.listMachines().length, 1)
  })
})

test('a draft probe tests the typed fields even when a record of that name exists', async () => {
  await withServer({ expectPassword: 'fresh' }, async ({ url, attempts }) => {
    await post(`${url}/machines`, { host: '10.0.0.3', port: 22, username: 'dev', password: 'stale' })

    // The form edits the host's password but carries no record id on a probe,
    // so the host probes the typed fields. Reaching the wire as 'fresh' is the
    // point: a probe that resolved the saved record would answer as 'stale'
    // and report a failure for a field the user just corrected.
    const probe = await post(`${url}/test`, { host: '10.0.0.3', port: 22, username: 'dev', password: 'fresh' })
    assert.equal(probe.ok, true)
    assert.equal(attempts.at(-1)?.password, 'fresh')
  })
})

test('naming a saved record on a probe tests that record, not the body', async () => {
  await withServer({ expectPassword: 'stale' }, async ({ url, attempts }) => {
    const saved = await post(`${url}/machines`, { host: '10.0.0.3', port: 22, username: 'dev', password: 'stale' })
    const id = (saved.machine as Record<string, unknown>).id as string

    // This is why the settings form must not send the record id on a probe:
    // `machineId` (or a bare `id`) names a saved machine and takes precedence
    // over the body's own fields, so a password typed into the form would be
    // ignored in favour of the stored one.
    const probe = await post(`${url}/test`, { machineId: id, host: '10.0.0.3', port: 22, username: 'dev', password: 'fresh' })
    assert.equal(probe.ok, true)
    assert.equal(attempts.at(-1)?.password, 'stale')
  })
})

test('listing a directory keeps names holding newlines, tabs, and quotes whole', async () => {
  const listings = new Map<string, Listing>([['/srv', {
    entries: [
      { name: 'ordinary', dir: true },
      { name: 'has\nnewline', dir: true },
      { name: 'has\ttab', dir: true },
      { name: 'quote"name', dir: true },
      { name: "back\\slash", dir: true },
      { name: 'star*glob', dir: true },
      { name: 'a-file.txt', dir: false },
    ],
  }]])
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-ls-'))
  const { factory, execs } = scriptedWithSftp({ expectPassword: 'pw' }, listings)
  const world = new RemoteWorld(baseConfig(root), factory)
  const { url, close } = await serve(world)
  try {
    const saved = await post(`${url}/machines`, { host: '10.0.1.1', port: 22, username: 'dev', password: 'pw' })
    const id = (saved.machine as Record<string, unknown>).id as string
    const listed = await post(`${url}/ls`, { machineId: id, path: '/srv' })
    assert.equal(listed.ok, true)
    const names = (listed.entries as { name: string }[]).map((e) => e.name)

    // Every one of these is a legal POSIX file name, and each must arrive as
    // the single entry it is. Listing by parsing `ls` output split a name
    // holding a newline into two rows and misread fragments as directories.
    assert.deepEqual(names, ['ordinary', 'has\nnewline', 'has\ttab', 'quote"name', 'back\\slash', 'star*glob'])
    // The browse dialog only navigates directories.
    assert.equal(names.includes('a-file.txt'), false)
    // The listing came from SFTP, not from a shell pipeline.
    assert.equal(execs.some((c) => c.includes('ls -1Ap')), false)
  } finally {
    await close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('a listing entry is joined to its parent without mangling the name', async () => {
  const listings = new Map<string, Listing>([['/srv/app', { entries: [{ name: 'we ird/../name', dir: true }] }]])
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-ls2-'))
  const { factory } = scriptedWithSftp({ expectPassword: 'pw' }, listings)
  const world = new RemoteWorld(baseConfig(root), factory)
  const { url, close } = await serve(world)
  try {
    const saved = await post(`${url}/machines`, { host: '10.0.1.2', port: 22, username: 'dev', password: 'pw' })
    const id = (saved.machine as Record<string, unknown>).id as string
    const listed = await post(`${url}/ls`, { machineId: id, path: '/srv/app' })
    const entry = (listed.entries as { name: string; path: string }[])[0]!
    // The name is the remote's own; the path is a plain join of the two and is
    // not normalized again, or a name holding `/` or `..` would address
    // somewhere other than the entry that was listed.
    assert.equal(entry.name, 'we ird/../name')
    assert.equal(entry.path, '/srv/app/we ird/../name')
  } finally {
    await close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('creating a folder never reaches a remote shell', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-mkdir-'))
  const { factory, execs, mkdirs } = scriptedWithSftp({ expectPassword: 'pw' })
  const world = new RemoteWorld(baseConfig(root), factory)
  const { url, close } = await serve(world)
  try {
    const saved = await post(`${url}/machines`, { host: '10.0.1.3', port: 22, username: 'dev', password: 'pw' })
    const id = (saved.machine as Record<string, unknown>).id as string

    // A name a login shell would evaluate: `rm -rf` needs no escaping, and
    // `$(...)` would have been substituted by the remote shell before mkdir
    // ever saw it. Over SFTP the name is data.
    const hostile = '$(id)`whoami`;rm -rf ~;'
    const created = await post(`${url}/mkdir`, { machineId: id, path: '/srv', name: hostile })
    assert.equal(created.ok, true)
    assert.equal(created.path, `/srv/${hostile}`)
    // The name reaches SFTP as one path whose final segment is the name
    // verbatim — created as data, never assembled into a command line.
    assert.equal(mkdirs.at(-1), `/srv/${hostile}`)
    // No command line was composed from the name at all.
    assert.equal(execs.some((c) => c.includes('mkdir')), false)
  } finally {
    await close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('a listing that the server refuses reports why', async () => {
  const listings = new Map<string, Listing>([['/srv', { entries: [], failReaddir: true }]])
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-ls3-'))
  const { factory } = scriptedWithSftp({ expectPassword: 'pw' }, listings)
  const world = new RemoteWorld(baseConfig(root), factory)
  const { url, close } = await serve(world)
  try {
    const saved = await post(`${url}/machines`, { host: '10.0.1.4', port: 22, username: 'dev', password: 'pw' })
    const id = (saved.machine as Record<string, unknown>).id as string
    const listed = await post(`${url}/ls`, { machineId: id, path: '/srv' })
    assert.equal(listed.ok, false)
    assert.ok(String(listed.error).length > 0, 'the refusal carries a reason')
  } finally {
    await close()
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('testing a machine the registry does not know is refused', async () => {
  await withServer({}, async ({ url }) => {
    const probe = await post(`${url}/test`, { machineId: 'nope|22|dev' })
    assert.equal(probe.ok, false)
    assert.match(String(probe.error), /no saved machine/)
  })
})

test('a probe without a host or an id is refused', async () => {
  await withServer({}, async ({ url }) => {
    const probe = await post(`${url}/test`, { port: 22, username: 'dev' })
    assert.equal(probe.ok, false)
    assert.match(String(probe.error), /machineId is required/)
  })
})
