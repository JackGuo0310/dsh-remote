/**
 * Remote Git support for the sidebar's remote Git tab. The sidebar's own Git
 * panel spawns `git` on the host (with a WSL special case) and never crosses
 * this plugin's subprocess seam, so a remote workspace cannot use it; this
 * module builds the equivalent commands for the remote machine and parses what
 * they print.
 *
 * Everything here is pure: the routes execute the commands through
 * `RemoteWorld.execOn`, and the parsers are unit-testable without SSH.
 * @module dsh-remote-development/git
 */

/** One changed path from `git status --porcelain=v1`. */
export interface GitStatusEntry {
  /** Path relative to the repository root. */
  path: string
  /** Two-letter index/worktree status, e.g. `M `, ` M`, `??`. */
  xy: string
}

/** One repository's status snapshot. */
export interface GitStatus {
  isRepo: boolean
  /** Repository top level, absolute on the remote machine. */
  root?: string
  /** Branch name, or `HEAD` when detached. */
  branch?: string
  /** Tracking ref, when the branch has one. */
  upstream?: string
  ahead?: number
  behind?: number
  entries: GitStatusEntry[]
  /** True when the working tree had more rows than the cap. */
  truncated?: boolean
}

/** Cap on status rows returned to the browser (a huge untracked set is noise). */
export const GIT_STATUS_LIMIT = 500

/**
 * Quote one path/argument for a POSIX shell.
 * @param value - raw text.
 * @returns the safely quoted word.
 */
function q(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`
}

/** Absolute remote directory the command runs in. */
function dir(root: string): string {
  return `-C ${q(root)}`
}

/**
 * The status command: porcelain v1 with NUL separators (paths survive spaces,
 * quotes, and newlines) plus the branch header.
 * @param root - repository root on the remote machine.
 * @returns the command line.
 */
export function gitStatusCommand(root: string): string {
  return `git ${dir(root)} --no-pager status --porcelain=v1 -z --branch --untracked-files=all`
}

/**
 * Resolve the repository top level for a directory.
 * @param dirPath - any directory inside (or at) the repository.
 * @returns the command line.
 */
export function gitRootCommand(dirPath: string): string {
  return `git ${dir(dirPath)} rev-parse --show-toplevel 2>/dev/null`
}

/**
 * One file's diff. An untracked file is diffed against `/dev/null`, which is
 * what `git diff --no-index` calls a brand-new file (and exits 1 for — the
 * route treats that as "has output", not as an error).
 * @param root - repository root.
 * @param file - repo-relative path.
 * @param staged - compare the index against HEAD instead of the worktree.
 * @param untracked - the path is not in the index at all.
 * @returns the command line.
 */
export function gitDiffCommand(root: string, file: string, staged: boolean, untracked: boolean): string {
  const base = `git ${dir(root)} --no-pager diff --no-color`
  if (untracked) return `git ${dir(root)} --no-pager diff --no-color --no-index -- /dev/null ${q(file)}`
  return staged ? `${base} --cached -- ${q(file)}` : `${base} -- ${q(file)}`
}

/**
 * Stage selected paths.
 * @param root - repository root.
 * @param files - repo-relative paths.
 * @returns the command line.
 */
export function gitStageCommand(root: string, files: readonly string[]): string {
  return `git ${dir(root)} add -- ${files.map(q).join(' ')}`
}

/**
 * Unstage selected paths (index back to HEAD, worktree untouched).
 * @param root - repository root.
 * @param files - repo-relative paths.
 * @returns the command line.
 */
export function gitUnstageCommand(root: string, files: readonly string[]): string {
  return `git ${dir(root)} restore --staged -- ${files.map(q).join(' ')}`
}

/**
 * Commit the staged changes with one message, passed via stdin so it can hold
 * any character: `printf %s` is not needed — the message rides `-F -`.
 * @param root - repository root.
 * @returns the command line.
 */
export function gitCommitCommand(root: string): string {
  return `git ${dir(root)} commit --quiet -F -`
}

/**
 * Parse `git status --porcelain=v1 -z --branch` output.
 * @param raw - NUL-separated status output.
 * @returns the branch facts and changed entries (renames keep their new path).
 */
export function parsePorcelainV1Z(raw: string): Pick<GitStatus, 'branch' | 'upstream' | 'ahead' | 'behind' | 'entries' | 'truncated'> {
  const tokens = raw.split('\u0000').filter((token) => token !== '')
  let branch: string | undefined
  let upstream: string | undefined
  let ahead: number | undefined
  let behind: number | undefined
  const entries: GitStatusEntry[] = []
  let truncated = false
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!
    if (token.startsWith('## ')) {
      const header = token.slice(3)
      // `## main...origin/main [ahead 1, behind 2]`, `## HEAD (no branch)`,
      // `## No commits yet on main`.
      const counts = /\[([^\]]+)\]/.exec(header)
      if (counts !== null) {
        const aheadMatch = /ahead (\d+)/.exec(counts[1]!)
        const behindMatch = /behind (\d+)/.exec(counts[1]!)
        if (aheadMatch !== null) ahead = Number(aheadMatch[1])
        if (behindMatch !== null) behind = Number(behindMatch[1])
      }
      const names = header.replace(/\s*\[[^\]]+\]\s*$/, '')
      const [local, tracked] = names.split('...')
      if (names.includes('(no branch)')) {
        branch = 'HEAD'
      } else if (local !== undefined && local !== '') {
        branch = local.replace(/^No commits yet on /, '')
      }
      if (tracked !== undefined && tracked !== '') upstream = tracked
      continue
    }
    const xy = token.slice(0, 2)
    // Rename/copy: the next NUL token is the original path, which the panel
    // does not need (the row addresses the new path).
    const renamed = xy.startsWith('R') || xy.startsWith('C')
    const file = token.slice(3)
    if (file !== '') {
      if (entries.length >= GIT_STATUS_LIMIT) {
        truncated = true
      } else {
        entries.push({ path: file, xy })
      }
    }
    if (renamed) i += 1
  }
  return {
    ...(branch === undefined ? {} : { branch }),
    ...(upstream === undefined ? {} : { upstream }),
    ...(ahead === undefined ? {} : { ahead }),
    ...(behind === undefined ? {} : { behind }),
    entries,
    ...(truncated ? { truncated } : {}),
  }
}

/**
 * Validate a client-supplied repo-relative path.
 * @param value - the raw path.
 * @returns the path, or null when it cannot be a git path.
 */
export function safeGitPath(value: unknown): string | null {
  const p = String(value ?? '')
  if (p === '' || p.length > 4096) return null
  if (p.includes('\u0000') || p.includes('\n') || p.includes('\r')) return null
  return p
}

/**
 * Validate a client-supplied remote directory.
 * @param value - the raw path.
 * @returns the absolute path, or null.
 */
export function safeRemoteDir(value: unknown): string | null {
  const p = String(value ?? '')
  if (!p.startsWith('/') || p.length > 4096) return null
  if (p.includes('\u0000') || p.includes('\n') || p.includes('\r')) return null
  return p
}
