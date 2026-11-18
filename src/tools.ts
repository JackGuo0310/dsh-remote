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

import path from 'node:path'
import { homedir } from 'node:os'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-shell'
import type {} from '@deepseek-ai/dsh-sandbox-policy'
import type { SandboxExecutionPolicy } from '@deepseek-ai/dsh-sandbox'
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
 * The local directory a `bash_local` call runs in. `~` and `~/x` expand to the
 * host home, anything else resolves as a path on the host. A directory under an
 * anchor is refused: that path is a handle for a remote workspace, and running
 * a local command "in" it would silently act on the wrong machine.
 * @param world - the remote world (path classification).
 * @param raw - the caller's `workdir`, if any.
 * @returns the absolute local working directory.
 */
export function localWorkdir(world: Pick<RemoteWorld, 'classifyHostPath'>, raw: string | undefined): string {
  const home = homedir()
  const wanted = String(raw ?? '').trim()
  const expanded = wanted === '' || wanted === '~'
    ? home
    : wanted.startsWith('~/') || wanted.startsWith('~\\')
      ? path.join(home, wanted.slice(2))
      : wanted
  const abs = path.resolve(expanded)
  if (world.classifyHostPath(abs).kind === 'remote') {
    throw new Error(`"${abs}" is the local handle of a remote workspace; use the bash tool for commands that must run there`)
  }
  return abs
}

/**
 * A policy carrying the calling session's mode but a workspace root on THIS
 * machine. The session's root is the remote workspace (or its anchor handle),
 * which a local sandbox compares against absolute local paths — passing it
 * unchanged would deny every local write under `workspace-write`.
 * @param base - the session-resolved policy (mode and session identity).
 * @param localRoot - the absolute host directory the command runs in.
 * @returns the same policy, re-rooted locally.
 */
export function localPolicy(base: SandboxExecutionPolicy, localRoot: string): SandboxExecutionPolicy {
  return { ...base, workspaceRoot: localRoot }
}

/**
 * Register the two explicit local/remote channels on the tool registry:
 * `fs_remove` (the host has no model-facing delete tool) and `bash_local` (a
 * session whose workspace is remote otherwise has no way to run a command on
 * the machine DSH itself runs on). Transparent routing still covers everything
 * else; these exist because routing alone cannot express either intent.
 * @param ctx - context carrying `tools`, `fs`, `sandboxPolicy`, and `shell`.
 * @param world - the remote world (path classification for `bash_local`).
 */
export function registerSessionTools(ctx: Context, world: RemoteWorld): void {
  // The calling session selects the mode; an agentless call (a scripted
  // dispatch) falls back to the deployment policy. `exactOptionalPropertyTypes`
  // rejects `{ session: undefined }`, so the request is built conditionally.
  const policyOf = (exec: ToolRunContext): SandboxExecutionPolicy => {
    const session = exec.agent?.session
    return ctx.sandboxPolicy.resolve(session === undefined ? {} : { session })
  }

  ctx.tools.register(defineTool({
    name: 'fs_remove',
    description:
      'Delete one file. A path inside the workspace deletes on whichever side serves it: a remote workspace deletes over SFTP, '
      + 'a local workspace deletes through the local sandbox. Refuses directories and other non-regular files, and never deletes a file '
      + 'whose content changed since it was read.',
    parameters: {
      path: { type: 'string', required: true, description: 'File to delete: absolute, or relative to the workspace directory.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string', required: true },
          removed: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.removed ? `Removed ${value.path}.` : `No file was removed at ${value.path}.`,
      }],
    },
    execute: async (args, exec) => {
      const cwd = exec.agent?.session?.header?.cwd ?? process.cwd()
      const target = await ctx.fs.resolve(args.path, { cwd })
      const policy = policyOf(exec)
      await ctx.fs.deleteFile(target, undefined, exec.signal, policy)
      return { path: target.displayPath, removed: true }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'bash_local',
    description:
      'Run one command on the machine DSH itself runs on, in a local directory. Use it from a remote workspace session when the command '
      + 'must act on THIS machine — the plain bash tool follows the workspace and therefore runs remotely. The command runs under the '
      + 'local sandbox with the session\'s mode, confined to the local working directory.',
    parameters: {
      command: { type: 'string', required: true, description: 'Command text for the local shell (bash on POSIX, pwsh on Windows).' },
      workdir: { type: 'string', description: 'Local directory to run in. `~` expands to the home directory; defaults to the home directory.' },
      timeoutMs: { type: 'integer', description: 'Optional deadline in milliseconds; the shell executor still applies its own cap.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          command: { type: 'string', required: true },
          workdir: { type: 'string', required: true },
          exitCode: { type: 'integer' },
          stdout: { type: 'string', required: true },
          stderr: { type: 'string', required: true },
          timedOut: { type: 'boolean', required: true },
          truncated: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => {
        const parts = [value.stdout]
        if (value.stderr !== '') parts.push(`[stderr]\n${value.stderr}`)
        if (value.exitCode !== undefined && value.exitCode !== 0) parts.push(`[exit code: ${value.exitCode}]`)
        if (value.timedOut) parts.push('[timed out]')
        if (value.truncated) parts.push('[output truncated]')
        return [{ type: 'text', text: parts.filter((part) => part !== '').join('\n') || '(no output)' }]
      },
    },
    execute: async (args, exec) => {
      const workdir = localWorkdir(world, args.workdir)
      const policy = localPolicy(policyOf(exec), workdir)
      const spec = ctx.shell.resolve({
        command: args.command,
        workdir,
        sandboxPolicy: policy,
        signal: exec.signal,
        ...(args.timeoutMs === undefined ? {} : { timeoutMs: Number(args.timeoutMs) }),
      })
      const result = await (await ctx.shell.execute(spec)).result()
      return {
        command: args.command,
        workdir,
        ...(result.exitCode === null ? {} : { exitCode: result.exitCode }),
        stdout: result.stdout.text,
        stderr: result.stderr.text,
        timedOut: result.timedOut,
        truncated: result.stdout.truncated || result.stderr.truncated,
      }
    },
  }))
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
