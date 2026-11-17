/**
 * On-demand SSH local port forwarding. One forward is one loopback listener
 * whose accepted connections are piped into a `direct-tcpip` channel through
 * the machine's pooled SSH connection, so a service running on the remote host
 * becomes reachable at `127.0.0.1:<localPort>` from the browser.
 *
 * Nothing is preconfigured and nothing is persisted: a forward exists from
 * `open()` until `close()`, the plugin unloads, or the harness exits. The
 * listener binds loopback only — publishing a remote service to a network is a
 * deliberate act this module never takes on its own.
 * @module dsh-remote-development/forward
 */

import { createServer } from 'node:net'
import type { AddressInfo, Server, Socket } from 'node:net'
import type { Duplex } from 'node:stream'
import type { RemoteWorld } from './world.ts'

/** Bind address of every forward listener. */
export const FORWARD_BIND = '127.0.0.1'

/** How many forwards may be open at once, absent a config override. */
export const DEFAULT_MAX_FORWARDS = 8

/** The remote service a forward points at. */
export interface ForwardTarget {
  /** Saved machine id (`host|port|user`) the tunnel runs through. */
  machineId: string
  /** Host as the REMOTE machine resolves it; loopback by default. */
  remoteHost: string
  /** Port on the remote host. */
  remotePort: number
}

/** One open forward as the settings page and the agent tools read it. */
export interface ForwardRecord extends ForwardTarget {
  id: string
  /** Saved machine's display name, for a human reading the row. */
  machineName: string
  /** Loopback port the listener owns. */
  localPort: number
  /** The URL an operator opens in a browser on the machine running DSH. */
  url: string
  /** ISO timestamp of `open()`. */
  createdAt: string
  /** Connections accepted so far (a rough "is anyone using it" signal). */
  connections: number
}

/** What `open()` takes: a machine and a remote port, everything else optional. */
export interface ForwardInput {
  machineId: string
  remotePort: number
  remoteHost?: string
  /** Requested loopback port; omitted or 0 lets the OS pick one. */
  localPort?: number
}

/**
 * Opens one raw duplex channel to the remote service. Injected so a test can
 * drive the listener over an in-process fake instead of a live SSH server.
 */
export type ForwardChannelOpener = (target: ForwardTarget) => Promise<Duplex>

/** One live forward: its public record, its listener, and its open sockets. */
interface LiveForward {
  record: ForwardRecord
  server: Server
  sockets: Set<Socket>
}

/** Validate one TCP port, naming the field in the refusal. */
function portOf(value: unknown, field: string): number {
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${field} must be an integer between 1 and 65535`)
  }
  return port
}

/**
 * Bind one server and resolve once it is listening. Only a bind failure
 * (`EADDRINUSE`, a privileged port) rejects; the caller reports that text.
 * @param server - the unbound server.
 * @param port - loopback port, 0 for an OS-assigned one.
 */
function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error): void => {
      server.off('listening', onListening)
      reject(err)
    }
    const onListening = (): void => {
      server.off('error', onError)
      resolve()
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen({ host: FORWARD_BIND, port })
  })
}

/**
 * The forward registry. Owned by the plugin for the life of its fiber, so
 * unloading the plugin tears every listener down.
 */
export class ForwardManager {
  private readonly live = new Map<string, LiveForward>()
  private sequence = 0

  /**
   * @param world - the remote world (machine lookup and channel opening).
   * @param max - ceiling on simultaneously open forwards.
   * @param opener - channel opener override (tests); defaults to the world.
   */
  constructor(
    private readonly world: RemoteWorld,
    private readonly max: number = DEFAULT_MAX_FORWARDS,
    private readonly opener?: ForwardChannelOpener,
  ) {}

  /**
   * Open one forward. Refuses an unknown machine, an invalid port, and a
   * request past the ceiling; a bind failure surfaces as its own error.
   * @param input - machine, remote port/host, optional loopback port.
   * @returns the live record.
   */
  async open(input: ForwardInput): Promise<ForwardRecord> {
    const machineId = String(input.machineId ?? '').trim()
    if (machineId === '') throw new Error('machineId is required')
    const ref = this.world.machineById(machineId)
    if (ref === null) throw new Error(`no saved machine matches machineId "${machineId}"`)
    if (this.live.size >= this.max) {
      throw new Error(`at most ${this.max} forwards may be open at once; close one first`)
    }
    const remotePort = portOf(input.remotePort, 'remotePort')
    // 0 means "let the OS choose", the same convention `listen()` uses.
    const localPort = input.localPort === undefined || Number(input.localPort) === 0
      ? 0
      : portOf(input.localPort, 'localPort')
    const remoteHost = String(input.remoteHost ?? '').trim() || '127.0.0.1'
    const target: ForwardTarget = { machineId, remoteHost, remotePort }

    const sockets = new Set<Socket>()
    const record: ForwardRecord = {
      ...target,
      id: `fwd-${++this.sequence}`,
      machineName: ref.machine.name,
      localPort: 0,
      url: '',
      createdAt: new Date().toISOString(),
      connections: 0,
    }
    const server = createServer((socket) => {
      sockets.add(socket)
      // A client that hangs up is not this forward's failure, and an
      // unhandled 'error' on a socket would take the whole process down.
      socket.on('error', () => { socket.destroy() })
      socket.on('close', () => { sockets.delete(socket) })
      record.connections += 1
      this.bridge(socket, target)
    })
    // The listener outlives individual clients: a later 'error' must not throw
    // as an unhandled event.
    server.on('error', () => {})
    await listen(server, localPort)
    const bound = (server.address() as AddressInfo).port
    record.localPort = bound
    record.url = `http://${FORWARD_BIND}:${bound}`
    this.live.set(record.id, { record, server, sockets })
    return { ...record }
  }

  /**
   * Pipe one accepted socket into its remote channel. Either side closing
   * tears down the other, so a half-open tunnel cannot leak.
   * @param socket - the accepted loopback connection.
   * @param target - the remote service to reach.
   */
  private bridge(socket: Socket, target: ForwardTarget): void {
    let channel: Duplex | null = null
    const close = (): void => {
      socket.destroy()
      if (channel !== null) channel.destroy()
    }
    void this.channelFor(target).then((opened) => {
      if (socket.destroyed) {
        opened.destroy()
        return
      }
      channel = opened
      opened.on('error', close)
      opened.on('close', close)
      socket.on('close', close)
      socket.pipe(opened)
      opened.pipe(socket)
    }).catch((err: unknown) => {
      socket.destroy()
      this.lastError = err instanceof Error ? err.message : String(err)
    })
  }

  /** The most recent bridge failure, surfaced in `list()` for diagnosis. */
  lastError?: string

  /** Open one channel through the machine's pool (or the injected opener). */
  private channelFor(target: ForwardTarget): Promise<Duplex> {
    if (this.opener !== undefined) return this.opener(target)
    return this.world.forwardOn(target.machineId, target.remoteHost, target.remotePort)
  }

  /**
   * Every open forward, oldest first.
   * @returns copies of the live records.
   */
  list(): ForwardRecord[] {
    return [...this.live.values()].map((entry) => ({ ...entry.record }))
  }

  /**
   * Close one forward by id.
   * @param id - the record id from `list()`/`open()`.
   * @returns true when a forward by that id was open.
   */
  close(id: string): boolean {
    const entry = this.live.get(id)
    if (entry === undefined) return false
    this.live.delete(id)
    for (const socket of entry.sockets) socket.destroy()
    entry.sockets.clear()
    entry.server.close()
    return true
  }

  /** Close every forward (plugin teardown). */
  closeAll(): void {
    for (const id of [...this.live.keys()]) this.close(id)
  }
}
