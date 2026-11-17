/**
 * The sidebar's remote-file tab. It browses the SESSION's remote workspace over
 * the plugin's own SSH/SFTP routes — the third-party sidebar's built-in files
 * tab reads the host filesystem, which is not where a remote session's files
 * live. Upload and download go through the same routes, so the browser that
 * shows the tab is the machine the bytes move to or from.
 *
 * The tab receives no sidebar internals beyond the session id: everything it
 * renders comes from this plugin's host routes.
 * @module dsh-remote-development/client/remote-files
 */

import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { RemoteFileEntry } from './api.ts'

/** Host calls the tab needs, bound once by the plugin (keeps props referentially stable). */
export interface RemoteFilesInjected {
  sessionRemote: (sessionId: string) => Promise<{ remote: boolean; remotePath?: string; machineId?: string; machineName?: string }>
  listRemoteFiles: (machineId: string, path: string) => Promise<{ ok: boolean; path: string; parent: string | null; entries: RemoteFileEntry[]; error?: string }>
  uploadRemoteFile: (machineId: string, dir: string, file: File) => Promise<{ ok: boolean; path?: string }>
  remoteDownloadUrl: (machineId: string, path: string) => string
  t: Translate
}

/** Props the sidebar's tab descriptor hands every tab component. */
export interface RemoteFilesProps {
  /** The tab's session — the workspace whose machine and root decide the listing. */
  sessionId: string
  /** Whether the tab is focused and its panel open. */
  visible?: boolean
}

const FOLDER_ICON = createElement('span', { className: 'rdv-filesIcon', 'aria-hidden': true },
  createElement('svg', { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none' },
    createElement('path', {
      d: 'M1.75 3.5h4l1.2 1.5h7.3v7.5a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1V3.5Z',
      stroke: 'currentColor',
      strokeWidth: 1.2,
      strokeLinejoin: 'round',
    })))

const FILE_ICON = createElement('span', { className: 'rdv-filesIcon', 'aria-hidden': true },
  createElement('svg', { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none' },
    createElement('path', {
      d: 'M4 1.75h5L12.25 5v9.25H4V1.75Z',
      stroke: 'currentColor',
      strokeWidth: 1.2,
      strokeLinejoin: 'round',
    })))

/** Human byte size; the list is dense, so one short token per file. */
function sizeText(bytes: number | undefined): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} K`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} M`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} G`
}

/**
 * The tab body: resolve the session's remote root, then browse it.
 * @param props - session identity plus the injected host calls.
 * @returns the tab element.
 */
export function RemoteFiles(props: RemoteFilesProps & { injected: RemoteFilesInjected }): ReactElement {
  const { sessionId, injected } = props
  const { t } = injected
  const [machineId, setMachineId] = useState('')
  const [machineName, setMachineName] = useState('')
  const [path, setPath] = useState('')
  const [parent, setParent] = useState<string | null>(null)
  const [entries, setEntries] = useState<RemoteFileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(0)
  /** Distinguishes "still resolving the session" from "resolved, not remote". */
  const [resolved, setResolved] = useState(false)
  // Monotonic token: a slow listing must not overwrite a newer directory.
  const token = useRef(0)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const load = useCallback((machine: string, dir: string): void => {
    if (machine === '') return
    const mine = ++token.current
    setLoading(true)
    setError('')
    void injected.listRemoteFiles(machine, dir).then((level) => {
      if (mine !== token.current) return
      setLoading(false)
      if (!level.ok) {
        setError(level.error ?? t('files.loadFailed'))
        return
      }
      setPath(level.path)
      setParent(level.parent)
      setEntries(level.entries)
    }).catch((err: Error) => {
      if (mine !== token.current) return
      setLoading(false)
      setError(err.message)
    })
  }, [injected, t])

  useEffect(() => {
    let cancelled = false
    token.current += 1
    setResolved(false)
    setError('')
    setEntries([])
    setPath('')
    setParent(null)
    void injected.sessionRemote(sessionId).then((info) => {
      if (cancelled) return
      setResolved(true)
      if (!info.remote || !info.machineId) {
        setMachineId('')
        return
      }
      setMachineId(info.machineId)
      setMachineName(info.machineName ?? '')
      load(info.machineId, info.remotePath ?? '~')
    }).catch((err: Error) => {
      if (cancelled) return
      setResolved(true)
      setError(err.message)
    })
    return () => { cancelled = true }
  }, [sessionId, injected, load])

  const upload = useCallback((files: FileList | null): void => {
    if (files === null || files.length === 0 || machineId === '' || path === '') return
    const list = Array.from(files)
    setUploading(list.length)
    setError('')
    void (async (): Promise<void> => {
      for (const file of list) {
        try {
          await injected.uploadRemoteFile(machineId, path, file)
        } catch (err) {
          setError(`${file.name}: ${(err as Error).message}`)
        }
        setUploading((n) => Math.max(0, n - 1))
      }
      load(machineId, path)
    })()
  }, [injected, machineId, path, load])

  if (!resolved) {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' }, t('files.loading')))
  }
  if (machineId === '') {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' },
        createElement('div', null, t('files.notRemote')),
        createElement('div', { className: 'rdv-hint' }, t('files.notRemoteHint'))))
  }

  const canGoUp = parent !== null && path !== ''
  const row = (entry: RemoteFileEntry): ReactElement => {
    if (entry.dir) {
      return createElement('button', {
        key: entry.path,
        type: 'button',
        className: 'rdv-filesRow',
        title: entry.path,
        onClick: () => load(machineId, entry.path),
      },
        FOLDER_ICON,
        createElement('span', { className: 'rdv-filesName' }, entry.name),
        createElement('span', { className: 'rdv-filesGlyph', 'aria-hidden': true }, '›'))
    }
    // A plain anchor over the download route: the browser owns save-location,
    // progress, and cancellation, and a large file never passes through JS.
    return createElement('a', {
      key: entry.path,
      className: 'rdv-filesRow',
      href: injected.remoteDownloadUrl(machineId, entry.path),
      download: entry.name,
      title: t('files.downloadHint').replace('{path}', entry.path),
    },
      FILE_ICON,
      createElement('span', { className: 'rdv-filesName' }, entry.name),
      createElement('span', { className: 'rdv-filesSize' }, sizeText(entry.size)))
  }

  return createElement('div', { className: 'rdv-files' },
    createElement('div', { className: 'rdv-filesHead' },
      createElement('div', { className: 'rdv-filesPath', title: path }, path || '…'),
      createElement('div', { className: 'rdv-filesTools' },
        createElement(Button, {
          size: 'sm',
          disabled: !canGoUp || loading,
          onClick: () => { if (parent !== null) load(machineId, parent) },
        }, t('files.up')),
        createElement(Button, {
          size: 'sm',
          disabled: loading || uploading > 0,
          onClick: () => load(machineId, path),
        }, t('files.refresh')),
        createElement(Button, {
          size: 'sm',
          variant: 'outline',
          disabled: uploading > 0 || loading,
          onClick: () => fileInput.current?.click(),
        }, uploading > 0 ? t('files.uploading').replace('{count}', String(uploading)) : t('files.upload')))),
    createElement('input', {
      ref: fileInput,
      type: 'file',
      multiple: true,
      style: { display: 'none' },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        upload(e.target.files)
        // Re-selecting the same file must fire onChange again.
        e.target.value = ''
      },
    }),
    error !== '' && createElement('div', { className: 'rdv-filesError' }, error),
    createElement('div', { className: 'rdv-filesList' },
      loading && entries.length === 0
        ? createElement('div', { className: 'rdv-empty' }, t('files.loading'))
        : entries.length === 0
          ? createElement('div', { className: 'rdv-empty' }, t('files.empty'))
          : entries.map(row)),
    createElement('div', { className: 'rdv-filesFoot' },
      createElement('span', { className: 'rdv-filesMachine', title: machineId }, machineName || machineId)))
}
