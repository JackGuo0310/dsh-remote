/**
 * The remote-file rename/delete routes, driven through the real handlers over
 * a fake SFTP tree. They are the operator's destructive actions, so the tests
 * pin the guards (a single name, an existing target, the filesystem root) and
 * the recursive removal order.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { SFTPWrapper } from 'ssh2'
import { RemoteWorld } from '../src/world.ts'
import { registerRoutes } from '../src/routes.ts'
import { ForwardManager } from '../src/forward.ts'
import type { Config } from '../src/config.ts'

function baseConfig(anchorRoot: string): Config {
  return {
    host: '', port: 22, username: '', password: '', privateKeyPath: '', passphrase: '', workspace: '',
    commandTimeoutMs: 2000, connectTimeoutMs: 2000, maxOutputChars: 20000, maxFileBytes: 1024,
    hostKeyMode: 'accept-new', useAgent: false, keyboardInteractive: false,
    proxy: { host: '', port: 22, username: '', password: '', privateKeyPath: '', passphrase: '' },
    auditLog: false, anchorRoot, remoteRipgrep: 'rg', localPicker: 'browse', maxForwards: 8,
  }
}

/** A directory tree served over a fake SFTP session. */
class FakeSftp {
  readonly dirs = new Set<string>(['/'])
  readonly files = new Set<string>()
  readonly calls: string[] = []

  addFile(p: string): void {
    this.files.add(p)
    const parts = p.split('/')
    for (let i = 1; i < parts.length; i += 1) this.dirs.add(parts.slice(0, i).join('/') || '/')
    this.dirs.add(parts.slice(0, -1).join('/') || '/')
  }

  addDir(p: string): void {
    this.dirs.add(p)
    const parts = p.split('/')
    for (let i = 1; i < parts.length; i += 1) this.dirs.add(parts.slice(0, i).join('/') || '/')
  }

  private attrs(dir: boolean): Record<string, unknown> {
    return {
      isFile: () => !dir,
      isDirectory: () => dir,
      isSymbolicLink: () => false,
      size: dir ? 0 : 4,
      mtime: 1_700_000_000,
    }
  }

  lstat(p: string, cb: (err: Error | null, stats?: unknown) => void): void {
    if (this.files.has(p)) { cb(null, this.attrs(false)); return }
    if (this.dirs.has(p)) { cb(null, this.attrs(true)); return }
    cb(Object.assign(new Error('no such file'), { code: 2 }), undefined)
  }

  stat = this.lstat.bind(this)

  readdir(p: string, cb: (err: Error | null, entries?: unknown[]) => void): void {
    if (!this.dirs.has(p)) {
      cb(Object.assign(new Error('no such directory'), { code: 2 }))
      return
    }
    const prefix = p === '/' ? '/' : p + '/'
    const direct = (candidate: string): boolean => {
      if (!candidate.startsWith(prefix)) return false
      return !candidate.slice(prefix.length).includes('/')
    }
    const entries = [
      ...[...this.dirs].filter((d) => d !== p && direct(d)).map((d) => ({ filename: d.slice(prefix.length), attrs: this.attrs(true) })),
      ...[...this.files].filter((f) => direct(f)).map((f) => ({ filename: f.slice(prefix.length), attrs: this.attrs(false) })),
    ]
    cb(null, entries)
  }

  unlink(p: string, cb: (err: Error | null) => void): void {
    this.calls.push(`unlink ${p}`)
    this.files.delete(p)
    cb(null)
  }

  rmdir(p: string, cb: (err: Error | null) => void): void {
    this.calls.push(`rmdir ${p}`)
    this.dirs.delete(p)
    cb(null)
  }

  rename(from: string, to: string, cb: (err: Error | null) => void): void {
    this.calls.push(`rename ${from} ${to}`)
    if (this.files.delete(from)) { this.files.add(to); cb(null); return }
    if (this.dirs.delete(from)) { this.dirs.add(to); cb(null); return }
    cb(Object.assign(new Error('no such file'), { code: 2 }))
  }
}

/** Route harness: captures handlers and dispatches one call at a time. */
function boot(sftp: FakeSftp): {
  call: (route: string, body: unknown) => Promise<{ status: number; body: Record<string, unknown> }>
  world: RemoteWorld
  root: string
} {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-files-routes-'))
  const world = new RemoteWorld(baseConfig(root))
  world.upsertMachine({ name: 'build', host: 'dev.example.com', port: 22, username: 'dev', password: 'pw' })
  world.sftpOn = (async () => sftp as unknown as SFTPWrapper) as never
  const handlers = new Map<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>>()
  const ctx = new Context()
  registerRoutes(ctx, {
    register(route: { path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }) {
      handlers.set(route.path, route.handler)
      return () => handlers.delete(route.path)
    },
  } as never, world, new ForwardManager(world))
  const call = async (route: string, body: unknown): Promise<{ status: number; body: Record<string, unknown> }> => {
    const handler = handlers.get('/dsh-remote-development' + route)
    assert.ok(handler, `route ${route} must be registered`)
    const req = new PassThrough() as unknown as IncomingMessage
    Object.assign(req, { method: 'POST', url: '/dsh-remote-development' + route })
    ;(req as unknown as PassThrough).end(JSON.stringify(body))
    const res = new (class {
      status = 0
      private text = ''
      writeHead(status: number): this { this.status = status; return this }
      end(chunk?: string): void { this.text = chunk ?? '' }
      get body(): Record<string, unknown> { return this.text === '' ? {} : JSON.parse(this.text) as Record<string, unknown> }
    })()
    await handler(req, res as unknown as ServerResponse)
    return { status: res.status, body: res.body }
  }
  return { call, world, root }
}

test('rename moves a file inside its directory', async () => {
  const sftp = new FakeSftp()
  sftp.addFile('/home/dev/app/a.txt')
  const { call, world, root } = boot(sftp)
  try {
    const machineId = world.listMachines()[0]!.id
    const answer = await call('/files/rename', { machineId, path: '/home/dev/app/a.txt', name: 'b.txt' })
    assert.equal(answer.body.ok, true)
    assert.equal(answer.body.path, '/home/dev/app/b.txt')
    assert.deepEqual(sftp.calls, ['rename /home/dev/app/a.txt /home/dev/app/b.txt'])
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('rename refuses to replace an existing name and rejects separators', async () => {
  const sftp = new FakeSftp()
  sftp.addFile('/home/dev/app/a.txt')
  sftp.addFile('/home/dev/app/b.txt')
  const { call, world, root } = boot(sftp)
  try {
    const machineId = world.listMachines()[0]!.id
    const exists = await call('/files/rename', { machineId, path: '/home/dev/app/a.txt', name: 'b.txt' })
    assert.equal(exists.body.ok, false)
    assert.match(String(exists.body.error), /already exists/)
    for (const name of ['', '..', 'x/y', 'x\\y']) {
      const bad = await call('/files/rename', { machineId, path: '/home/dev/app/a.txt', name })
      assert.equal(bad.status, 400, `name ${JSON.stringify(name)} must be refused before any SFTP call`)
    }
    assert.deepEqual(sftp.calls, [])
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('delete removes a file with one unlink', async () => {
  const sftp = new FakeSftp()
  sftp.addFile('/home/dev/app/a.txt')
  const { call, world, root } = boot(sftp)
  try {
    const machineId = world.listMachines()[0]!.id
    const answer = await call('/files/delete', { machineId, path: '/home/dev/app/a.txt' })
    assert.equal(answer.body.ok, true)
    assert.deepEqual(sftp.calls, ['unlink /home/dev/app/a.txt'])
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('delete empties a directory before removing it, children first', async () => {
  const sftp = new FakeSftp()
  sftp.addFile('/home/dev/app/sub/one.txt')
  sftp.addFile('/home/dev/app/sub/inner/two.txt')
  const { call, world, root } = boot(sftp)
  try {
    const machineId = world.listMachines()[0]!.id
    const answer = await call('/files/delete', { machineId, path: '/home/dev/app/sub' })
    assert.equal(answer.body.ok, true)
    const unlinks = sftp.calls.filter((c) => c.startsWith('unlink '))
    const rmdirs = sftp.calls.filter((c) => c.startsWith('rmdir '))
    assert.deepEqual(unlinks.sort(), ['unlink /home/dev/app/sub/inner/two.txt', 'unlink /home/dev/app/sub/one.txt'])
    assert.deepEqual(rmdirs, ['rmdir /home/dev/app/sub/inner', 'rmdir /home/dev/app/sub'])
    assert.equal(sftp.dirs.has('/home/dev/app/sub'), false)
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('delete reports an already-gone target and refuses the root', async () => {
  const sftp = new FakeSftp()
  const { call, world, root } = boot(sftp)
  try {
    const machineId = world.listMachines()[0]!.id
    const missing = await call('/files/delete', { machineId, path: '/home/dev/app/nope.txt' })
    assert.equal(missing.body.ok, false)
    assert.match(String(missing.body.error), /no longer exists/)
    const rootDelete = await call('/files/delete', { machineId, path: '/' })
    assert.equal(rootDelete.status, 400)
    assert.deepEqual(sftp.calls, [], 'neither refusal touches the machine')
  } finally {
    world.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
