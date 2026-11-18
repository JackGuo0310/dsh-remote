import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { Context, Service } from '@deepseek-ai/cordis'
import { FsError } from '@deepseek-ai/dsh-fs'
import type { SFTPWrapper } from 'ssh2'
import type { SandboxMode } from '@deepseek-ai/dsh-sandbox'
import { RoutingFileSystem } from '../src/fs-router.ts'
import type { MachineRef, RemoteWorld } from '../src/world.ts'
import type { SshPool } from '../src/pool.ts'

/** The remote path the stub world routes to the stub machine. */
const REMOTE_FILE = '/remote/a.txt'

/** The machine record the stub world resolves anchors to. */
const MACHINE = { source: 'registry', machine: { id: 'host|22|dev' } } as unknown as MachineRef

/**
 * One-channel SFTP fake: serves the window bytes from one in-memory buffer
 * through a createReadStream with ssh2's inclusive start/end semantics.
 */
class WindowSftp {
  constructor(private readonly data: Buffer) {}

  createReadStream(_p: string, opts: { start?: number; end?: number } = {}): Readable {
    const stream = new Readable({ read() {} })
    const data = this.data
    queueMicrotask(() => {
      const start = opts.start ?? 0
      const end = Math.min(opts.end ?? data.length - 1, data.length - 1)
      if (start < data.length && start <= end) stream.push(data.subarray(start, end + 1))
      stream.push(null)
    })
    return stream
  }
}

/**
 * A world stub that routes `REMOTE_FILE` to {@link MACHINE} backed by the
 * given SFTP channel and leaves every other path local. `routeRemote`
 * overrides the machine an anchor resolves to, for the unconfigured refusal.
 */
function stubWorld(
  sftp: SFTPWrapper,
  routeRemote: (anchor: object) => MachineRef | null = () => MACHINE,
): RemoteWorld {
  const pool = { sftp: async () => sftp } as unknown as SshPool
  return {
    classifyHostPath: () => ({ kind: 'local' }),
    classifyRemotePath: (p: string) =>
      p === REMOTE_FILE ? { anchor: { dir: '/remote', meta: { username: 'dev', host: 'host', port: 22 } }, remotePath: p } : null,
    machineForAnchor: routeRemote,
    machineById: (id: string) => (id === MACHINE.machine.id ? MACHINE : null),
    poolFor: () => pool,
  } as unknown as RemoteWorld
}

/** The sandbox-policy fact the sandbox layer's constructor reads. */
class StubPolicy extends Service {
  readonly defaultMode: SandboxMode = 'danger-full-access'

  constructor(ctx: Context) {
    super(ctx, 'sandboxPolicy')
  }
}

/** One remote entry the delete fake can serve. */
interface FakeEntry {
  content: string
  /** Seconds since the epoch; the version token derives from it. */
  mtime: number
  dir?: boolean
}

/**
 * An SFTP fake for the delete contract: it serves stat/readFile/unlink over a
 * path-keyed map, so a test can observe exactly which remote object the router
 * removed and with which guard.
 */
class DeleteSftp {
  readonly unlinked: string[] = []

  /** @param entries - the remote filesystem's contents. */
  constructor(private readonly entries: Map<string, FakeEntry>) {}

  stat(p: string, cb: (err: Error | null, stats?: unknown) => void): void {
    const entry = this.entries.get(p)
    if (entry === undefined) {
      // SSH_FX_NO_SUCH_FILE arrives as the numeric code on the real wire.
      cb(Object.assign(new Error(`no such file: ${p}`), { code: 2 }), undefined)
      return
    }
    cb(null, {
      isFile: () => entry.dir !== true,
      isDirectory: () => entry.dir === true,
      isSymbolicLink: () => false,
      size: Buffer.byteLength(entry.content),
      mtime: entry.mtime,
    })
  }

  readFile(p: string, cb: (err: Error | null, data?: Buffer) => void): void {
    const entry = this.entries.get(p)
    if (entry === undefined) {
      cb(Object.assign(new Error(`no such file: ${p}`), { code: 2 }))
      return
    }
    cb(null, Buffer.from(entry.content, 'utf8'))
  }

  unlink(p: string, cb: (err: Error | null) => void): void {
    this.entries.delete(p)
    this.unlinked.push(p)
    cb(null)
  }
}

/**
 * A routing filesystem over a real Context: a stub sandbox policy mounts so
 * the base classes' constructor reads resolve, and the router registers as
 * `fs`.
 */
async function bootRouter(world: RemoteWorld): Promise<RoutingFileSystem> {
  const ctx = new Context()
  await ctx.plugin(StubPolicy)
  return new RoutingFileSystem(ctx, world, 1000, 0, { cwd: process.cwd(), diffBasisMaxBytes: 1024 })
}

test('readByteRange routes a remote target to the machine window read', async () => {
  const fs = await bootRouter(stubWorld(new WindowSftp(Buffer.from('abcdefgh')) as unknown as SFTPWrapper))
  const target = await fs.resolve(REMOTE_FILE)
  const window = await fs.readByteRange(target, { offset: 2, length: 3 })
  assert.equal(Buffer.from(window).toString('utf8'), 'cde')
})

test('readByteRange refuses a remote path whose machine is gone', async () => {
  const fs = await bootRouter(stubWorld(new WindowSftp(Buffer.alloc(0)) as unknown as SFTPWrapper, () => null))
  await assert.rejects(
    () => fs.resolve(REMOTE_FILE),
    (err: FsError) => err.code === 'FS_IO_ERROR' && err.message.includes('no longer configured'),
  )
})

/** Full-access policy: the fence is skipped so the test observes deletion. */
const DANGER = { mode: 'danger-full-access', workspaceRoot: '/' } as const

test('deleteFile removes a remote file over SFTP and returns its bounded basis', async () => {
  const entries = new Map<string, FakeEntry>([[REMOTE_FILE, { content: 'old\r\nlines\r\n', mtime: 1_700_000_000 }]])
  const sftp = new DeleteSftp(entries)
  const fs = await bootRouter(stubWorld(sftp as unknown as SFTPWrapper))
  const target = await fs.resolve(REMOTE_FILE)
  const outcome = await fs.deleteFile(target, undefined, undefined, DANGER as never)
  assert.deepEqual(sftp.unlinked, [REMOTE_FILE], 'the remote object is removed through SFTP, not the local backend')
  assert.equal(outcome.before, 'old\nlines\n', 'the basis is the removed text, LF-normalized')
  assert.equal(entries.has(REMOTE_FILE), false)
})

test('deleteFile refuses a remote target that is already gone as a stale version', async () => {
  const sftp = new DeleteSftp(new Map())
  const fs = await bootRouter(stubWorld(sftp as unknown as SFTPWrapper))
  const target = await fs.resolve(REMOTE_FILE)
  await assert.rejects(
    () => fs.deleteFile(target, undefined, undefined, DANGER as never),
    (err: FsError) => err.code === 'FS_STALE_VERSION',
  )
  assert.deepEqual(sftp.unlinked, [], 'nothing is removed when the target is missing')
})

test('deleteFile refuses a remote directory as a non-regular file', async () => {
  const sftp = new DeleteSftp(new Map([[REMOTE_FILE, { content: '', mtime: 1_700_000_000, dir: true }]]))
  const fs = await bootRouter(stubWorld(sftp as unknown as SFTPWrapper))
  const target = await fs.resolve(REMOTE_FILE)
  await assert.rejects(
    () => fs.deleteFile(target, undefined, undefined, DANGER as never),
    (err: FsError) => err.code === 'FS_NOT_REGULAR_FILE',
  )
  assert.deepEqual(sftp.unlinked, [])
})

test('deleteFile enforces the version guard on a remote target', async () => {
  const sftp = new DeleteSftp(new Map([[REMOTE_FILE, { content: 'changed', mtime: 1_700_000_100 }]]))
  const fs = await bootRouter(stubWorld(sftp as unknown as SFTPWrapper))
  const target = await fs.resolve(REMOTE_FILE)
  await assert.rejects(
    () => fs.deleteFile(target, { version: 'stale' as never }, undefined, DANGER as never),
    (err: FsError) => err.code === 'FS_STALE_VERSION',
  )
  assert.deepEqual(sftp.unlinked, [], 'a guarded delete must not remove a file it was not shown')
})

test('deleteFile sends a local target to the inherited sandbox backend', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rdv-fs-delete-'))
  try {
    const file = path.join(dir, 'a.txt')
    await writeFile(file, 'local bytes')
    const fs = await bootRouter(stubWorld(new DeleteSftp(new Map()) as unknown as SFTPWrapper))
    const target = await fs.resolve(file)
    const outcome = await fs.deleteFile(target, undefined, undefined, DANGER as never)
    assert.equal(existsSync(file), false, 'a local path deletes on this machine')
    assert.equal(outcome.before, 'local bytes')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('deleteFile of a missing local file keeps the local backend refusal', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rdv-fs-delete-'))
  try {
    const fs = await bootRouter(stubWorld(new DeleteSftp(new Map()) as unknown as SFTPWrapper))
    const target = await fs.resolve(path.join(dir, 'absent.txt'))
    await assert.rejects(
      () => fs.deleteFile(target, undefined, undefined, DANGER as never),
      (err: FsError) => err.code === 'FS_STALE_VERSION',
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('readByteRange falls through to the local backend for local targets', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rdv-fs-router-'))
  try {
    const file = path.join(dir, 'a.txt')
    await writeFile(file, 'local bytes')
    const fs = await bootRouter(stubWorld(new WindowSftp(Buffer.alloc(0)) as unknown as SFTPWrapper))
    const target = await fs.resolve(file)
    const window = await fs.readByteRange(target, { offset: 6, length: 5 })
    assert.equal(Buffer.from(window).toString('utf8'), 'bytes')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
