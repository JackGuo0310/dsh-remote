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
  gitRootCommand,
  gitStageCommand,
  gitStatusCommand,
  gitUnstageCommand,
  parsePorcelainV1Z,
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
