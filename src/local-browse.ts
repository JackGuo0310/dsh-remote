/**
 * 本机 directory browser served by the plugin's own routes.
 *
 * The host's `directoryPicker` seam refuses a browse verb whenever the mounted
 * backend is `native`, and the host mounts `native` whenever it sees a loopback
 * bind and a non-SSH launch — both true for a browser reaching the host through
 * a tunnel from another machine. Reporting `browse` to the browser while the
 * host still serves `native` only moves the refusal one message deeper, so this
 * module answers the listing and creation primitives directly from the host
 * filesystem, which is where the host's own browse backend would read them too.
 * @module dsh-remote-development/local-browse
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { homedir, platform as osPlatform } from 'node:os'

/** Closed failure vocabulary of the 本机 browser (mirrors the host's browse codes). */
export type LocalBrowseErrorCode = 'directory-unreadable' | 'directory-exists' | 'directory-create-failed'

/** Typed failure so the routes can map a business code without string matching. */
export class LocalBrowseError extends Error {
  /**
   * @param code - closed business code of the failure.
   * @param target - the absolute path the failure is about.
   * @param message - operator-facing description.
   */
  constructor(readonly code: LocalBrowseErrorCode, readonly target: string, message: string) {
    super(message)
    this.name = 'LocalBrowseError'
  }
}

/** One listed directory, as the dialog row renders it. */
export interface LocalEntry {
  name: string
  path: string
  hidden: boolean
}

/** One listing level plus the ancestry the breadcrumb renders. */
export interface LocalListing {
  path: string
  home: string
  crumbs: LocalEntry[]
  entries: LocalEntry[]
  /** The level was cut because it held more rows than the dialog renders. */
  truncated: boolean
  /** Every root the operator may switch to (Windows volumes; the single POSIX root elsewhere). */
  roots: string[]
}

/** Rows one listing may hold before it is cut; the dialog scrolls, so this only bounds the payload. */
const MAX_ENTRIES = 5000

/** Depth of one crumb's parent lookup; the ancestry stops there. */
const MAX_CRUMB_DEPTH = 32

/**
 * Reject a path that is not fully qualified. A wire value must never resolve
 * against the host process cwd or, on Windows, its current drive — a bare
 * `..` or a drive-relative `C:foo` would silently browse somewhere else.
 * @param target - the client-supplied path.
 * @returns the absolute path.
 * @throws {LocalBrowseError} `directory-unreadable` when the value is not absolute.
 */
function requireAbsolute(target: string): string {
  const trimmed = target.trim()
  if (trimmed === '') return path.resolve(homedir())
  // path.isAbsolute rejects `C:foo` on Windows (drive-relative) and any relative
  // spelling on POSIX, which is exactly the fence the host's browse backend applies.
  if (!path.isAbsolute(trimmed)) {
    throw new LocalBrowseError('directory-unreadable', trimmed, `not an absolute path: ${trimmed}`)
  }
  return path.resolve(trimmed)
}

/**
 * List one directory level with its breadcrumb ancestry.
 * @param target - absolute directory to list; absent lists the home directory.
 * @returns the level's listing.
 * @throws {LocalBrowseError} `directory-unreadable` when the path is not absolute or cannot be listed.
 */
export function listLocalDir(target?: string): LocalListing {
  const dir = requireAbsolute(target ?? '')
  let dirents
  try {
    const stat = statSync(dir)
    if (!stat.isDirectory()) {
      throw new LocalBrowseError('directory-unreadable', dir, `not a directory: ${dir}`)
    }
    dirents = readdirSync(dir, { withFileTypes: true })
  } catch (err) {
    if (err instanceof LocalBrowseError) throw err
    throw new LocalBrowseError('directory-unreadable', dir, `cannot list ${dir}: ${(err as Error).message}`)
  }

  const truncated = dirents.length > MAX_ENTRIES
  const entries: LocalEntry[] = []
  for (const dirent of dirents.slice(0, MAX_ENTRIES)) {
    if (!dirent.isDirectory()) continue
    entries.push({
      name: dirent.name,
      path: path.join(dir, dirent.name),
      hidden: dirent.name.startsWith('.'),
    })
  }
  // Case-insensitive on Windows so a listing reads in the order the shell does.
  entries.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, osPlatform() === 'win32' ? 'zh-CN' : undefined, {
      numeric: true,
      sensitivity: osPlatform() === 'win32' ? 'base' : 'variant',
    })
    return byName !== 0 ? byName : a.name.localeCompare(b.name)
  })

  return { path: dir, home: path.resolve(homedir()), crumbs: crumbsOf(dir), entries, truncated, roots: listDriveRoots() }
}

/**
 * Build the breadcrumb ancestry of one directory: root, each parent, and the
 * directory itself. Bounded so a deep path cannot produce an unbounded list.
 * @param dir - absolute directory.
 * @returns the ancestry, root first.
 */
function crumbsOf(dir: string): LocalEntry[] {
  const crumbs: LocalEntry[] = []
  let current = path.parse(dir).root
  crumbs.push({ name: current, path: current, hidden: false })
  const rest = dir.slice(current.length)
  let walked = current
  for (const segment of rest.split(path.sep).filter(Boolean).slice(0, MAX_CRUMB_DEPTH)) {
    walked = path.join(walked, segment)
    crumbs.push({ name: segment, path: walked, hidden: segment.startsWith('.') })
  }
  return crumbs
}

/**
 * Create one child directory under an existing parent.
 * @param parent - absolute existing parent directory.
 * @param name - single non-blank path segment.
 * @returns the created directory's absolute path.
 * @throws {LocalBrowseError} `directory-exists` for an existing child,
 * `directory-create-failed` for a bad parent or any other failure.
 */
export function createLocalDir(parent: string, name: string): string {
  const base = requireAbsolute(parent)
  // A name carrying a separator would create somewhere the operator did not
  // name, and `.`/`..` would resolve to the parent itself.
  const segment = name.trim()
  if (segment === '' || segment === '.' || segment === '..' || /[/\\]/.test(segment)) {
    throw new LocalBrowseError('directory-create-failed', base, `not a single path segment: ${JSON.stringify(name)}`)
  }
  const created = path.join(base, segment)
  try {
    mkdirSync(created)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new LocalBrowseError('directory-exists', created, `already exists: ${created}`)
    }
    throw new LocalBrowseError('directory-create-failed', created, `cannot create ${created}: ${(err as Error).message}`)
  }
  return created
}

/** How long an enumerated drive list stays valid; a volume set rarely changes mid-session. */
const DRIVE_CACHE_MS = 60_000

let cachedDrives: { at: number; paths: string[] } | undefined

/**
 * Every root the operator can browse to, so a Windows host can switch from `C:\`
 * to `D:\` without typing the path. Node exposes no volume enumeration, so on
 * Windows this asks PowerShell once and caches the answer; elsewhere the single
 * filesystem root is the only answer there is.
 *
 * The list is advisory, not a fence: a root that vanished or is inaccessible
 * still resolves through {@link listLocalDir} and reports why.
 * @returns the browsable roots.
 */
export function listDriveRoots(): string[] {
  if (osPlatform() !== 'win32') return [path.parse(path.resolve(homedir())).root]
  const now = Date.now()
  if (cachedDrives !== undefined && now - cachedDrives.at < DRIVE_CACHE_MS) return cachedDrives.paths
  const paths = enumerateWindowsDrives()
  cachedDrives = { at: now, paths }
  return paths
}

/**
 * Ask PowerShell for the mounted volumes. A failure (no PowerShell, a locked
 * profile, a timeout) must not break the picker, so the system drive from the
 * environment stands in — that volume exists whenever the host is running.
 * @returns the volume roots, in mount order.
 */
function enumerateWindowsDrives(): string[] {
  try {
    const script = 'Get-PSDrive -PSProvider FileSystem | ForEach-Object { $_.Root }'
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8', timeout: 3000, windowsHide: true },
    )
    const roots = out.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^[A-Za-z]:\\$/.test(line))
    if (roots.length === 0) return [systemDriveRoot()]
    return roots
  } catch {
    // PowerShell is absent or refused; the system drive is still browsable.
    return [systemDriveRoot()]
  }
}

/**
 * The root of the volume the host process itself runs from.
 * @returns the system drive root, e.g. `C:\`.
 */
function systemDriveRoot(): string {
  const drive = process.env.SystemDrive
  return drive !== undefined && /^[A-Za-z]:$/.test(drive) ? `${drive}\\` : 'C:\\'
}