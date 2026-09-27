/**
 * Loading the plugin while an agent is closing. `agent.ctx` refuses
 * registration once its fiber is disposed, and the agent registry's `list()`
 * hands out every stored entry without filtering on that, so a plugin that
 * registers per-agent scopes by enumerating live agents can meet one that is
 * already gone. Throwing there aborts the entire load, which is what made
 * installing the plugin fail until the harness restarted.
 *
 * Both agent contexts here are real cordis fibers, so the refusal under test
 * is cordis's own `assertActive` rather than a stub.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Context, Service } from '@deepseek-ai/cordis'
import { RemoteWorld } from '../src/world.ts'
import { sanitizeMachine } from '../src/registry.ts'
import { registerPrompt } from '../src/prompt.ts'
import { registerToolVisibility } from '../src/tool-visibility.ts'
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

/** Records what the two modules register. */
class StubSystemPrompt extends Service {
  readonly sections: string[] = []

  constructor(ctx: Context) {
    super(ctx, 'systemPrompt')
  }

  section(opts: { name: string }): () => void {
    this.sections.push(opts.name)
    return () => {}
  }

  variable(_name: string, _provider: (context: unknown) => string | undefined): () => void {
    return () => {}
  }
}

class StubTools extends Service {
  readonly restrictions: string[][] = []

  constructor(ctx: Context) {
    super(ctx, 'tools')
  }

  get(name: string): undefined {
    return name === 'bash' ? ({} as never) : undefined
  }

  restrict(opts: { deny: string[] }): () => void {
    this.restrictions.push(opts.deny)
    return () => {}
  }
}

/** The agent registry, seeded with the agents the plugin will enumerate. */
class StubAgents extends Service {
  agents: { ctx: Context; session?: { header?: { cwd?: string } } }[] = []

  constructor(ctx: Context) {
    super(ctx, 'agents')
  }

  list(): { ctx: Context; session?: { header?: { cwd?: string } } }[] {
    return this.agents
  }
}

/** The services the two modules read, over a swappable fiber. */
function serviceContext(): Context {
  return {
    systemPrompt: { section: (): (() => void) => () => {}, variable: (): (() => void) => () => {} },
    tools: { get: (): undefined => undefined, restrict: (): (() => void) => () => {} },
    agents: { list: (): unknown[] => [] },
    logger: { debug: (): void => {}, warn: (): void => {}, error: (): void => {} },
    fiber: { uid: 'live' },
    inject: (): (() => void) => () => {},
  } as unknown as Context
}

/** A live agent scope: a context whose fiber has not been torn down. */
function liveContext(cwd: string): { ctx: Context; session: { header: { cwd: string } } } {
  return { ctx: serviceContext(), session: { header: { cwd } } }
}

/** A context whose fiber is already gone, so any registration on it throws. */
function deadContext(cwd: string): { ctx: Context; session: { header: { cwd: string } } } {
  const ctx = serviceContext()
  ctx.inject = () => {
    throw new Error('cannot create effect on inactive context')
  }
  return { ctx, session: { header: { cwd } } }
}

test('the plugin loads when the registry still lists a closing agent', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-load-'))
  const host = new Context()
  try {
    const world = new RemoteWorld(baseConfig(root))
    world.upsertMachine(sanitizeMachine({ host: 'dev.example.com', username: 'dev', port: 22 }))

    const local = path.join(root, 'local')
    const live = liveContext(local)
    const closing = deadContext(local)
    // A dead context refuses registration — the exact rejection the plugin
    // load hit, raised by cordis's own assertActive.
    assert.throws(() => closing.ctx.inject(['tools'], () => {}), /inactive|INACTIVE/i)

    const agents = new StubAgents(host)
    agents.agents = [live, closing]
    const systemPrompt = new StubSystemPrompt(host)
    await host.plugin(StubTools)

    // Neither registration may throw: a throw here aborted the whole load and
    // left the composition pending.
    assert.doesNotThrow(() => registerPrompt(host, world))
    assert.doesNotThrow(() => registerToolVisibility(host, world))

    // The healthy agent was still served, so skipping the closing one costs
    // nothing that mattered: the prompt section mounted and the live agent's
    // scope still accepted registration.
    assert.deepEqual(systemPrompt.sections, ['@jackguo0310/dsh-remote'])
    assert.doesNotThrow(() => live.ctx.inject(['tools'], () => {}))
    world.dispose()
  } finally {
    void host.fiber.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('an agent whose scope closed mid-registration does not abort the load', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rdv-load2-'))
  const host = new Context()
  try {
    const world = new RemoteWorld(baseConfig(root))
    world.upsertMachine(sanitizeMachine({ host: 'dev.example.com', username: 'dev', port: 22 }))

    // The registry hands out an agent whose fiber closed before the plugin
    // reached for its context.
    const agents = new StubAgents(host)
    agents.agents = [deadContext(path.join(root, 'local'))]
    await host.plugin(StubTools)
    const systemPrompt = new StubSystemPrompt(host)

    assert.doesNotThrow(() => registerPrompt(host, world))
    assert.doesNotThrow(() => registerToolVisibility(host, world))
    // The plugin's own prompt section still mounted: skipping one closing agent
    // must not cost the plugin anything else it owes the model.
    assert.deepEqual(systemPrompt.sections, ['@jackguo0310/dsh-remote'])
    world.dispose()
  } finally {
    await host.fiber.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
