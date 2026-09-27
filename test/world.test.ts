import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { RemoteWorld, unconfiguredMachineMessage } from '../src/world.ts'
import { sanitizeMachine } from '../src/registry.ts'
import type { Config } from '../src/config.ts'

function baseConfig(anchorRoot: string): Config {
  return {
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKeyPath: '',
    passphrase: '',
    workspace: '',
    commandTimeoutMs: 20000,
    connectTimeoutMs: 15000,
    maxOutputChars: 200000,
    maxFileBytes: 52428800,
    hostKeyMode: 'accept-new',
    useAgent: false,
    keyboardInteractive: false,
    proxy: { host: '', port: 22, username: '', password: '', privateKeyPath: '', passphrase: '' },
    auditLog: false,
    anchorRoot,
    remoteRipgrep: 'rg',
  }
}

function tempDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'rdv-world-'))
}

const MACHINE = sanitizeMachine({ host: 'dev.example.com', username: 'dev', port: 22 })

function worldWithAnchor(root: string, remotePath: string): RemoteWorld {
  const world = new RemoteWorld(baseConfig(root))
  world.upsertMachine(MACHINE)
  world.createAnchor(MACHINE, remotePath)
  return world
}

test('classifyHostPath routes anchor paths remote and keeps metadata local', () => {
  const root = tempDir()
  try {
    const world = worldWithAnchor(root, '/home/dev/myapp')
    const anchor = world.anchors()[0]!
    const inside = world.classifyHostPath(path.join(anchor.dir, 'src', 'index.ts'))
    assert.equal(inside.kind, 'remote')
    if (inside.kind === 'remote') assert.equal(inside.route.remotePath, '/home/dev/myapp/src/index.ts')
    const meta = world.classifyHostPath(path.join(anchor.dir, '.dsh-remote-development.json'))
    assert.equal(meta.kind, 'meta')
    const outside = world.classifyHostPath('/etc/hosts')
    assert.equal(outside.kind, 'local')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('classifyRemotePath claims remote-coordinate paths', () => {
  const root = tempDir()
  try {
    const world = worldWithAnchor(root, '/home/dev/myapp')
    const hit = world.classifyRemotePath('/home/dev/myapp/src/index.ts')
    assert.equal(hit?.remotePath, '/home/dev/myapp/src/index.ts')
    assert.equal(world.classifyRemotePath('/var/log'), null)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('machineForMeta resolves the registry record and rejects strangers', () => {
  const root = tempDir()
  try {
    const world = worldWithAnchor(root, '/home/dev/myapp')
    const anchor = world.anchors()[0]!
    const ref = world.machineForAnchor(anchor)
    assert.equal(ref?.machine.host, 'dev.example.com')
    const stranger = new RemoteWorld(baseConfig(tempDir()))
    const none = stranger.machineForAnchor(anchor)
    assert.equal(none, null)
    void stranger.dispose()
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a fresh registry registers the config machine as standby; reload keeps it once', () => {
  const root = tempDir()
  try {
    const config = baseConfig(root)
    config.host = 'cfg.example.com'
    config.username = 'dev'
    const world = new RemoteWorld(config)
    assert.deepEqual(world.listMachines().map((m) => m.host), ['cfg.example.com'])
    const second = new RemoteWorld(config)
    assert.deepEqual(second.listMachines().map((m) => m.host), ['cfg.example.com'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('unconfiguredMachineMessage names the machine and the remedy', () => {
  const root = tempDir()
  try {
    const world = worldWithAnchor(root, '/home/dev/myapp')
    const anchor = world.anchors()[0]!
    const message = unconfiguredMachineMessage(anchor)
    assert.match(message, /dev@dev\.example\.com:22/)
    assert.match(message, /no longer configured/)
    assert.match(message, /re-add/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('upsertMachine keeps stored secrets an omitted edit and clears explicit empties', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    const saved = world.upsertMachine({ name: 'a', host: 'h1', port: 22, username: 'u', password: 'secret', passphrase: 'pp' })
    assert.equal(saved.password, 'secret')

    // The public wire withholds secrets, so an edit that omits them keeps
    // the stored values.
    const edited = world.upsertMachine({
      id: saved.id, name: 'a', host: 'h1', port: 22, username: 'u',
      password: undefined, passphrase: undefined, color: '#22c55e',
    })
    assert.equal(edited.password, 'secret')
    assert.equal(edited.passphrase, 'pp')
    assert.equal(edited.name, 'a')
    assert.equal(edited.color, '#22c55e')

    // A reload from disk preserves the kept secret.
    const reloaded = new RemoteWorld(baseConfig(root))
    assert.equal(reloaded.machineById(saved.id)?.machine.password, 'secret')

    // An explicit empty string is a clear, not a keep.
    const cleared = world.upsertMachine({ id: saved.id, host: 'h1', port: 22, username: 'u', password: '' })
    assert.equal(cleared.password, '')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('upsertMachine keeps a proxy password the edit omits', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    const proxied = world.upsertMachine({
      name: 'p', host: 'h2', port: 22, username: 'u',
      proxy: { host: 'bastion', port: 22, username: 'b', password: 'bp' },
    })
    const edited = world.upsertMachine({
      id: proxied.id, host: 'h2', port: 22, username: 'u',
      proxy: { host: 'bastion', port: 22, username: 'b' },
    })
    assert.equal(edited.proxy?.host, 'bastion')
    assert.equal(edited.proxy?.password, 'bp')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a corrected password reaches the next connection instead of the stale pool', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    const saved = world.upsertMachine({ name: 'a', host: 'h3', port: 22, username: 'u', password: 'typo' })
    const first = world.poolFor(world.machineById(saved.id)!)
    assert.equal(first, world.poolFor(world.machineById(saved.id)!))

    // A pool pins the credentials it connected with, so a changed password has
    // to retire it — otherwise the settings page's retest keeps authenticating
    // with the password the user just replaced.
    world.upsertMachine({ id: saved.id, host: 'h3', port: 22, username: 'u', password: 'correct' })
    const after = world.poolFor(world.machineById(saved.id)!)
    assert.notEqual(after, first)
    assert.equal(after.targetInfo.password, 'correct')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('an edit that changes nothing connection-related keeps the live pool', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    const saved = world.upsertMachine({ name: 'a', host: 'h4', port: 22, username: 'u', password: 'pw' })
    const first = world.poolFor(world.machineById(saved.id)!)
    // Renaming or recoloring a machine must not drop an open connection.
    world.upsertMachine({ id: saved.id, name: 'renamed', host: 'h4', port: 22, username: 'u', password: undefined, color: '#3b82f6' })
    assert.equal(world.poolFor(world.machineById(saved.id)!), first)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a draft probe inherits the stored secret and never touches the saved machine\'s pool', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    const saved = world.upsertMachine({ name: 'a', host: 'h5', port: 22, username: 'u', password: 'secret' })
    const owned = world.poolFor(world.machineById(saved.id)!)
    assert.equal(world.poolCount, 1)

    // The settings form never receives a stored password, so an untouched
    // field arrives absent. The probe must fall back to what the host holds,
    // or every retest of a saved machine would fail authentication.
    const probe = world.ephemeralRefForTest({
      id: saved.id, host: 'h5', port: 22, username: 'u', password: undefined,
    })
    assert.equal(probe.ref.machine.password, 'secret')
    assert.equal(probe.pool.targetInfo.password, 'secret')
    // The probe runs on a pool of its own, so the machine keeps its own
    // connection and the probe cannot inherit or disturb it.
    assert.notEqual(probe.pool, owned)
    assert.equal(world.poolCount, 1)
    probe.release()
    assert.equal(world.poolFor(world.machineById(saved.id)!), owned)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('an unsaved draft owns its probe connection and never enters the pool map', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    world.upsertMachine({ name: 'a', host: 'h8', port: 22, username: 'u', password: 'secret' })
    world.poolFor(world.machineById(world.listMachines()[0]!.id)!)
    assert.equal(world.poolCount, 1)

    // Re-typing a new server in the settings form is a throwaway: probing it
    // must not accumulate a pooled connection or pin the draft's secret.
    const draft = world.ephemeralRefForTest({ host: 'h9', port: 22, username: 'u', password: 'guess' })
    assert.equal(draft.pool.targetInfo.password, 'guess')
    assert.equal(world.poolCount, 1)
    draft.release()
    assert.equal(world.poolCount, 1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('removing a machine drops its pooled connection', () => {
  const root = tempDir()
  try {
    const world = new RemoteWorld(baseConfig(root))
    const saved = world.upsertMachine({ name: 'a', host: 'h7', port: 22, username: 'u', password: 'pw' })
    world.poolFor(world.machineById(saved.id)!)
    assert.equal(world.poolCount, 1)
    assert.equal(world.removeMachine(saved.id), true)
    assert.equal(world.machineById(saved.id), null)
    assert.equal(world.poolCount, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
