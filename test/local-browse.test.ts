/**
 * The 本机 directory browser the plugin serves from its own routes. The host's
 * `directoryPicker` seam refuses browse verbs while it mounts `native`, so
 * these primitives must stand on their own — including the path fence, since a
 * wire value that resolved against the host cwd would browse somewhere the
 * operator never named.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import path from 'node:path'
import { createLocalDir, listLocalDir, LocalBrowseError } from '../src/local-browse.ts'

function tempDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'rdv-local-'))
}

test('listing returns directories with their joined paths and the breadcrumb ancestry', () => {
  const root = tempDir()
  try {
    mkdirSync(path.join(root, 'beta'))
    mkdirSync(path.join(root, 'alpha'))
    mkdirSync(path.join(root, 'alpha', 'nested'))
    // A file is not a navigable row: the dialog only lists directories.
    writeFileSync(path.join(root, 'a-file.txt'), 'x')

    const listing = listLocalDir(root)
    assert.equal(listing.path, path.resolve(root))
    assert.deepEqual(listing.entries.map((e) => e.name), ['alpha', 'beta'])
    assert.equal(listing.entries[0]!.path, path.join(root, 'alpha'))
    assert.equal(listing.entries.some((e) => e.name === 'a-file.txt'), false)
    assert.equal(listing.truncated, false)

    // The ancestry lets the breadcrumb walk back up: root, then each segment.
    assert.deepEqual(listing.crumbs.map((c) => c.path), listing.crumbs.map((_, i) => i === 0
      ? path.parse(root).root
      : path.join(path.parse(root).root, ...listing.crumbs.slice(1, i + 1).map((c) => c.name))))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a dot-prefixed directory is listed and marked hidden', () => {
  const root = tempDir()
  try {
    mkdirSync(path.join(root, '.hidden-dir'))
    mkdirSync(path.join(root, 'visible'))
    const listing = listLocalDir(root)
    assert.deepEqual(listing.entries.map((e) => e.name), ['.hidden-dir', 'visible'])
    assert.equal(listing.entries[0]!.hidden, true)
    assert.equal(listing.entries[1]!.hidden, false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a path that is not absolute never resolves against the host cwd', () => {
  // The fence matters most here: this value arrives from the browser, and
  // resolving it would silently browse a directory the operator never named.
  for (const relative of ['.', '..', 'relative/dir', 'C:foo']) {
    assert.throws(
      () => listLocalDir(relative),
      (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-unreadable',
      `refuses ${JSON.stringify(relative)}`,
    )
  }
})

test('an absent path lists the host home', () => {
  const listing = listLocalDir()
  assert.equal(listing.path, path.resolve(homedir()))
  assert.ok(Array.isArray(listing.entries))
})

test('listing something that is not a directory reports why', () => {
  const root = tempDir()
  try {
    const file = path.join(root, 'a-file.txt')
    writeFileSync(file, 'x')
    assert.throws(
      () => listLocalDir(file),
      (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-unreadable',
    )
    assert.throws(
      () => listLocalDir(path.join(root, 'missing')),
      (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-unreadable',
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('creating a folder returns its joined path and refuses an existing child', () => {
  const root = tempDir()
  try {
    const created = createLocalDir(root, 'new-dir')
    assert.equal(created, path.join(root, 'new-dir'))
    assert.throws(
      () => createLocalDir(root, 'new-dir'),
      (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-exists',
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a folder name that is not one path segment is refused', () => {
  const root = tempDir()
  try {
    // Each of these would create somewhere the operator did not name, or
    // resolve to the parent itself.
    for (const name of ['', '  ', '.', '..', 'a/b', 'a\\b', '../escape']) {
      assert.throws(
        () => createLocalDir(root, name),
        (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-create-failed',
        `refuses ${JSON.stringify(name)}`,
      )
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('creating under a non-absolute or missing parent is refused', () => {
  assert.throws(
    () => createLocalDir('relative', 'child'),
    (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-unreadable',
  )
  const root = tempDir()
  try {
    assert.throws(
      () => createLocalDir(path.join(root, 'missing'), 'child'),
      (err: unknown) => err instanceof LocalBrowseError && err.code === 'directory-create-failed',
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})