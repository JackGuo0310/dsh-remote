/**
 * The 本机 directory browser the plugin serves from its own routes. The host's
 * `directoryPicker` seam refuses browse verbs while it mounts `native`, so
 * these primitives must stand on their own — including the path fence, since a
 * wire value that resolved against the host cwd would browse somewhere the
 * operator never named.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import path from 'node:path'
import { createLocalDir, listDriveRoots, listLocalDir, LocalBrowseError } from '../src/local-browse.ts'

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

test('a directory reached through a reparse point is listed', (t) => {
  // Windows reports a junction or an OneDrive folder as a link rather than a
  // directory, so a listing filtered on `isDirectory()` would drop the one row
  // the operator needs in order to pick it as a workspace.
  const root = tempDir()
  try {
    mkdirSync(path.join(root, 'real'))
    const linked = path.join(root, 'linked')
    try {
      // A junction needs no elevation on Windows; POSIX has no junction type.
      symlinkSync(path.join(root, 'real'), linked, process.platform === 'win32' ? 'junction' : 'dir')
    } catch {
      t.skip('this host cannot create a directory link')
      return
    }
    const listing = listLocalDir(root)
    assert.deepEqual(listing.entries.map((e) => e.name), ['linked', 'real'])
    // The row points at the link, which is the path the operator picked.
    assert.equal(listing.entries[0]!.path, linked)
    // The linked directory is itself browsable.
    assert.ok(listLocalDir(linked).path === path.resolve(linked))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a dangling link is not offered as a directory', (t) => {
  const root = tempDir()
  try {
    try {
      symlinkSync(path.join(root, 'missing-target'), path.join(root, 'dangling'), process.platform === 'win32' ? 'junction' : 'dir')
    } catch {
      t.skip('this host cannot create a directory link')
      return
    }
    assert.deepEqual(listLocalDir(root).entries, [])
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

test('every listing offers the browsable roots, and there is always at least one', () => {
  const root = tempDir()
  try {
    const roots = listLocalDir(root).roots
    assert.ok(roots.length >= 1, 'the dialog needs somewhere to switch to')
    // Every offered root is absolute, which is what makes it a valid listing
    // target rather than a path resolved against the host cwd.
    for (const r of roots) assert.ok(path.isAbsolute(r), `${r} is absolute`)
    assert.deepEqual(roots, listDriveRoots(), 'the roots are stable across listings')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('the volume list carries every mounted drive, not only the system one', () => {
  // The picker renders its drive switcher only when more than one root comes
  // back, so a list silently reduced to the system drive hides every other
  // volume — the regression that dropped `D:\` from the dialog.
  const roots = listDriveRoots()
  assert.ok(roots.length >= 2, `expected more than the system drive, got ${JSON.stringify(roots)}`)
  for (const root of roots) {
    assert.match(root, process.platform === 'win32' ? /^[A-Za-z]:\\$/ : /^\//, `${root} is a volume root`)
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