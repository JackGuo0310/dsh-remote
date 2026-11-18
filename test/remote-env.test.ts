/**
 * The environment probe is pure once the transcript arrives: these tests drive
 * the parser and every install hint from a fabricated transcript, so the
 * "what does the machine have / what should the operator type" mapping is
 * fixed without an SSH server.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  ENV_HINT_PREFIX,
  ENV_PROBE_SCRIPT,
  ENV_SETTINGS_PATH,
  RIPGREP_HINT_VERSION,
  machineLabel,
  muslSlug,
  parseEnvironment,
  rgMissingHint,
  ripgrepCommands,
} from '../src/remote-env.ts'
import type { RemoteEnvironment } from '../src/remote-env.ts'

/** One healthy machine transcript; a test overrides the fields it cares about. */
const HEALTHY: Record<string, string> = {
  os: 'Linux',
  arch: 'x86_64',
  bash: 'GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)',
  rg: '/usr/bin/rg',
  rgver: 'ripgrep 14.1.1 (rev 4649aa9700)',
  git: '/usr/bin/git',
  tar: '/usr/bin/tar',
  curl: '/usr/bin/curl',
  wget: '/usr/bin/wget',
  sudo: '/usr/bin/sudo',
  home: '/home/dev',
  homew: '1',
  path: '/home/dev/.local/bin:/usr/local/bin:/usr/bin:/bin',
  writepath: '/home/dev/.local/bin',
}

const MACHINE_ID = '100.117.157.9|22|jack'

/**
 * Build one probe transcript. A key mapped to `undefined` is omitted, which is
 * exactly what the probe prints for a missing program (`printf` still runs with
 * an empty command substitution).
 */
function transcript(overrides: Record<string, string | undefined> = {}): string {
  const fields: Record<string, string | undefined> = { ...HEALTHY, ...overrides }
  return Object.entries(fields)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${key}\t${value}`)
    .join('\n') + '\n'
}

function environmentOf(overrides: Record<string, string | undefined> = {}): RemoteEnvironment {
  return parseEnvironment(transcript(overrides), MACHINE_ID, '2026-01-01T00:00:00.000Z')
}

test('the probe script asks for every fact the verdict uses', () => {
  for (const key of ['os', 'arch', 'bash', 'rg', 'rgver', 'git', 'tar', 'curl', 'wget', 'sudo', 'home', 'homew', 'path', 'writepath']) {
    assert.ok(ENV_PROBE_SCRIPT.includes(`'${key}\\t`), `the probe must print the ${key} field`)
  }
  // One round trip, and a missing command must not abort the rest of it.
  assert.ok(!ENV_PROBE_SCRIPT.includes('set -e'), 'a missing program must not stop the transcript')
})

test('a healthy machine reports no problems', () => {
  const env = environmentOf()
  assert.equal(env.platform, 'Linux')
  assert.equal(env.arch, 'x86_64')
  assert.equal(env.rgPath, '/usr/bin/rg')
  assert.equal(env.writablePathDir, '/home/dev/.local/bin')
  assert.equal(env.homeWritable, true)
  assert.deepEqual(env.problems, [])
})

test('a missing rg is an error problem carrying both install routes', () => {
  const env = environmentOf({ rg: undefined, rgver: undefined })
  const problem = env.problems.find((p) => p.id === 'rg')
  assert.ok(problem, 'rg is the one gap that breaks the search tools')
  assert.equal(problem.severity, 'error')
  assert.deepEqual(problem.commands.map((c) => c.label), ['apt', 'no sudo'])
  assert.match(problem.commands[0]!.command, /^sudo apt-get update && sudo apt-get install -y ripgrep$/)
  const staticCommand = problem.commands[1]!
  assert.match(staticCommand.command, new RegExp(RIPGREP_HINT_VERSION.replaceAll('.', '\\.')))
  assert.match(staticCommand.command, /x86_64-unknown-linux-musl/)
  assert.equal(staticCommand.note, undefined, 'the write target is already on PATH')
})

test('the static route maps uname -m onto the musl slug', () => {
  assert.equal(muslSlug('x86_64'), 'x86_64-unknown-linux-musl')
  assert.equal(muslSlug('AMD64'), 'x86_64-unknown-linux-musl')
  assert.equal(muslSlug('aarch64'), 'aarch64-unknown-linux-musl')
  assert.equal(muslSlug('arm64'), 'aarch64-unknown-linux-musl')
  assert.equal(muslSlug('riscv64'), undefined)
  assert.equal(muslSlug(''), undefined)
})

test('the static route installs into a writable PATH directory, or says how to add one', () => {
  const onPath = ripgrepCommands({
    platform: 'Linux', arch: 'aarch64', sudoPath: '', curlPath: '/usr/bin/curl', wgetPath: '', writablePathDir: '/home/dev/bin', path: '/home/dev/bin',
  })
  assert.equal(onPath.length, 1)
  assert.match(onPath[0]!.command, /mkdir -p \/home\/dev\/bin/)
  assert.match(onPath[0]!.command, /aarch64-unknown-linux-musl\.tar\.gz/)
  assert.match(onPath[0]!.command, /install -m 755 .* \/home\/dev\/bin\/rg$/)
  assert.equal(onPath[0]!.note, undefined)

  const offPath = ripgrepCommands({
    platform: 'Linux', arch: 'x86_64', sudoPath: '/usr/bin/sudo', curlPath: '/usr/bin/curl', wgetPath: '', writablePathDir: '', path: '/usr/bin:/bin',
  })
  const noSudo = offPath.find((c) => c.label === 'no sudo')!
  assert.match(noSudo.command, /mkdir -p \$HOME\/\.local\/bin/)
  assert.match(noSudo.note ?? '', /not on PATH/)
})

test('the static route falls back to wget, and explains when neither downloader exists', () => {
  const withWget = ripgrepCommands({
    platform: 'Linux', arch: 'x86_64', sudoPath: '', curlPath: '', wgetPath: '/usr/bin/wget', writablePathDir: '/home/dev/bin', path: '/home/dev/bin',
  })
  assert.match(withWget[0]!.command, /^mkdir -p \/home\/dev\/bin && wget -qO- /)
  assert.equal(withWget[0]!.note, undefined)

  const withNeither = ripgrepCommands({
    platform: 'Linux', arch: 'x86_64', sudoPath: '', curlPath: '', wgetPath: '', writablePathDir: '/home/dev/bin', path: '/home/dev/bin',
  })
  assert.match(withNeither[0]!.command, /^mkdir -p \/home\/dev\/bin && curl -fsSL /)
  assert.match(withNeither[0]!.note ?? '', /Neither curl nor wget/)
})

test('macOS gets no Linux static-binary route', () => {
  const env = environmentOf({ os: 'Darwin', rg: undefined, rgver: undefined, sudo: '/usr/bin/sudo' })
  const problem = env.problems.find((p) => p.id === 'rg')!
  assert.deepEqual(problem.commands.map((c) => c.label), ['apt'], 'a musl binary cannot run on macOS')
})

test('the shared rg hint names the machine, the fix, and the settings page', () => {
  const hint = rgMissingHint(MACHINE_ID, environmentOf({ rg: undefined, rgver: undefined }))
  const lines = hint.split('\n')
  assert.ok(lines.every((line) => line.startsWith(ENV_HINT_PREFIX)), 'every line is marked as advice')
  assert.match(hint, /jack@100\.117\.157\.9:22/)
  assert.match(hint, /sudo apt-get update && sudo apt-get install -y ripgrep/)
  assert.match(hint, /x86_64-unknown-linux-musl/)
  assert.ok(hint.includes(ENV_SETTINGS_PATH), 'the operator is told where to re-check')
  assert.match(hint, /re-check/, 'an existing verdict is a cache hit, not a fresh probe')
})

test('a machine that was never probed still gets the apt command', () => {
  const hint = rgMissingHint(MACHINE_ID, undefined)
  assert.match(hint, /sudo apt-get update && sudo apt-get install -y ripgrep/)
  assert.match(hint, /no environment check has run/)
  assert.ok(hint.includes(ENV_SETTINGS_PATH))
  assert.equal(machineLabel(MACHINE_ID), 'jack@100.117.157.9:22')
  assert.equal(machineLabel('host|22|'), '?@host:22', 'a blank user still reads as a machine')
})

test('bash, git, tar, home, and arch gaps each carry their own verdict', () => {
  const env = environmentOf({
    arch: undefined, os: undefined, bash: undefined, git: undefined, tar: undefined, homew: '0', sudo: '',
  })
  const ids = env.problems.map((p) => p.id)
  assert.deepEqual(ids, ['arch', 'bash', 'git', 'tar', 'home'])
  assert.equal(env.problems.find((p) => p.id === 'bash')!.severity, 'error')
  // No sudo means no apt route: the hint must not hand over a command that
  // needs a password the operator was not told about.
  assert.deepEqual(env.problems.find((p) => p.id === 'git')!.commands, [])
  assert.deepEqual(env.problems.find((p) => p.id === 'tar')!.commands, [])
  assert.match(env.problems.find((p) => p.id === 'home')!.message, /not writable/)
})

test('a writable home that is already on PATH is reported as such', () => {
  const env = environmentOf({ writepath: undefined })
  assert.equal(env.writablePathDir, '')
  assert.equal(env.homeWritable, true)
  assert.deepEqual(env.problems, [], 'an empty writable-path answer is not itself a problem')
})
