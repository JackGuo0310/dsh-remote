/**
 * Model-facing tools for on-demand port forwarding. These are the only tools
 * this plugin adds: everything else it does by routing the host's own file,
 * shell, and search surfaces, but a tunnel is not a filesystem or a shell
 * operation, so the agent needs an explicit way to ask for one.
 *
 * All three are thin wrappers over {@link ForwardManager}; the same records are
 * listed and closed from the settings page.
 * @module dsh-remote-development/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ForwardManager, ForwardRecord } from './forward.ts'
import type { RemoteWorld } from './world.ts'

/** Wire shape of one forward, shared by `list` and `open`. */
const FORWARD_PROPERTIES = {
  id: { type: 'string', required: true, description: 'Forward id, used to close it.' },
  machine: { type: 'string', required: true, description: 'Saved machine the tunnel runs through.' },
  remoteHost: { type: 'string', required: true, description: 'Host as the remote machine resolves it.' },
  remotePort: { type: 'integer', required: true, description: 'Port on the remote machine.' },
  localPort: { type: 'integer', required: true, description: 'Loopback port the harness listens on.' },
  url: { type: 'string', required: true, description: 'URL to open in a browser on the machine running DSH.' },
} as const

/**
 * Resolve the machine a tool call names. A call may omit the machine only when
 * exactly one is saved — guessing between several would tunnel the wrong host.
 * @param world - the remote world.
 * @param raw - the caller's `machine` argument (id or display name).
 * @returns the resolved machine id.
 */
export function resolveMachineId(world: RemoteWorld, raw: string | undefined): string {
  const wanted = String(raw ?? '').trim()
  const machines = world.listMachines()
  if (wanted !== '') {
    const hit = machines.find((m) => m.id === wanted || m.name === wanted || `${m.username}@${m.host}:${m.port}` === wanted)
    if (hit === undefined) {
      const known = machines.map((m) => m.id).join(', ')
      throw new Error(`no saved machine matches ${JSON.stringify(wanted)}${known ? `; saved machines: ${known}` : ''}`)
    }
    return hit.id
  }
  if (machines.length === 1) return machines[0]!.id
  if (machines.length === 0) {
    throw new Error('no remote machine is configured — add one in Settings → 远程开发 first')
  }
  throw new Error(`machine is required (${machines.length} are saved): ${machines.map((m) => m.id).join(', ')}`)
}

/** One record as the tool wire carries it. */
function wire(record: ForwardRecord): Record<string, unknown> {
  return {
    id: record.id,
    machine: record.machineId,
    remoteHost: record.remoteHost,
    remotePort: record.remotePort,
    localPort: record.localPort,
    url: record.url,
  }
}

/**
 * Register the three forwarding tools on the tool registry.
 * @param ctx - context carrying `tools`.
 * @param world - the remote world (machine lookup).
 * @param forwards - the forward registry.
 */
export function registerForwardTools(ctx: Context, world: RemoteWorld, forwards: ForwardManager): void {
  ctx.tools.register(defineTool({
    name: 'remote_forward_open',
    description:
      'Open a temporary SSH local port forward so the operator can reach a service running on a remote machine. '
      + 'Use it when a build, dev server, or preview app listens on a port on the remote host and the user asks to look at it. '
      + 'The listener binds 127.0.0.1 on the machine running DSH, so the URL works only in a browser on that machine (or through the user\'s own tunnel). '
      + 'Nothing is preconfigured: call this with the port the service actually prints, then hand the returned URL to the user. '
      + 'Forwards stay open until closed with remote_forward_close or the plugin unloads.',
    parameters: {
      machine: { type: 'string', description: 'Saved machine id or name. Omit only when exactly one machine is saved.' },
      remotePort: { type: 'integer', required: true, description: 'Port the service listens on, on the remote machine.' },
      remoteHost: { type: 'string', description: 'Host as the remote machine resolves it. Defaults to 127.0.0.1.' },
      localPort: { type: 'integer', description: 'Loopback port to bind; omit to let the OS choose a free one.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          forward: {
            type: 'object',
            required: true,
            additionalProperties: false,
            properties: FORWARD_PROPERTIES,
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Forward open: ${value.forward.url} → ${value.forward.remoteHost}:${value.forward.remotePort}`
          + ` on ${value.forward.machine} (id ${value.forward.id}). It stays open until closed.`,
      }],
    },
    execute: async (args) => {
      const record = await forwards.open({
        machineId: resolveMachineId(world, args.machine),
        remotePort: Number(args.remotePort),
        ...(args.remoteHost === undefined ? {} : { remoteHost: args.remoteHost }),
        ...(args.localPort === undefined ? {} : { localPort: Number(args.localPort) }),
      })
      return { forward: wire(record) as never }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'remote_forward_list',
    description:
      'List the port forwards this harness currently holds open, with their loopback URLs and ids. '
      + 'Check here before reopening a port: an existing forward already gives the user a working URL.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          forwards: {
            type: 'array',
            required: true,
            items: { type: 'object', additionalProperties: false, properties: FORWARD_PROPERTIES },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.forwards.length === 0
          ? 'No port forwards are open.'
          : value.forwards.map((f) => `${f.id}: ${f.url} → ${f.remoteHost}:${f.remotePort} on ${f.machine}`).join('\n'),
      }],
    },
    execute: async () => ({ forwards: forwards.list().map(wire) as never }),
  }))

  ctx.tools.register(defineTool({
    name: 'remote_forward_close',
    description:
      'Close one open port forward by id, stopping the loopback listener. '
      + 'Call it when the user is done previewing, so the port does not stay reachable.',
    parameters: {
      id: { type: 'string', required: true, description: 'Forward id from remote_forward_open or remote_forward_list.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          closed: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.closed ? `Forward ${value.id} closed.` : `No forward ${value.id} is open.`,
      }],
    },
    execute: async (args) => ({ id: args.id, closed: forwards.close(args.id) }),
  }))
}
