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
import type { Dirent } from 'node:fs'
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
 * Whether one `readdir` entry is a directory the dialog may open.
 *
 * `readdir` describes the entry itself, so on Windows a reparse point — a
 * junction, or an OneDrive folder whose content lives in the cloud — reports
 * `isSymbolicLink()` rather than `isDirectory()` even though it resolves to a
 * directory. Filtering on `isDirectory()` alone hides `D:\OneDrive` from the
 * picker, which leaves the operator unable to choose it as a workspace.
 * `stat` follows the reparse point, and reading a cloud placeholder's metadata
 * does not download its content.
 * @param target - absolute path of the entry.
 * @param dirent - the entry as `readdir` reported it.
 * @returns whether the entry is a directory that can be browsed into.
 */
function isBrowsableDir(target: string, dirent: Dirent): boolean {
  if (dirent.isDirectory()) return true
  // A plain file is never a row; only a link can still resolve to a directory.
  if (!dirent.isSymbolicLink()) return false
  try {
    return statSync(target).isDirectory()
  } catch {
    // A dangling link, or one the host cannot stat, is not a level to open.
    return false
  }
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
    const child = path.join(dir, dirent.name)
    if (!isBrowsableDir(child, dirent)) continue
    entries.push({
      name: dirent.name,
      path: child,
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

/**
 * How long a substitute answer stays valid. A fallback is a guess, not an
 * answer: caching it for a minute hid every other volume for the rest of that
 * minute, which is what made `D:\` vanish from the picker.
 */
const DRIVE_FALLBACK_CACHE_MS = 5_000

let cachedDrives: { at: number; paths: string[]; complete: boolean } | undefined

/**
 * Every root the operator can browse to, so a Windows host can switch from `C:\`
 * to `D:\` without typing the path. Node exposes no volume enumeration, so on
 * Windows this asks the OS once and caches the answer; elsewhere the single
 * filesystem root is the only answer there is.
 *
 * The list is advisory, not a fence: a root that vanished or is inaccessible
 * still resolves through {@link listLocalDir} and reports why.
 * @returns the browsable roots.
 */
export function listDriveRoots(): string[] {
  if (osPlatform() !== 'win32') return [path.parse(path.resolve(homedir())).root]
  const now = Date.now()
  if (cachedDrives !== undefined) {
    const ttl = cachedDrives.complete ? DRIVE_CACHE_MS : DRIVE_FALLBACK_CACHE_MS
    if (now - cachedDrives.at < ttl) return cachedDrives.paths
  }
  const enumerated = enumerateWindowsDrives()
  cachedDrives = { at: now, paths: enumerated.paths, complete: enumerated.complete }
  return enumerated.paths
}

/**
 * Ask the OS for the mounted volumes, cheapest source first. `fsutil` is a
 * built-in that answers in about a tenth of a second; PowerShell needs several
 * seconds to start under a scanner-heavy profile, and this used to run it alone
 * with a 3 s timeout — every start that overran it dropped all volumes but the
 * system one from the picker.
 * @returns the roots and whether the answer is complete or a substitute.
 */
function enumerateWindowsDrives(): { paths: string[]; complete: boolean } {
  const fromFsutil = rootsFromFsutil()
  if (fromFsutil.length > 0) return { paths: fromFsutil, complete: true }
  const fromPowerShell = rootsFromPowerShell()
  if (fromPowerShell.length > 0) return { paths: fromPowerShell, complete: true }
  // Both sources failed; the system drive exists whenever the host is running.
  return { paths: [systemDriveRoot()], complete: false }
}

/**
 * Read the volume roots from `fsutil fsinfo drives`.
 *
 * The command's lead-in is localized ("驱动器:", "Drives:"), so only the ASCII
 * `X:\` tokens are read and the prefix is ignored. Output bytes are decoded as
 * UTF-8 no matter the console code page; a mangled prefix cannot corrupt the
 * letters and backslashes this cares about.
 * @returns the volume roots, empty when `fsutil` is absent or refused.
 */
function rootsFromFsutil(): string[] {
  try {
    const out = execFileSync('fsutil.exe', ['fsinfo', 'drives'], {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    })
    const roots = [...out.matchAll(/([A-Za-z]:\\)/g)].map((match) => match[1]!.toUpperCase())
    return [...new Set(roots)]
  } catch {
    return []
  }
}

/**
 * Read the volume roots from `Get-PSDrive`. Slower than {@link rootsFromFsutil}
 * but it is the fallback that still works when `fsutil` is unavailable.
 * @returns the volume roots, empty when PowerShell is absent or refused.
 */
function rootsFromPowerShell(): string[] {
  try {
    const script = 'Get-PSDrive -PSProvider FileSystem | ForEach-Object { $_.Root }'
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8', timeout: 15000, windowsHide: true },
    )
    return out.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^[A-Za-z]:\\$/.test(line))
  } catch {
    return []
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