/**
 * Shared "which machine serves this tab's session" resolution for the
 * sidebar's remote tabs. A tab restored at startup can mount before the host
 * has loaded its session, and the host answers that window with
 * `pending: true`; settling on "not a remote workspace" there left the tab
 * empty until it was reopened. Every tab that asks the same question uses this
 * hook, so the retry rule exists once.
 * @module dsh-remote-development/client/session-scope
 */

import { useEffect, useRef, useState } from 'react'

/** What one `sessionRemote` call answers. */
export interface SessionRemoteAnswer {
  remote: boolean
  /** The host has not loaded this session yet — the caller must retry. */
  pending?: boolean
  remotePath?: string
  machineId?: string
  machineName?: string
}

/** Retry delays while the host has not loaded the tab's session. */
export const SESSION_RETRY_DELAYS = [200, 400, 800, 1200, 2000, 3000, 5000, 5000]

/** The resolution a remote tab renders. */
export interface RemoteSessionState {
  /** False while the first answer is still outstanding. */
  resolved: boolean
  /** The serving machine's id; '' when the workspace is local or unknown. */
  machineId: string
  machineName: string
  /** The remote workspace root; '' until resolved to a remote session. */
  remotePath: string
  /** Transport/authoritative failure worth showing. */
  error: string
}

/**
 * Resolve the machine a tab's session belongs to, retrying while the host has
 * not loaded the session, and re-asking once when the tab becomes visible or
 * the window regains focus after settling on a non-remote answer.
 * @param sessionId - the session the tab belongs to ('' before the shell knows it).
 * @param sessionRemote - the host call.
 * @param visible - the sidebar's visibility fact, when it provides one.
 * @returns the resolved scope.
 */
export function useRemoteSession(
  sessionId: string,
  sessionRemote: (sessionId: string) => Promise<SessionRemoteAnswer>,
  visible?: boolean,
): RemoteSessionState {
  const [state, setState] = useState<RemoteSessionState>({ resolved: false, machineId: '', machineName: '', remotePath: '', error: '' })
  /** Bumped to re-ask after a non-remote settle. */
  const [probeRound, setProbeRound] = useState(0)
  const shown = visible !== false
  const wasVisible = useRef(shown)

  useEffect(() => {
    // A restored tab can outrun the shell's own session handle; waiting is
    // correct, and no request can be answered before it arrives.
    if (sessionId === '') return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    setState({ resolved: false, machineId: '', machineName: '', remotePath: '', error: '' })
    /**
     * Ask once and keep asking while the host reports the session as not yet
     * loaded. Only a definitive answer settles the tab.
     * @param round - retry index, bounded by the delay table.
     */
    const attempt = (round: number): void => {
      void sessionRemote(sessionId).then((info) => {
        if (cancelled) return
        if (info.remote && info.machineId) {
          setState({ resolved: true, machineId: info.machineId, machineName: info.machineName ?? '', remotePath: info.remotePath ?? '', error: '' })
          return
        }
        if (info.pending === true && round < SESSION_RETRY_DELAYS.length) {
          timer = setTimeout(() => attempt(round + 1), SESSION_RETRY_DELAYS[round])
          return
        }
        setState({ resolved: true, machineId: '', machineName: '', remotePath: '', error: '' })
      }).catch((err: Error) => {
        if (cancelled) return
        setState({ resolved: true, machineId: '', machineName: '', remotePath: '', error: err.message })
      })
    }
    attempt(0)
    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [sessionId, sessionRemote, probeRound])

  // The tab becomes visible again: if it had settled on "not remote", the
  // session may have loaded meanwhile, so ask once more.
  useEffect(() => {
    const became = shown && !wasVisible.current
    wasVisible.current = shown
    if (!became || sessionId === '' || !state.resolved || state.machineId !== '') return
    setProbeRound((round) => round + 1)
  }, [shown, sessionId, state.resolved, state.machineId])

  // Coming back to the window works the same way: one re-ask, never a poll.
  useEffect(() => {
    if (state.machineId !== '' || !state.resolved || sessionId === '') return
    const recheck = (): void => setProbeRound((round) => round + 1)
    window.addEventListener('focus', recheck)
    return () => window.removeEventListener('focus', recheck)
  }, [state.machineId, state.resolved, sessionId])

  return state
}
