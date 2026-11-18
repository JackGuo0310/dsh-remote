/**
 * The sidebar's remote Git tab. The sidebar's own Git panel spawns `git` on the
 * host machine (with a WSL special case), so it never sees a remote workspace;
 * the plugin cannot reach into it. This tab provides the same answers for a
 * remote workspace from the plugin's own routes: status, per-file diff, stage,
 * unstage, and commit, all executed on the machine over SSH.
 * @module dsh-remote-development/client/remote-git
 */

import { createElement, useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { RemoteGitEntry, RemoteGitStatus } from './api.ts'
import type { SessionRemoteAnswer } from './session-scope.ts'
import { useRemoteSession } from './session-scope.ts'

/** Host calls the tab needs, bound once by the plugin. */
export interface RemoteGitInjected {
  sessionRemote: (sessionId: string) => Promise<SessionRemoteAnswer>
  gitStatus: (machineId: string, path: string) => Promise<{ ok: boolean; status?: RemoteGitStatus; error?: string }>
  gitDiff: (machineId: string, path: string, file: string, staged: boolean, untracked: boolean) => Promise<{ ok: boolean; diff?: string; error?: string }>
  gitStage: (machineId: string, path: string, files: string[]) => Promise<{ ok: boolean; error?: string }>
  gitUnstage: (machineId: string, path: string, files: string[]) => Promise<{ ok: boolean; error?: string }>
  gitCommit: (machineId: string, path: string, message: string) => Promise<{ ok: boolean; output?: string; error?: string }>
  t: Translate
}

/** Props the sidebar's tab descriptor hands every tab component. */
export interface RemoteGitProps {
  sessionId: string
  /** Whether the tab is focused and its panel open. */
  visible?: boolean
}

/** The diff currently shown under the list. */
interface OpenDiff {
  path: string
  text: string
  loading: boolean
  error: string
}

/**
 * The tab body: resolve the session's machine, then show and edit its
 * repository state. Every action re-reads the status, so the list is never
 * stale after a stage or commit.
 * @param props - session identity plus the injected host calls.
 * @returns the tab element.
 */
export function RemoteGit(props: RemoteGitProps & { injected: RemoteGitInjected }): ReactElement {
  const { sessionId, injected } = props
  const { t } = injected
  const session = useRemoteSession(sessionId, injected.sessionRemote, props.visible)
  const [status, setStatus] = useState<RemoteGitStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<OpenDiff | null>(null)
  const [message, setMessage] = useState('')

  const machineId = session.machineId
  const remotePath = session.remotePath

  const load = useCallback((): void => {
    if (machineId === '' || remotePath === '') return
    setLoading(true)
    setError('')
    void injected.gitStatus(machineId, remotePath).then((result) => {
      setLoading(false)
      if (!result.ok || result.status === undefined) {
        setError(result.error ?? t('git.failed'))
        return
      }
      setStatus(result.status)
    }).catch((err: Error) => {
      setLoading(false)
      setError(err.message)
    })
  }, [injected, machineId, remotePath, t])

  useEffect(() => { load() }, [load])

  /** Run one mutation, then re-read the status it changed. */
  const mutate = useCallback((run: () => Promise<{ ok: boolean; error?: string }>, done: string): void => {
    setBusy(true)
    setError('')
    setNotice('')
    void run().then((result) => {
      setBusy(false)
      if (!result.ok) {
        setError(result.error ?? t('git.failed'))
        return
      }
      setNotice(done)
      load()
    }).catch((err: Error) => {
      setBusy(false)
      setError(err.message)
    })
  }, [load, t])

  const stage = (entry: RemoteGitEntry): void => mutate(
    () => injected.gitStage(machineId, remotePath, [entry.path]),
    t('git.staged'),
  )
  const unstage = (entry: RemoteGitEntry): void => mutate(
    () => injected.gitUnstage(machineId, remotePath, [entry.path]),
    t('git.unstaged'),
  )

  /**
   * Show one file's diff on the side that changes it: the worktree when the
   * worktree differs (an untracked file diffs against /dev/null), otherwise
   * the staged side.
   */
  const showDiff = (entry: RemoteGitEntry): void => {
    const unstagedSide = entry.xy[1] !== ' ' && entry.xy[1] !== undefined
    const untracked = entry.xy === '??'
    const staged = !unstagedSide && !untracked
    setOpen({ path: entry.path, text: '', loading: true, error: '' })
    void injected.gitDiff(machineId, remotePath, entry.path, staged, untracked).then((result) => {
      setOpen({
        path: entry.path,
        text: result.diff ?? '',
        loading: false,
        error: result.ok ? '' : (result.error ?? t('git.failed')),
      })
    }).catch((err: Error) => {
      setOpen({ path: entry.path, text: '', loading: false, error: err.message })
    })
  }

  const commit = (): void => {
    if (message.trim() === '') return
    setBusy(true)
    setError('')
    setNotice('')
    void injected.gitCommit(machineId, remotePath, message).then((result) => {
      setBusy(false)
      if (!result.ok) {
        setError(result.error ?? t('git.failed'))
        return
      }
      setMessage('')
      setNotice(t('git.committed'))
      setOpen(null)
      load()
    }).catch((err: Error) => {
      setBusy(false)
      setError(err.message)
    })
  }

  if (!session.resolved) {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' }, t('git.loading')))
  }
  if (machineId === '' || remotePath === '') {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' },
        createElement('div', null, t('git.notRemote')),
        createElement('div', { className: 'rdv-hint' }, t('git.notRemoteHint'))))
  }
  if (status !== null && !status.isRepo) {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' }, t('git.notRepo')))
  }

  const entries = status?.entries ?? []
  const tracking = ((): string => {
    if (status === null || status.isRepo !== true) return ''
    const parts: string[] = []
    if (status.ahead !== undefined && status.ahead > 0) parts.push(t('git.ahead', { n: status.ahead }))
    if (status.behind !== undefined && status.behind > 0) parts.push(t('git.behind', { n: status.behind }))
    return parts.join(' · ')
  })()

  return createElement('div', { className: 'rdv-files' },
    createElement('div', { className: 'rdv-gitHead' },
      createElement('span', { className: 'rdv-gitBranch', title: status?.root ?? remotePath },
        status?.branch ?? '…'),
      tracking !== '' && createElement('span', { className: 'rdv-gitTracking' }, tracking),
      createElement('span', { className: 'rdv-spacer' }),
      createElement('span', { className: 'rdv-filesMachine', title: machineId }, session.machineName || machineId),
      createElement(Button, { size: 'sm', disabled: loading || busy, onClick: load }, t('git.refresh')),
    ),
    error !== '' && createElement('div', { className: 'rdv-filesError' }, error),
    notice !== '' && createElement('div', { className: 'rdv-ok rdv-gitNotice' }, notice),
    status !== null && entries.length === 0
      ? createElement('div', { className: 'rdv-empty' }, t('git.clean'))
      : createElement('div', { className: 'rdv-list' },
          entries.map((entry) => createElement('div', { key: entry.path, className: 'rdv-gitRow' },
            createElement('span', {
              className: 'rdv-gitBadge' + (entry.xy === '??' ? ' rdv-gitBadgeNew' : ''),
              title: entry.xy === '??' ? t('git.untracked') : entry.xy,
            }, entry.xy.trim() === '' ? '·' : entry.xy.trim()),
            createElement('button', {
              type: 'button',
              className: 'rdv-itemRow rdv-gitFile',
              title: entry.path,
              onClick: () => showDiff(entry),
            }, entry.path),
            // A path can hold changes on both sides (`MM`): staging the
            // worktree side and unstaging the index side are separate actions.
            createElement('span', { className: 'rdv-gitRowActions' },
              (entry.xy[1] !== ' ' || entry.xy === '??') && createElement(Button, {
                size: 'sm',
                disabled: busy,
                onClick: () => stage(entry),
              }, t('git.stage')),
              entry.xy[0] !== ' ' && entry.xy[0] !== '?' && createElement(Button, {
                size: 'sm',
                disabled: busy,
                onClick: () => unstage(entry),
              }, t('git.unstage')),
            ),
          )),
        ),
    status !== null && status.truncated === true && createElement('div', { className: 'rdv-hint' }, t('git.truncated', { n: entries.length })),
    open !== null && createElement('div', { className: 'rdv-gitDiffPane' },
      createElement('div', { className: 'rdv-gitDiffHead' },
        createElement('span', { className: 'rdv-gitDiffPath', title: open.path }, open.path),
        createElement(Button, { size: 'sm', onClick: () => setOpen(null) }, t('git.closeDiff')),
      ),
      open.loading
        ? createElement('div', { className: 'rdv-empty' }, t('git.loading'))
        : createElement('pre', { className: 'rdv-gitDiff' }, open.error !== '' ? open.error : (open.text !== '' ? open.text : t('git.diffEmpty'))),
    ),
    createElement('div', { className: 'rdv-gitCommit' },
      createElement(Input, {
        value: message,
        placeholder: t('git.commitPlaceholder'),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value),
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
        },
      }),
      createElement(Button, {
        size: 'sm',
        variant: 'primary',
        disabled: busy || message.trim() === '',
        onClick: commit,
      }, t('git.commit')),
    ),
  )
}
