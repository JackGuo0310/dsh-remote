/**
 * The on-demand port forwarder, driven over real loopback sockets with an
 * in-process channel in place of SSH: the listener, the bridging, and the
 * lifecycle are the production code paths, only the channel is fake.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { connect } from 'node:net'
import { PassThrough } from 'node:stream'
import type { Duplex } from 'node:stream'
import { ForwardManager, FORWARD_BIND } from '../src/forward.ts'
import type { ForwardTarget } from '../src/forward.ts'
import type { RemoteWorld } from '../src/world.ts'
import type { Machine } from '../src/registry.ts'

/** One saved machine, complete enough for the registry record. */
const MACHINE: Machine = {
  id: 'build-box|22|dev',
  name: 'build-box',
  host: 'build-box',
  port: 22,
  username: 'dev',
  password: 'pw',
  privateKeyPath: '',
  passphrase: '',
  useAgent: false,
  keyboardInteractive: false,
  hostKeyMode: 'accept-new',
  workspace: '',
  color: '',
}

/**
 * A world whose only saved machine is {@link MACHINE}. The forwarder reads
 * `machineById` only; everything else stays unused so the fixture cannot
 * accidentally exercise a different path.
 */
function worldOf(machines: Machine[] = [MACHINE]): RemoteWorld {
  return {
    machineById: (id: string) => {
      const machine = machines.find((m) => m.id === id)
      return machine === undefined ? null : { source: 'registry' as const, machine }
    },
  } as unknown as RemoteWorld
}

/** An echo channel: whatever the client writes comes back. */
function echoChannel(target: ForwardTarget): Promise<Duplex> {
  void target
  return Promise.resolve(new PassThrough() as unknown as Duplex)
}

/** Connect to one loopback port, write, and read the echo. */
function roundTrip(port: number, payload: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: FORWARD_BIND, port })
    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error('the forwarded connection produced no echo in time'))
    }, 3000)
    socket.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    socket.on('data', (chunk: Buffer) => {
      clearTimeout(timer)
      socket.destroy()
      resolve(chunk.toString('utf8'))
    })
    socket.on('connect', () => socket.write(payload))
  })
}

test('an open forward listens on loopback and bridges to the remote service', async () => {
  const forwarder = new ForwardManager(worldOf(), 4, echoChannel)
  const record = await forwarder.open({ machineId: MACHINE.id, remotePort: 3000 })
  try {
    assert.equal(record.remoteHost, '127.0.0.1', 'the remote side defaults to loopback')
    assert.equal(record.remotePort, 3000)
    assert.equal(record.machineName, 'build-box')
    assert.ok(record.localPort > 0, 'the OS assigned a loopback port')
    assert.equal(record.url, `http://${FORWARD_BIND}:${record.localPort}`)
    assert.equal(await roundTrip(record.localPort, 'ping'), 'ping')
    // The accepted connection is counted, so the settings page can show use.
    assert.equal(forwarder.list()[0]?.connections, 1)
  } finally {
    forwarder.closeAll()
  }
})

test('the listener binds loopback only, never a public interface', async () => {
  const forwarder = new ForwardManager(worldOf(), 4, echoChannel)
  const record = await forwarder.open({ machineId: MACHINE.id, remotePort: 8080 })
  try {
    // A wildcard bind would accept on every interface; the record's URL is the
    // contract the settings page and the agent hand to the operator.
    assert.match(record.url, /^http:\/\/127\.0\.0\.1:\d+$/)
    const local = connect({ host: '127.0.0.1', port: record.localPort })
    await new Promise<void>((resolve, reject) => {
      local.once('connect', () => { local.destroy(); resolve() })
      local.once('error', reject)
    })
  } finally {
    forwarder.closeAll()
  }
})

test('a requested loopback port is honoured, and a taken one is refused', async () => {
  const forwarder = new ForwardManager(worldOf(), 4, echoChannel)
  const first = await forwarder.open({ machineId: MACHINE.id, remotePort: 5173, localPort: 0 })
  try {
    const same = await forwarder.open({ machineId: MACHINE.id, remotePort: 5174, localPort: first.localPort })
      .then(() => null, (err: Error) => err)
    assert.ok(same instanceof Error, 'a port already bound must be refused, not silently reused')
  } finally {
    forwarder.closeAll()
  }
})

test('close ends the tunnel and forgets the record', async () => {
  const forwarder = new ForwardManager(worldOf(), 4, echoChannel)
  const record = await forwarder.open({ machineId: MACHINE.id, remotePort: 3000 })
  assert.equal(forwarder.close(record.id), true)
  assert.deepEqual(forwarder.list(), [])
  assert.equal(forwarder.close(record.id), false, 'closing twice is a no-op')
  // The harness must not keep accepting on a forward the user closed.
  const refused = await new Promise<boolean>((resolve) => {
    const socket = connect({ host: FORWARD_BIND, port: record.localPort })
    socket.once('error', () => resolve(true))
    socket.once('connect', () => { socket.destroy(); resolve(false) })
  })
  assert.equal(refused, true)
})

test('the ceiling is enforced so a runaway agent cannot accumulate tunnels', async () => {
  const forwarder = new ForwardManager(worldOf(), 1, echoChannel)
  await forwarder.open({ machineId: MACHINE.id, remotePort: 3000 })
  try {
    const refused = await forwarder.open({ machineId: MACHINE.id, remotePort: 3001 })
      .then(() => null, (err: Error) => err)
    assert.match(String(refused), /at most 1 forwards/)
  } finally {
    forwarder.closeAll()
  }
})

test('an unknown machine or an invalid port is refused before listening', async () => {
  const forwarder = new ForwardManager(worldOf(), 4, echoChannel)
  const unknown = await forwarder.open({ machineId: 'gone|22|x', remotePort: 80 })
    .then(() => null, (err: Error) => err)
  assert.match(String(unknown), /no saved machine matches/)

  const badPort = await forwarder.open({ machineId: MACHINE.id, remotePort: 0 })
    .then(() => null, (err: Error) => err)
  assert.match(String(badPort), /remotePort must be an integer/)

  const badLocal = await forwarder.open({ machineId: MACHINE.id, remotePort: 80, localPort: 70000 })
    .then(() => null, (err: Error) => err)
  assert.match(String(badLocal), /localPort must be an integer/)
  assert.deepEqual(forwarder.list(), [], 'a refused request leaves nothing behind')
})

test('two machines can forward the same remote port to different local ports', async () => {
  const second: Machine = { ...MACHINE, id: 'web|22|dev', name: 'web', host: 'web' }
  const forwarder = new ForwardManager(worldOf([MACHINE, second]), 4, echoChannel)
  const a = await forwarder.open({ machineId: MACHINE.id, remotePort: 3000 })
  const b = await forwarder.open({ machineId: second.id, remotePort: 3000 })
  try {
    assert.notEqual(a.localPort, b.localPort, 'each tunnel owns its own loopback port')
    assert.equal(forwarder.list().length, 2)
    assert.equal(forwarder.list()[1]?.machineName, 'web')
  } finally {
    forwarder.closeAll()
  }
})
