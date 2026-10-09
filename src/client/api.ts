/**
 * Browser-side API for the plugin's host routes. Plain fetch against the
 * same-origin JSON endpoints; errors surface the host's `error` string.
 * @module dsh-remote-development/client/api
 */

/** One machine as the client sees it (credentials never leave the host). */
export interface ClientMachine {
  id: string
  name: string
  host: string
  port: number
  username: string
  privateKeyPath: string
  useAgent: boolean
  keyboardInteractive: boolean
  hasPassword: boolean
  hasPassphrase: boolean
  hostKeyMode: string
  proxyHost: string
  /** The jump host's port; 22 when unset. The client form writes it back. */
  proxyPort: number
  /** The jump host's login user; '' when unset. The client form writes it back. */
  proxyUser: string
  workspace: string
  /** Folder-icon color marking this machine's workspaces ('' = theme default). */
  color: string
}

/** One remote directory row in the picker. */
export interface RemoteEntry {
  name: string
  dir: boolean
  path: string
}

const PREFIX = '/dsh-remote-development'

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: {} }
  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(PREFIX + path, opts)
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || data.ok === false) {
    throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${res.status}`)
  }
  return data as T
}

/**
 * A probe whose `ok:false` is a result, not a transport failure: the host
 * answers a failed connection with HTTP 200 and the reason in `error`, so the
 * settings page can show "why" instead of a generic request error. Only a
 * transport fault — a dead server, an aborted fetch — has no answer to return,
 * so it resolves as a failed probe carrying that fault's message.
 */
async function probe(path: string, body: unknown): Promise<ProbeResult> {
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
  let res: Response
  try {
    res = await fetch(PREFIX + path, opts)
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    return { ok: false, error: typeof data.error === 'string' ? data.error : `HTTP ${res.status}` }
  }
  return {
    ok: data.ok !== false,
    ...(typeof data.error === 'string' ? { error: data.error } : {}),
    ...(typeof data.platform === 'string' ? { platform: data.platform } : {}),
  }
}

/** List saved machines. */
export function listMachines(): Promise<{ machines: ClientMachine[] }> {
  return call('GET', '/machines')
}

/** Add or update one machine. */
export function saveMachine(machine: Record<string, unknown>): Promise<{ machine: ClientMachine }> {
  return call('POST', '/machines', machine)
}

/** Delete one machine by id. */
export function deleteMachine(id: string): Promise<{ ok: boolean }> {
  return call('POST', '/machines/delete', { id })
}

/** One probe's verdict: it succeeded, or it failed and why. */
export interface ProbeResult {
  ok: boolean
  error?: string
  platform?: string
}

/**
 * Test one machine's connection. Either a saved `machineId` or the unsaved
 * draft fields. A refusal resolves with `ok:false` and a reason, so the caller
 * reports the host's own message; only a transport fault surfaces as a throw.
 */
export function testConnection(machine: Record<string, unknown>): Promise<ProbeResult> {
  return probe('/test', machine)
}

/** List one remote directory level. */
export function listRemoteDir(machineId: string, path: string): Promise<{ ok: boolean; path: string; entries: RemoteEntry[]; error?: string }> {
  return call('POST', '/ls', { machineId, path })
}

/** Create one child directory on the remote. */
export function createRemoteDir(machineId: string, path: string, name: string): Promise<{ ok: boolean; path: string; error?: string }> {
  return call('POST', '/mkdir', { machineId, path, name })
}

/** Create (or reuse) the anchor workspace for a remote path. */
export function createAnchor(machineId: string, path: string): Promise<{ ok: boolean; anchorPath: string; remotePath: string; error?: string }> {
  return call('POST', '/anchor', { machineId, path })
}

/** Whether one session's workspace is remote (and its remote root). */
export function sessionRemote(sessionId: string): Promise<{ remote: boolean; remotePath?: string }> {
  return call('GET', `/session-remote?sessionId=${encodeURIComponent(sessionId)}`)
}

/** One remote workspace anchor with its machine join (machineId/color '' = unjoined). */
export interface AnchorStatus {
  dir: string
  remotePath: string
  machineId: string
  color: string
  /** The Workspace title the shell derives from the anchor directory (its basename). */
  defaultTitle: string
  /** Title that keeps this anchor distinguishable from another machine's same-named one. */
  title: string
}

/** List every remote workspace anchor with its machine's marker color. */
export function anchorStatus(): Promise<{ anchors: AnchorStatus[] }> {
  return call('GET', '/status')
}

/** Which interaction the host's composed directory picker serves. */
export type PickerKind = 'native' | 'browse' | 'unknown'

/** Read the composed directory-picker capability from the host. */
export function pickerCapability(): Promise<{ kind: PickerKind }> {
  return call('GET', '/picker')
}

/** The 本机 directory-picker interaction the operator selected. */
export type LocalPickerMode = 'browse' | 'native'

/** Read the saved settings-page preferences. */
export function getPreferences(): Promise<{ localPicker: LocalPickerMode }> {
  return call('GET', '/preferences')
}

/** Store the 本机 directory-picker interaction. */
export function setPreferences(localPicker: LocalPickerMode): Promise<{ ok: true; localPicker: LocalPickerMode }> {
  return call('POST', '/preferences', { localPicker })
}

/** One listed 本机 directory row. */
export interface LocalEntry {
  name: string
  path: string
  hidden: boolean
}

/** One 本机 listing level. */
export interface LocalListing {
  path: string
  home: string
  crumbs: LocalEntry[]
  entries: LocalEntry[]
  truncated: boolean
  /** Every root the dialog may switch to (Windows volumes; the single POSIX root elsewhere). */
  roots: string[]
}

/**
 * List one 本机 directory level. The plugin answers from the host filesystem
 * rather than through the host picker seam, which refuses browse verbs while
 * the mounted backend is native.
 * @param path - absolute directory; absent lists the home directory.
 * @returns the level's listing, or the refusal reason.
 */
export async function listLocalDir(path?: string): Promise<{ ok: true; listing: LocalListing } | { ok: false; error: string }> {
  if (path === undefined) return await call('GET', '/local/ls')
  return await call('POST', '/local/dir', { path })
}

/**
 * Create one child directory under an existing 本机 parent.
 * @param path - absolute existing parent directory.
 * @param name - single non-blank path segment.
 * @returns the created path, or the refusal reason.
 */
export function createLocalDir(path: string, name: string): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  return call('POST', '/local/mkdir', { path, name })
}
