/**
 * Remote environment checks. A remote session runs the host's tools against a
 * machine the plugin knows almost nothing about: when `rg` is missing, the
 * search tools fail inside a subprocess and the model sees a raw
 * "command not found". This module probes the machine once, caches the answer,
 * and turns each missing prerequisite into an actionable note with commands the
 * operator can paste into a shell.
 *
 * Nothing here installs anything: the probe only reports.
 * @module dsh-remote-development/remote-env
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent'
import type { RemoteWorld } from './world.ts'

/** One install route the operator can run themselves. */
export interface InstallCommand {
  /** Short label shown next to the command. */
  label: string
  command: string
  /** Why this route might not apply (e.g. no sudo), shown as a hint. */
  note?: string
}

/** One missing or unhealthy prerequisite. */
export interface EnvProblem {
  id: 'bash' | 'rg' | 'git' | 'tar' | 'home' | 'arch'
  severity: 'error' | 'warn'
  /** One-line explanation for the settings page. */
  message: string
  /** Copyable routes to fix it; empty when only a note applies. */
  commands: InstallCommand[]
}

/** What one probe learned about a machine. */
export interface RemoteEnvironment {
  machineId: string
  /** ISO timestamp of the probe. */
  checkedAt: string
  /** `uname -s` (Linux, Darwin, …). */
  platform: string
  /** `uname -m` (x86_64, aarch64, …). */
  arch: string
  bashVersion: string
  rgPath: string
  rgVersion: string
  gitPath: string
  tarPath: string
  curlPath: string
  wgetPath: string
  sudoPath: string
  home: string
  homeWritable: boolean
  path: string
  /** First writable directory on PATH under the home directory, or ''. */
  writablePathDir: string
  problems: EnvProblem[]
}

/** Runs one command on the remote machine (the world's `execOn`, injected). */
export type EnvProbeRunner = (command: string, timeoutMs: number) => Promise<{ stdout: string }>

/** Pinned ripgrep release used by the static-binary hint. */
export const RIPGREP_HINT_VERSION = '14.1.1'

/** Line prefix every element of a routing hint carries, so it reads as advice. */
export const ENV_HINT_PREFIX = '[env] '

/**
 * Where the operator can measure a machine and re-run the check. The settings
 * page is the only place these values are visible, so every hint names it.
 */
export const ENV_SETTINGS_PATH = 'Settings → 远程开发 → 环境检查'

/**
 * The machine identity a hint names, decoded from the record id
 * (`host|port|username`). Formatting it here means a failure message never has
 * to resolve the registry again from inside an error path.
 * @param machineId - a saved machine id.
 * @returns `username@host:port`.
 */
export function machineLabel(machineId: string): string {
  const [host = '', port = '', username = ''] = machineId.split('|')
  return `${username || '?'}@${host || '?'}:${port || '?'}`
}

/** The shell program that reads every field. One round trip, no `set -e`. */
export const ENV_PROBE_SCRIPT = [
  'printf \'os\\t%s\\n\' "$(uname -s 2>/dev/null)"',
  'printf \'arch\\t%s\\n\' "$(uname -m 2>/dev/null)"',
  'printf \'bash\\t%s\\n\' "$(bash --version 2>/dev/null | head -n 1)"',
  'printf \'rg\\t%s\\n\' "$(command -v rg 2>/dev/null)"',
  'printf \'rgver\\t%s\\n\' "$(rg --version 2>/dev/null | head -n 1)"',
  'printf \'git\\t%s\\n\' "$(command -v git 2>/dev/null)"',
  'printf \'tar\\t%s\\n\' "$(command -v tar 2>/dev/null)"',
  'printf \'curl\\t%s\\n\' "$(command -v curl 2>/dev/null)"',
  'printf \'wget\\t%s\\n\' "$(command -v wget 2>/dev/null)"',
  'printf \'sudo\\t%s\\n\' "$(command -v sudo 2>/dev/null)"',
  'printf \'home\\t%s\\n\' "$HOME"',
  'if [ -w "$HOME" ]; then printf \'homew\\t1\\n\'; else printf \'homew\\t0\\n\'; fi',
  'printf \'path\\t%s\\n\' "$PATH"',
  'wp=\'\'; oldifs=$IFS; IFS=:; for d in $PATH; do [ -n "$d" ] || continue; [ -w "$d" ] || continue; case "$d" in "$HOME"/*) wp=$d; break;; esac; done; IFS=$oldifs; printf \'writepath\\t%s\\n\' "$wp"',
].join('\n')

/** Map `uname -m` onto the musl release slug. */
export function muslSlug(arch: string): string | undefined {
  const a = arch.trim().toLowerCase()
  if (a === 'x86_64' || a === 'amd64') return 'x86_64-unknown-linux-musl'
  if (a === 'aarch64' || a === 'arm64') return 'aarch64-unknown-linux-musl'
  return undefined
}

/**
 * The two ways to install ripgrep, tailored to what the machine has: the
 * distribution package when `sudo` is available, and the pinned static musl
 * binary otherwise. Nothing is installed from here — both are text the
 * operator can copy.
 * @param env - the probed facts that pick the routes.
 * @returns the commands to show, in preference order.
 */
export function ripgrepCommands(env: Pick<RemoteEnvironment, 'platform' | 'sudoPath' | 'curlPath' | 'wgetPath' | 'arch' | 'writablePathDir' | 'path'>): InstallCommand[] {
  const commands: InstallCommand[] = []
  if (env.sudoPath !== '') {
    commands.push({
      label: 'apt',
      command: 'sudo apt-get update && sudo apt-get install -y ripgrep',
    })
  }
  const slug = muslSlug(env.arch)
  // The musl builds are Linux-only: macOS needs Homebrew, and reporting a
  // Linux binary there would hand the operator a command that cannot work.
  if (slug !== undefined && env.platform !== 'Darwin') {
    const targetDir = env.writablePathDir !== '' ? env.writablePathDir : '$HOME/.local/bin'
    const onPath = env.writablePathDir !== ''
    const url = `https://github.com/BurntSushi/ripgrep/releases/download/${RIPGREP_HINT_VERSION}/ripgrep-${RIPGREP_HINT_VERSION}-${slug}.tar.gz`
    const extract = `ripgrep-${RIPGREP_HINT_VERSION}-${slug}`
    const fetch = env.curlPath !== ''
      ? `curl -fsSL ${url}`
      : env.wgetPath !== ''
        ? `wget -qO- ${url}`
        // curl is the one downloader worth assuming: a machine with neither is
        // told to get one, and the command it sees stays the one that works
        // once it has.
        : `curl -fsSL ${url}`
    const command = `mkdir -p ${targetDir} && ${fetch} | tar xz -C /tmp && install -m 755 /tmp/${extract}/rg ${targetDir}/rg`
    const notes: string[] = []
    if (env.curlPath === '' && env.wgetPath === '') notes.push('Neither curl nor wget was detected; install one first.')
    if (!onPath) notes.push(`${targetDir} is not on PATH; add it in your shell profile and start a new session.`)
    commands.push({
      label: 'no sudo',
      command,
      ...(notes.length === 0 ? {} : { note: notes.join(' ') }),
    })
  }
  return commands
}

/**
 * The explanation appended to a failed remote run whose stderr says `rg` is
 * missing. Both routing paths use it, so the model reads the same advice
 * whether a search crossed the subprocess seam or a bash command.
 * @param machineId - the machine the command ran on.
 * @param environment - the cached probe for that machine, when one exists.
 * @returns the hint block, one `[env]` line per fact.
 */
export function rgMissingHint(machineId: string, environment: RemoteEnvironment | undefined): string {
  const who = machineLabel(machineId)
  const lines = [
    `${ENV_HINT_PREFIX}ripgrep ("rg") is not available on ${who}, so the grep/glob tools cannot search that machine.`,
  ]
  const commands = environment?.problems.find((problem) => problem.id === 'rg')?.commands ?? []
  if (commands.length === 0) {
    lines.push(`${ENV_HINT_PREFIX}install it there, for example: sudo apt-get update && sudo apt-get install -y ripgrep`)
  } else {
    for (const route of commands) {
      lines.push(`${ENV_HINT_PREFIX}${route.label}: ${route.command}`)
      if (route.note !== undefined && route.note !== '') lines.push(`${ENV_HINT_PREFIX}  ${route.note}`)
    }
  }
  lines.push(environment === undefined
    ? `${ENV_HINT_PREFIX}no environment check has run for ${who} yet; open ${ENV_SETTINGS_PATH} to measure it.`
    : `${ENV_HINT_PREFIX}re-check ${who} in ${ENV_SETTINGS_PATH}.`)
  return lines.join('\n')
}

/**
 * Turn one probe transcript into a verdict. Pure, so the mapping from "what the
 * machine printed" to "what the operator should do" is testable without SSH.
 * @param raw - the probe's stdout.
 * @param machineId - the machine the transcript belongs to.
 * @param checkedAt - probe timestamp.
 * @returns the environment with its problems.
 */
export function parseEnvironment(raw: string, machineId: string, checkedAt: string): RemoteEnvironment {
  const fields = new Map<string, string>()
  for (const line of raw.split('\n')) {
    const tab = line.indexOf('\t')
    if (tab < 0) continue
    fields.set(line.slice(0, tab), line.slice(tab + 1).trim())
  }
  const get = (key: string): string => fields.get(key) ?? ''
  const env: RemoteEnvironment = {
    machineId,
    checkedAt,
    platform: get('os'),
    arch: get('arch'),
    bashVersion: get('bash'),
    rgPath: get('rg'),
    rgVersion: get('rgver'),
    gitPath: get('git'),
    tarPath: get('tar'),
    curlPath: get('curl'),
    wgetPath: get('wget'),
    sudoPath: get('sudo'),
    home: get('home'),
    homeWritable: get('homew') === '1',
    path: get('path'),
    writablePathDir: get('writepath'),
    problems: [],
  }
  env.problems = environmentProblems(env)
  return env
}

/**
 * The actionable gaps this environment has. `rg` first: it is the one that
 * makes the built-in search tools fail hard.
 * @param env - the parsed environment.
 * @returns problems in display order.
 */
export function environmentProblems(env: RemoteEnvironment): EnvProblem[] {
  const problems: EnvProblem[] = []
  if (env.platform === '' || env.arch === '') {
    problems.push({
      id: 'arch',
      severity: 'warn',
      message: 'Could not identify the machine architecture; install hints use the default release.',
      commands: [],
    })
  }
  if (env.bashVersion === '') {
    problems.push({
      id: 'bash',
      severity: 'error',
      message: 'bash was not found; remote commands run under a POSIX shell, so scripts may fail.',
      commands: [],
    })
  }
  if (env.rgPath === '') {
    problems.push({
      id: 'rg',
      severity: 'error',
      message: 'ripgrep (rg) is missing: the grep and glob tools cannot search this machine.',
      commands: ripgrepCommands(env),
    })
  }
  if (env.gitPath === '') {
    problems.push({
      id: 'git',
      severity: 'warn',
      message: 'git is missing; version-control commands will fail.',
      commands: env.sudoPath !== ''
        ? [{ label: 'apt', command: 'sudo apt-get update && sudo apt-get install -y git' }]
        : [],
    })
  }
  if (env.tarPath === '') {
    problems.push({
      id: 'tar',
      severity: 'warn',
      message: 'tar is missing; unpacking archives remotely will fail.',
      commands: env.sudoPath !== ''
        ? [{ label: 'apt', command: 'sudo apt-get update && sudo apt-get install -y tar' }]
        : [],
    })
  }
  if (env.home !== '' && !env.homeWritable) {
    problems.push({
      id: 'home',
      severity: 'warn',
      message: `The home directory ${env.home} is not writable; managed tooling and dotfiles cannot be created there.`,
      commands: [],
    })
  }
  return problems
}

/**
 * Probe one machine. Never throws on a missing command — the transcript is the
 * result; only a transport failure rejects.
 * @param run - executes the probe command on the machine.
 * @param machineId - target identity for the record.
 * @param timeoutMs - probe deadline.
 * @returns the parsed environment.
 */
export async function probeRemoteEnvironment(run: EnvProbeRunner, machineId: string, timeoutMs: number): Promise<RemoteEnvironment> {
  const result = await run(ENV_PROBE_SCRIPT, timeoutMs)
  return parseEnvironment(result.stdout, machineId, new Date().toISOString())
}

/**
 * Warm the cache when an agent starts on a remote workspace, so the first
 * failed search can already explain itself. Fire-and-forget by design: a slow
 * or unreachable machine must not delay the session.
 * @param world - the remote world (cache owner).
 * @param cwd - the session's working directory.
 */
export function warmEnvironment(world: RemoteWorld, cwd: string | undefined): void {
  if (cwd === undefined) return
  const classified = world.classifyHostPath(cwd)
  if (classified.kind !== 'remote') return
  const ref = world.machineForAnchor(classified.route.anchor)
  if (ref === null) return
  void world.environmentFor(ref).catch(() => {
    // A warm-up failure is reported by the settings page's explicit check.
  })
}

/**
 * Warm every remote session's machine, so the first failed search can explain
 * itself without a probe on the error path. Nothing here is awaited: a slow or
 * unreachable machine must never delay a session, and the settings page owns
 * the explicit, awaited check.
 * @param ctx - plugin context (agent lifecycle).
 * @param world - the remote world (environment cache owner).
 */
export function registerEnvironmentWarmup(ctx: Context, world: RemoteWorld): void {
  const warm = (agent: Agent): void => { warmEnvironment(world, agent.session?.header?.cwd) }
  for (const agent of ctx.agents.list()) warm(agent)
  ctx.on('agent/created', ({ agent }) => { warm(agent) })
}
