/**
 * The sidebar's remote Git tab, laid out like the sidebar's own Git lens: a
 * repository strip, one collapsible 更改 section whose commit box sits on top
 * of the staged/unstaged groups, one collapsible 提交图 section with the branch
 * selector and the lane graph, and a footer carrying the branch and the
 * tracking counts. Everything is answered by the plugin's routes, executed on
 * the remote machine over SSH.
 * @module dsh-remote-development/client/remote-git
 */

import { createElement, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  IconBranchOutlineRegular,
  IconCheckOutlineRegular,
  IconChevronRightOutlineRegular,
  IconRefreshOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { RemoteGitCommit, RemoteGitEntry, RemoteGitStatus } from './api.ts'
import type { SessionRemoteAnswer } from './session-scope.ts'
import { useRemoteSession } from './session-scope.ts'
import { ROW_HEIGHT, edgePath, graphWidth, laneX, layoutGraph } from './graph-layout.ts'

/** Host calls the tab needs, bound once by the plugin. */
export interface RemoteGitInjected {
  sessionRemote: (sessionId: string) => Promise<SessionRemoteAnswer>
  gitStatus: (machineId: string, path: string) => Promise<{ ok: boolean; status?: RemoteGitStatus; error?: string }>
  gitDiff: (machineId: string, path: string, file: string, staged: boolean, untracked: boolean) => Promise<{ ok: boolean; diff?: string; error?: string }>
  gitStage: (machineId: string, path: string, files: string[]) => Promise<{ ok: boolean; error?: string }>
  gitUnstage: (machineId: string, path: string, files: string[]) => Promise<{ ok: boolean; error?: string }>
  gitCommit: (machineId: string, path: string, message: string) => Promise<{ ok: boolean; output?: string; error?: string }>
  gitLog: (machineId: string, path: string, limit?: number, all?: boolean) => Promise<{ ok: boolean; commits?: RemoteGitCommit[]; isRepo?: boolean; error?: string }>
  gitShow: (machineId: string, path: string, commit: string) => Promise<{ ok: boolean; diff?: string; error?: string }>
  /** The sidebar's own file artwork, so rows match the files tab. */
  fileIcon?: (path: string, size: number) => unknown
  folderIcon?: (path: string, open: boolean, size: number) => unknown
  t: Translate
}

/** Props the sidebar's tab descriptor hands every tab component. */
export interface RemoteGitProps {
  sessionId: string
  /** Whether the tab is focused and its panel open. */
  visible?: boolean
}

/** The diff currently shown in the bottom pane. */
interface OpenDiff {
  /** Repo-relative path, or a commit hash for a commit patch. */
  path: string
  text: string
  loading: boolean
  error: string
}

/** One graph row as it is drawn, with its commit. */
interface GraphLine {
  commit: RemoteGitCommit
  lane: number
}

/** Relative time for a row's tooltip. */
function ago(time: number, t: Translate): string {
  if (time <= 0) return ''
  const seconds = Math.max(1, Math.floor(Date.now() / 1000 - time))
  if (seconds < 60) return t('git.justNow')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t('git.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('git.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t('git.daysAgo', { n: days })
  return new Date(time * 1000).toLocaleDateString()
}

/** Last path segment of a remote path. */
function baseName(p: string): string {
  const trimmed = p.replace(/\/+$/, '')
  const cut = trimmed.lastIndexOf('/')
  return cut === -1 ? trimmed : trimmed.slice(cut + 1)
}

/** A change row's staged side (index) and unstaged side (worktree). */
function isStagedEntry(entry: RemoteGitEntry): boolean {
  return entry.xy !== '??' && entry.xy[0] !== ' ' && entry.xy[0] !== '?'
}

/** Whether the worktree side still holds a change (an untracked file always does). */
function isUnstagedEntry(entry: RemoteGitEntry): boolean {
  return entry.xy === '??' || entry.xy[1] !== ' '
}

/**
 * The tab body: resolve the session's machine, then read and edit its
 * repository. The two sections mirror the host's own Git lens; every mutation
 * re-reads the status, and the graph re-reads after a commit.
 * @param props - session identity plus the injected host calls.
 * @returns the tab element.
 */
export function RemoteGit(props: RemoteGitProps & { injected: RemoteGitInjected }): ReactElement {
  const { sessionId, injected } = props
  const { t } = injected
  const session = useRemoteSession(sessionId, injected.sessionRemote, props.visible)
  const machineId = session.machineId
  const remotePath = session.remotePath

  // ── status ────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<RemoteGitStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  // ── sections, groups, message ─────────────────────────────────────────────
  const [changesOpen, setChangesOpen] = useState(true)
  const [graphOpen, setGraphOpen] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  /** The graph's scope: every branch (the host panel's default) or this one. */
  const [allBranches, setAllBranches] = useState(true)

  // ── commit graph ──────────────────────────────────────────────────────────
  const [commits, setCommits] = useState<RemoteGitCommit[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  // ── bottom diff pane ──────────────────────────────────────────────────────
  const [open, setOpen] = useState<OpenDiff | null>(null)

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

  const loadGraph = useCallback((): void => {
    if (machineId === '' || remotePath === '') return
    setHistoryLoading(true)
    setHistoryError('')
    void injected.gitLog(machineId, remotePath, 200, allBranches).then((result) => {
      setHistoryLoading(false)
      if (!result.ok) {
        setHistoryError(result.error ?? t('git.failed'))
        return
      }
      setCommits(result.commits ?? [])
    }).catch((err: Error) => {
      setHistoryLoading(false)
      setHistoryError(err.message)
    })
  }, [injected, machineId, remotePath, allBranches, t])

  useEffect(() => { load() }, [load])
  // The graph loads when the section is open (or the scope changes), exactly
  // like the host panel's "unfold, change branch, refresh" triggers.
  useEffect(() => {
    if (graphOpen) loadGraph()
  }, [graphOpen, loadGraph])

  /** Run one mutation, then re-read what it changed. */
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

  const staged = (status?.entries ?? []).filter(isStagedEntry)
  const unstaged = (status?.entries ?? []).filter((entry) => !isStagedEntry(entry) && isUnstagedEntry(entry))
  const clean = status !== null && status.isRepo === true && (status.entries ?? []).length === 0

  /**
   * Show one file's diff on the side that changes it: the worktree when the
   * worktree differs (an untracked file diffs against /dev/null), otherwise
   * the staged side.
   */
  const showDiff = (entry: RemoteGitEntry, stagedSide: boolean): void => {
    const untracked = entry.xy === '??'
    setOpen({ path: entry.path, text: '', loading: true, error: '' })
    void injected.gitDiff(machineId, remotePath, entry.path, stagedSide, untracked).then((result) => {
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

  /** Show one commit's patch in the pane. */
  const showCommit = (commit: RemoteGitCommit): void => {
    setOpen({ path: commit.short, text: '', loading: true, error: '' })
    void injected.gitShow(machineId, remotePath, commit.hash).then((result) => {
      setOpen({
        path: commit.short,
        text: result.diff ?? '',
        loading: false,
        error: result.ok ? '' : (result.error ?? t('git.failed')),
      })
    }).catch((err: Error) => {
      setOpen({ path: commit.short, text: '', loading: false, error: err.message })
    })
  }

  const commit = (): void => {
    if (message.trim() === '' || staged.length === 0) return
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
      if (graphOpen) loadGraph()
    }).catch((err: Error) => {
      setBusy(false)
      setError(err.message)
    })
  }

  // ── graph geometry ────────────────────────────────────────────────────────
  const rows = useMemo(() => layoutGraph(commits), [commits])
  const width = useMemo(() => graphWidth(rows), [rows])
  const lines = useMemo<GraphLine[]>(
    () => rows.map((row, index) => ({ commit: commits[index]!, lane: row.lane })),
    [rows, commits],
  )

  const toggleGroup = (group: string): void => {
    setCollapsedGroups((current) => ({ ...current, [group]: current[group] !== true }))
  }

  /** One disclosure section header (chevron + label + trailing actions). */
  const sectionHead = (label: string, openState: boolean, toggle: () => void, trailing: ReactElement[]): ReactElement =>
    createElement('div', { className: 'rdv-gitHead' },
      createElement('button', { type: 'button', className: 'rdv-gitDisclosure', 'aria-expanded': openState, onClick: toggle },
        createElement('span', { className: 'rdv-gitChevron', 'data-open': openState ? 'true' : undefined, 'aria-hidden': true },
          createElement(IconChevronRightOutlineRegular, { size: 12 })),
        createElement('span', null, label)),
      createElement('div', { className: 'rdv-gitHeadActions' }, trailing))

  /** One change row: staged side, path, hover action. */
  const changeRow = (entry: RemoteGitEntry, stagedSide: boolean): ReactElement => createElement('div', {
    key: `${stagedSide ? 's' : 'u'}:${entry.path}`,
    className: 'rdv-gitChangeRow',
    title: entry.path,
  },
    createElement('span', { className: 'rdv-gitChangeIcon', 'aria-hidden': true },
      (() => {
        try {
          const custom = injected.fileIcon?.(entry.path, 14)
          return custom !== undefined && custom !== null ? custom as ReactElement : createElement('span', null, '·')
        } catch {
          return createElement('span', null, '·')
        }
      })()),
    createElement('span', { className: 'rdv-gitChangeName' }, baseName(entry.path)),
    createElement('span', { className: 'rdv-gitChangePath' }, entry.path.slice(0, -baseName(entry.path).length).replace(/\/+$/, '') || '/'),
    createElement('span', { className: 'rdv-gitChangeCode', title: entry.xy }, entry.xy.trim() === '' ? '·' : entry.xy.trim()),
    createElement('button', {
      type: 'button',
      className: 'rdv-gitChangeAction',
      title: stagedSide ? t('git.unstage') : t('git.stage'),
      disabled: busy,
      onClick: () => mutate(
        () => (stagedSide ? injected.gitUnstage(machineId, remotePath, [entry.path]) : injected.gitStage(machineId, remotePath, [entry.path])),
        stagedSide ? t('git.unstaged') : t('git.staged'),
      ),
    }, stagedSide ? '−' : '+'),
  )

  /** One collapsible group of change rows. */
  const changeGroup = (group: string, label: string, entries: RemoteGitEntry[], stagedSide: boolean): ReactElement | null => {
    if (entries.length === 0) return null
    const folded = collapsedGroups[group] === true
    return createElement('div', { className: 'rdv-gitGroup' },
      createElement('div', { className: 'rdv-gitGroupHead' },
        createElement('button', { type: 'button', className: 'rdv-gitDisclosure', 'aria-expanded': !folded, onClick: () => toggleGroup(group) },
          createElement('span', { className: 'rdv-gitChevron', 'data-open': folded ? undefined : 'true', 'aria-hidden': true },
            createElement(IconChevronRightOutlineRegular, { size: 12 })),
          createElement('span', null, `${label} ${entries.length}`)),
        createElement('button', {
          type: 'button',
          className: 'rdv-gitGroupAction',
          title: stagedSide ? t('git.unstageAll') : t('git.stageAll'),
          disabled: busy,
          onClick: () => mutate(
            () => (stagedSide
              ? injected.gitUnstage(machineId, remotePath, entries.map((entry) => entry.path))
              : injected.gitStage(machineId, remotePath, entries.map((entry) => entry.path))),
            stagedSide ? t('git.unstaged') : t('git.staged'),
          ),
        }, stagedSide ? '−' : '+')),
      !folded && createElement('div', { className: 'rdv-gitGroupBody' },
        entries.map((entry) => createElement(FragmentlessRow, { key: entry.path, run: () => showDiff(entry, stagedSide), row: changeRow(entry, stagedSide) }))),
    )
  }

  // Small wrapper: a row is a div with its own action button, so the clickable
  // area is the row itself and the action button stops propagation.
  function FragmentlessRow(props: { row: ReactElement; run: () => void }): ReactElement {
    return createElement('div', { onClick: props.run, style: { display: 'contents' } }, props.row)
  }

  if (!session.resolved) {
    return createElement('div', { className: 'rdv-gitRoot' },
      createElement('div', { className: 'rdv-empty' }, t('git.loading')))
  }
  if (machineId === '' || remotePath === '') {
    return createElement('div', { className: 'rdv-gitRoot' },
      createElement('div', { className: 'rdv-empty' },
        createElement('div', null, t('git.notRemote')),
        createElement('div', { className: 'rdv-hint' }, t('git.notRemoteHint'))))
  }
  if (status !== null && !status.isRepo) {
    return createElement('div', { className: 'rdv-gitRoot' },
      createElement('div', { className: 'rdv-empty' }, t('git.notRepo')))
  }

  const branch = status?.branch ?? ''
  const markers = `${unstaged.length > 0 ? '*' : ''}${staged.length > 0 ? '+' : ''}`
  const tracking = ((): string => {
    if (status === null || status.isRepo !== true) return ''
    const parts: string[] = []
    if (status.behind !== undefined && status.behind > 0) parts.push(`${status.behind}↓`)
    if (status.ahead !== undefined && status.ahead > 0) parts.push(`${status.ahead}↑`)
    return parts.join(' ')
  })()

  return createElement('div', { className: 'rdv-gitRoot' },
    // Repository strip: one entry, because a session has one workspace.
    createElement('div', { className: 'rdv-gitRepoBar' },
      createElement('span', { className: 'rdv-gitRepoTab', title: status?.root ?? remotePath },
        `${session.machineName || machineId} · ${baseName(status?.root ?? remotePath)}`)),
    createElement('div', { className: 'rdv-gitScroll' },
      error !== '' && createElement('div', { className: 'rdv-filesError' }, error),
      notice !== '' && createElement('div', { className: 'rdv-ok rdv-gitNotice' }, notice),

      // ── changes ──────────────────────────────────────────────────────────
      createElement('section', { className: 'rdv-gitSection' },
        sectionHead(t('git.viewChanges'), changesOpen, () => setChangesOpen((open) => !open), [
          createElement('button', {
            key: 'commit',
            type: 'button',
            className: 'rdv-gitIconAction',
            title: t('git.commit'),
            'aria-label': t('git.commit'),
            disabled: busy || message.trim() === '' || staged.length === 0,
            onClick: commit,
          }, createElement(IconCheckOutlineRegular, { size: 14 })),
          createElement('button', {
            key: 'refresh',
            type: 'button',
            className: 'rdv-gitIconAction',
            title: t('git.refresh'),
            'aria-label': t('git.refresh'),
            disabled: loading || busy,
            onClick: load,
          }, createElement(IconRefreshOutlineRegular, { size: 14 })),
        ]),
        changesOpen && createElement('div', { className: 'rdv-gitSectionBody' },
          // The commit box sits on top, like the host lens.
          createElement('div', { className: 'rdv-gitMessageBox' },
            createElement('textarea', {
              className: 'rdv-gitMessageInput',
              rows: 1,
              value: message,
              placeholder: t('git.commitPlaceholderOn', { branch: branch || 'HEAD', shortcut: 'Ctrl+Enter' }),
              'aria-label': t('git.commitPlaceholder'),
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value),
              onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); commit() }
              },
            })),
          clean && createElement('div', { className: 'rdv-empty rdv-gitClean' }, t('git.clean')),
          changeGroup('staged', t('git.stagedSection'), staged, true),
          changeGroup('unstaged', t('git.changesSection'), unstaged, false),
        )),

      // ── graph ────────────────────────────────────────────────────────────
      createElement('section', { className: graphOpen ? 'rdv-gitSection rdv-gitSectionGrow' : 'rdv-gitSection' },
        sectionHead(t('git.graph'), graphOpen, () => setGraphOpen((open) => !open), []),
        graphOpen && createElement('div', { className: 'rdv-gitGraphBody' },
          createElement('div', { className: 'rdv-gitGraphToolbar' },
            createElement('select', {
              className: 'rdv-gitSelect',
              'aria-label': t('git.graphScope'),
              value: allBranches ? 'all' : 'current',
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setAllBranches(e.target.value === 'all'),
            },
              createElement('option', { value: 'all' }, t('git.allBranches')),
              createElement('option', { value: 'current' }, t('git.currentBranch')),
            )),
          historyError !== '' && createElement('div', { className: 'rdv-filesError' }, historyError),
          historyLoading && commits.length === 0
            ? createElement('div', { className: 'rdv-empty' }, t('git.loading'))
            : commits.length === 0
              ? createElement('div', { className: 'rdv-empty' }, t('git.noCommits'))
              : createElement('div', { className: 'rdv-gitGraphList', style: { flex: 1 } },
                  lines.map((line, index) => {
                    const row = rows[index]!
                    return createElement('button', {
                      key: line.commit.hash,
                      type: 'button',
                      className: 'rdv-gitGraphRow' + (open?.path === line.commit.short ? ' rdv-gitGraphRowOpen' : ''),
                      title: `${line.commit.author} · ${ago(line.commit.time, t)} · ${line.commit.hash}`,
                      onClick: () => showCommit(line.commit),
                    },
                      createElement('svg', {
                        className: 'rdv-gitRail',
                        width,
                        height: ROW_HEIGHT,
                        viewBox: `0 0 ${width} ${ROW_HEIGHT}`,
                        'aria-hidden': true,
                      },
                        row.through.map((lane) => createElement('line', {
                          key: `t${lane}`,
                          x1: laneX(lane), x2: laneX(lane), y1: 0, y2: ROW_HEIGHT,
                          className: `rdv-gitLane c${lane % 5}`,
                        })),
                        row.edges.map((edge, edgeIndex) => createElement('path', {
                          key: `e${edgeIndex}`,
                          d: edgePath(edge),
                          className: `rdv-gitLane c${edge.color % 5}`,
                        })),
                        createElement('circle', {
                          cx: laneX(row.lane), cy: ROW_HEIGHT / 2, r: 3.2,
                          className: `rdv-gitNode c${row.lane % 5}`,
                        }),
                      ),
                      createElement('span', { className: 'rdv-gitPills' },
                        line.commit.refs.slice(0, 3).map((ref) => createElement('span', {
                          key: ref,
                          className: 'rdv-gitPill' + (ref.startsWith('tag: ') ? ' rdv-gitPillTag' : ref.startsWith('HEAD') ? ' rdv-gitPillHead' : ''),
                          title: ref,
                        }, ref.startsWith('tag: ') ? ref.slice(5) : ref.replace('HEAD -> ', '')))),
                      createElement('span', { className: 'rdv-gitSubject' }, line.commit.subject),
                      createElement('span', { className: 'rdv-gitSha' }, line.commit.short),
                    )
                  })),
        )),

      // ── bottom pane (file diff or commit patch) ──────────────────────────
      open !== null && createElement('div', { className: 'rdv-gitDiffPane' },
        createElement('div', { className: 'rdv-gitDiffHead' },
          createElement('span', { className: 'rdv-gitDiffPath', title: open.path }, open.path),
          createElement('button', { type: 'button', className: 'rdv-gitIconAction', title: t('git.closeDiff'), onClick: () => setOpen(null) }, '×'),
        ),
        open.loading
          ? createElement('div', { className: 'rdv-empty' }, t('git.loading'))
          : createElement('pre', { className: 'rdv-gitDiff' }, open.error !== '' ? open.error : (open.text !== '' ? open.text : t('git.diffEmpty'))),
      ),
    ),

    // ── footer: branch + tracking, like the host lens ──────────────────────
    status !== null && status.isRepo === true && createElement('div', { className: 'rdv-gitFooter' },
      createElement('span', { className: 'rdv-gitBranchChip', title: t('git.branch') },
        createElement(IconBranchOutlineRegular, { size: 14 }),
        createElement('span', null, `${branch || 'HEAD'}${markers}`)),
      tracking !== '' && createElement('span', { className: 'rdv-gitSync' }, tracking),
      createElement('span', { className: 'rdv-spacer' }),
      createElement('span', { className: 'rdv-filesMachine', title: machineId }, session.machineName || machineId),
    ),
  )
}
