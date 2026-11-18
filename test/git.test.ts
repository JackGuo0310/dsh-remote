/**
 * Remote Git's pure half: the command builders (quoting matters — a path with
 * a quote must not become shell syntax) and the porcelain parser the panel
 * renders.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  GIT_STATUS_LIMIT,
  gitCommitCommand,
  gitDiffCommand,
  gitLogCommand,
  gitRootCommand,
  gitShowCommand,
  gitStageCommand,
  gitStatusCommand,
  gitUnstageCommand,
  parseGitLog,
  parsePorcelainV1Z,
  safeCommitHash,
  safeGitPath,
  safeRemoteDir,
} from '../src/git.ts'

test('status asks for NUL-separated porcelain with the branch header', () => {
  const command = gitStatusCommand('/home/dev/app')
  assert.match(command, /^git -C '\/home\/dev\/app' --no-pager status --porcelain=v1 -z --branch --untracked-files=all$/)
})

test('the repository root is resolved by git, not assumed from the workspace path', () => {
  assert.match(gitRootCommand('/home/dev/app/src'), /rev-parse --show-toplevel/)
  assert.ok(gitRootCommand('/home/dev/app/src').startsWith("git -C '/home/dev/app/src'"))
})

test('a path with a quote stays one word on the wire', () => {
  const command = gitStageCommand('/repo', ["it's here.txt", '-rf'])
  // The apostrophe is closed, escaped, and reopened; `--` keeps a leading dash
  // from being read as an option.
  assert.match(command, /add -- 'it'\\''s here\.txt' '-rf'$/)
})

test('stage, unstage, and commit name the repository and keep the message off the command line', () => {
  assert.equal(gitStageCommand('/repo', ['a.txt', 'b c.txt']), "git -C '/repo' add -- 'a.txt' 'b c.txt'")
  assert.equal(gitUnstageCommand('/repo', ['a.txt']), "git -C '/repo' restore --staged -- 'a.txt'")
  const commit = gitCommitCommand('/repo')
  assert.equal(commit, "git -C '/repo' commit --quiet -F -")
  assert.ok(!commit.includes('message'), 'the message travels on stdin')
})

test('diff picks the staged side, the worktree side, or /dev/null for an untracked file', () => {
  assert.match(gitDiffCommand('/repo', 'a.txt', true, false), /diff --no-color --cached -- 'a\.txt'$/)
  assert.match(gitDiffCommand('/repo', 'a.txt', false, false), /diff --no-color -- 'a\.txt'$/)
  assert.match(gitDiffCommand('/repo', 'new.txt', false, true), /--no-index -- \/dev\/null 'new\.txt'$/)
})

test('the porcelain parser reads the branch header, tracking counts, and entries', () => {
  const raw = [
    '## main...origin/main [ahead 2, behind 1]',
    ' M src/app.ts',
    'M  README.md',
    '?? notes/',
    // Renames print the new path, then the original in the next NUL token.
    'R  new.ts\u0000old.ts',
    '',
  ].join('\u0000')
  const parsed = parsePorcelainV1Z(raw)
  assert.equal(parsed.branch, 'main')
  assert.equal(parsed.upstream, 'origin/main')
  assert.equal(parsed.ahead, 2)
  assert.equal(parsed.behind, 1)
  assert.deepEqual(parsed.entries, [
    { path: 'src/app.ts', xy: ' M' },
    { path: 'README.md', xy: 'M ' },
    { path: 'notes/', xy: '??' },
    // The rename's new path is the row's address; the original path token is
    // consumed rather than shown as a phantom entry.
    { path: 'new.ts', xy: 'R ' },
  ])
  assert.equal(parsed.truncated, undefined)
})

test('a detached or unborn branch keeps an honest name', () => {
  assert.equal(parsePorcelainV1Z('## HEAD (no branch)\u0000').branch, 'HEAD')
  assert.equal(parsePorcelainV1Z('## No commits yet on main\u0000').branch, 'main')
  assert.equal(parsePorcelainV1Z('## main\u0000').upstream, undefined)
})

test('a huge status stops at the cap and says so', () => {
  const rows: string[] = ['## main']
  for (let i = 0; i < GIT_STATUS_LIMIT + 5; i += 1) rows.push(`?? f${i}.txt`)
  const parsed = parsePorcelainV1Z(rows.join('\u0000') + '\u0000')
  assert.equal(parsed.entries.length, GIT_STATUS_LIMIT)
  assert.equal(parsed.truncated, true)
})

test('the log asks for a bounded, separator-delimited history', () => {
  const command = gitLogCommand('/repo', 50)
  assert.match(command, /^git -C '\/repo' --no-pager log --all -n 50 --date=unix --pretty=format:%H%x1f%h%x1f%an%x1f%at%x1f%D%x1f%P%x1f%s%x1e$/)
  // The limit is clamped, so a client cannot ask for the entire history.
  assert.match(gitLogCommand('/repo', 100000), /log --all -n 1000 /)
  assert.match(gitLogCommand('/repo', 0), /log --all -n 1 /)
  // The current branch alone drops --all.
  assert.doesNotMatch(gitLogCommand('/repo', 50, false), /--all/)
})

test('a show only accepts a validated hash and prints one commit', () => {
  assert.equal(gitShowCommand('/repo', 'abc123'), "git -C '/repo' --no-pager show --no-color --stat --patch 'abc123'")
})

test('the log parser keeps subjects and refs intact across records', () => {
  const raw = [
    'e1f2...full1\u001fabc123\u001fAlice\u001f1700000000\u001fHEAD -> main, origin/main\u001fpp1 pp2\u001fa subject; with "punctuation"\u001e',
    'dead...full2\u001fdef456\u001fBob\u001f1699999999\u001f\u001fpp1\u001fsecond\u001e',
  ].join('')
  const commits = parseGitLog(raw)
  assert.equal(commits.length, 2)
  assert.equal(commits[0]!.hash, 'e1f2...full1')
  assert.equal(commits[0]!.short, 'abc123')
  assert.equal(commits[0]!.author, 'Alice')
  assert.equal(commits[0]!.time, 1_700_000_000)
  assert.deepEqual(commits[0]!.refs, ['HEAD -> main', 'origin/main'])
  assert.deepEqual(commits[0]!.parents, ['pp1', 'pp2'])
  assert.equal(commits[0]!.subject, 'a subject; with "punctuation"')
  assert.deepEqual(commits[1]!.refs, [])
  assert.deepEqual(commits[1]!.parents, ['pp1'])
  assert.equal(commits[1]!.subject, 'second')
  // Empty separators (git's trailing newline) produce no phantom commits.
  assert.deepEqual(parseGitLog('\u001e'), [])
  assert.deepEqual(parseGitLog(''), [])
})

test('a commit identifier from the client must look like a hash', () => {
  assert.equal(safeCommitHash('abc123'), 'abc123')
  assert.equal(safeCommitHash('  A1B2C3D4  '), 'A1B2C3D4')
  assert.equal(safeCommitHash('HEAD'), null)
  assert.equal(safeCommitHash('main; rm -rf /'), null)
  assert.equal(safeCommitHash('$(id)'), null)
  assert.equal(safeCommitHash(''), null)
  assert.equal(safeCommitHash('abc'), null, 'three characters is not a git abbreviation')
})

test('client paths are rejected when a shell or a path boundary would carry them', () => {
  assert.equal(safeGitPath('src/a.ts'), 'src/a.ts')
  assert.equal(safeGitPath('a b/c.txt'), 'a b/c.txt')
  assert.equal(safeGitPath(''), null)
  assert.equal(safeGitPath('a\nb'), null)
  assert.equal(safeGitPath('a\u0000b'), null)
  assert.equal(safeRemoteDir('/home/dev/app'), '/home/dev/app')
  assert.equal(safeRemoteDir('relative/dir'), null)
  assert.equal(safeRemoteDir('/home/dev/app\nrm -rf /'), null)
})
