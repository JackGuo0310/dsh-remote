/**
 * The sidebar's remote-file tab. It browses the SESSION's remote workspace over
 * the plugin's own SSH/SFTP routes — the third-party sidebar's built-in files
 * tab reads the host filesystem, which is not where a remote session's files
 * live. Clicking a file opens it in this tab (text files are editable, images
 * preview, everything else downloads); upload and download go through the same
 * routes, so the browser showing the tab is the machine the bytes move to or
 * from.
 *
 * The tab receives no sidebar internals beyond the session id: everything it
 * renders comes from this plugin's host routes.
 * @module dsh-remote-development/client/remote-files
 */

import { Fragment, createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { RemoteFileEntry } from './api.ts'
import { highlightCode, lineNumbers } from './code-highlight.ts'
import { useRemoteSession } from './session-scope.ts'

/** Host calls the tab needs, bound once by the plugin (keeps props referentially stable). */
export interface RemoteFilesInjected {
  sessionRemote: (sessionId: string) => Promise<{ remote: boolean; pending?: boolean; remotePath?: string; machineId?: string; machineName?: string }>
  listRemoteFiles: (machineId: string, path: string) => Promise<{ ok: boolean; path: string; parent: string | null; entries: RemoteFileEntry[]; error?: string }>
  readRemoteFile: (machineId: string, path: string) => Promise<{ ok: boolean; path: string; text?: string; size?: number; binary?: boolean; tooLarge?: boolean; error?: string }>
  writeRemoteFile: (machineId: string, path: string, text: string) => Promise<{ ok: boolean; path: string; size: number; error?: string }>
  uploadRemoteFile: (machineId: string, dir: string, file: File) => Promise<{ ok: boolean; path?: string }>
  remoteDownloadUrl: (machineId: string, path: string) => string
  /** Create one child directory (the picker's own route). */
  createRemoteDir: (machineId: string, path: string, name: string) => Promise<{ ok: boolean; path: string; error?: string }>
  /** Rename one entry in place; refuses to replace an existing name. */
  renameRemoteEntry: (machineId: string, path: string, name: string) => Promise<{ ok: boolean; path?: string; error?: string }>
  /** Delete one entry; a directory is removed with everything inside it. */
  deleteRemoteEntry: (machineId: string, path: string) => Promise<{ ok: boolean; error?: string }>
  /**
   * The sidebar's own file/folder artwork for a path, so this tab's rows use
   * the same icon theme (including icon-theme plugins) as the built-in tree.
   * Undefined when the service cannot answer; the row then falls back to the
   * plugin's plain glyphs.
   */
  fileIcon?: (path: string, size: number) => unknown
  folderIcon?: (path: string, open: boolean, size: number) => unknown
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

/** Extensions the viewer renders as an image instead of text. */
const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|svg|bmp|ico)$/i


/** A name the remote filesystem may accept as one path segment. */
function isUsableName(name: string): boolean {
  return name !== '' && name !== '.' && name !== '..' && !name.includes('/') && !name.includes('\\')
}

/** Human byte size; the list is dense, so one short token per file. */
function sizeText(bytes: number | undefined): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} K`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} M`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} G`
}

/**
 * The tab body: resolve the session's remote root, then browse it. A clicked
 * file replaces the listing with a viewer inside the same tab — the sidebar's
 * own editor reads the local filesystem, so a remote file cannot be handed to
 * it.
 * @param props - session identity plus the injected host calls.
 * @returns the tab element.
 */
export function RemoteFiles(props: RemoteFilesProps & { injected: RemoteFilesInjected }): ReactElement {
  const { sessionId, injected } = props
  const { t } = injected
  // Which machine serves this session, with the startup retry rule (see
  // session-scope): a restored tab must not settle before the host knows.
  const session = useRemoteSession(sessionId, injected.sessionRemote, props.visible)
  const machineId = session.machineId
  const machineName = session.machineName
  const [path, setPath] = useState('')
  const [parent, setParent] = useState<string | null>(null)
  const [entries, setEntries] = useState<RemoteFileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(0)
  const [notice, setNotice] = useState('')

  // ── row context menu + its dialogs ────────────────────────────────────────
  /** Where the menu opened, and the row it targets (null = empty space). */
  const [menu, setMenu] = useState<{ x: number; y: number; entry: RemoteFileEntry | null } | null>(null)
  const [renameTarget, setRenameTarget] = useState<RemoteFileEntry | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RemoteFileEntry | null>(null)
  const [folderDialog, setFolderDialog] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  // ── open file viewer ──────────────────────────────────────────────────────
  const [opened, setOpened] = useState<{ path: string; name: string } | null>(null)
  const [fileState, setFileState] = useState<'loading' | 'ready' | 'binary' | 'tooLarge' | 'error'>('loading')
  const [fileError, setFileError] = useState('')
  const [savedText, setSavedText] = useState('')
  const [draft, setDraft] = useState('')
  const [fileSize, setFileSize] = useState<number | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [saveNote, setSaveNote] = useState('')
  /** Text files open as a highlighted read view; editing is an explicit step. */
  const [editing, setEditing] = useState(false)

  // Monotonic tokens: a slow listing/file read must not overwrite a newer one.
  const token = useRef(0)
  const fileToken = useRef(0)
  const fileInput = useRef<HTMLInputElement | null>(null)
  /** Directory the next picked upload goes to ('' = the current listing). */
  const uploadDir = useRef('')

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

  // Resolved to a remote session: list its root. A later re-resolution (the
  // tab reopened, or the session finally loaded) reloads from the new root,
  // while in-tab navigation keeps using `load` directly.
  useEffect(() => {
    if (session.machineId === '') return
    load(session.machineId, session.remotePath !== '' ? session.remotePath : '~')
  }, [session.machineId, session.remotePath, load])

  /** Open one file in the tab's viewer. */
  const openFile = useCallback((entry: RemoteFileEntry): void => {
    const mine = ++fileToken.current
    setOpened({ path: entry.path, name: entry.name })
    setFileState('loading')
    setEditing(false)
    setFileError('')
    setSaveNote('')
    setSavedText('')
    setDraft('')
    setFileSize(entry.size)
    void injected.readRemoteFile(machineId, entry.path).then((r) => {
      if (mine !== fileToken.current) return
      if (!r.ok) {
        setFileState('error')
        setFileError(r.error ?? t('files.loadFailed'))
        return
      }
      setFileSize(r.size ?? entry.size)
      if (r.binary === true) { setFileState('binary'); return }
      if (r.tooLarge === true) { setFileState('tooLarge'); return }
      const text = r.text ?? ''
      setSavedText(text)
      setDraft(text)
      setFileState('ready')
    }).catch((err: Error) => {
      if (mine !== fileToken.current) return
      setFileState('error')
      setFileError(err.message)
    })
  }, [injected, machineId, t])

  const saveFile = useCallback((): void => {
    if (opened === null || fileState !== 'ready' || saving) return
    if (draft === savedText) return
    setSaving(true)
    setSaveNote('')
    void injected.writeRemoteFile(machineId, opened.path, draft).then((r) => {
      setSaving(false)
      setSavedText(draft)
      setFileSize(r.size)
      setSaveNote(t('files.saved'))
    }).catch((err: Error) => {
      setSaving(false)
      setSaveNote(t('files.saveFailed') + ': ' + err.message)
    })
  }, [draft, fileState, injected, machineId, opened, savedText, saving, t])

  const upload = useCallback((files: FileList | null): void => {
    // A folder row's "upload here" stages a target directory; the toolbar
    // button uploads into the listing the operator is looking at.
    const dir = uploadDir.current !== '' ? uploadDir.current : path
    uploadDir.current = ''
    if (files === null || files.length === 0 || machineId === '' || dir === '') return
    const list = Array.from(files)
    setUploading(list.length)
    setError('')
    void (async (): Promise<void> => {
      for (const file of list) {
        try {
          await injected.uploadRemoteFile(machineId, dir, file)
        } catch (err) {
          setError(`${file.name}: ${(err as Error).message}`)
        }
        setUploading((n) => Math.max(0, n - 1))
      }
      load(machineId, path)
    })()
  }, [injected, machineId, path, load])

  /** Open the row menu at the pointer, clamped into the viewport. */
  const openMenu = (e: React.MouseEvent, entry: RemoteFileEntry | null): void => {
    e.preventDefault()
    e.stopPropagation()
    setNotice('')
    setDialogError('')
    const width = 210
    const height = 240
    setMenu({
      x: Math.max(4, Math.min(e.clientX, window.innerWidth - width - 8)),
      y: Math.max(4, Math.min(e.clientY, window.innerHeight - height - 8)),
      entry,
    })
  }

  /** Copy one path (or the current directory) to the clipboard. */
  const copyPath = (entry: RemoteFileEntry | null): void => {
    const text = entry?.path ?? path
    setMenu(null)
    if (typeof navigator === 'undefined' || navigator.clipboard === undefined) return
    void navigator.clipboard.writeText(text).then(() => setNotice(t('files.pathCopied'))).catch(() => {
      // A browser that refuses the clipboard leaves the path visible in the header.
    })
  }

  const startRename = (entry: RemoteFileEntry): void => {
    setMenu(null)
    setDialogError('')
    setRenameValue(entry.name)
    setRenameTarget(entry)
  }

  const submitRename = (): void => {
    if (renameTarget === null || dialogBusy) return
    const name = renameValue.trim()
    if (!isUsableName(name)) {
      setDialogError(t('files.invalidName'))
      return
    }
    setDialogBusy(true)
    setDialogError('')
    void injected.renameRemoteEntry(machineId, renameTarget.path, name).then((r) => {
      setDialogBusy(false)
      if (!r.ok) {
        setDialogError(r.error ?? t('files.actionFailed'))
        return
      }
      setRenameTarget(null)
      setNotice(t('files.renamed'))
      load(machineId, path)
    }).catch((err: Error) => {
      setDialogBusy(false)
      setDialogError(err.message)
    })
  }

  const startDelete = (entry: RemoteFileEntry): void => {
    setMenu(null)
    setDialogError('')
    setDeleteTarget(entry)
  }

  const submitDelete = (): void => {
    if (deleteTarget === null || dialogBusy) return
    setDialogBusy(true)
    setDialogError('')
    void injected.deleteRemoteEntry(machineId, deleteTarget.path).then((r) => {
      setDialogBusy(false)
      if (!r.ok) {
        setDialogError(r.error ?? t('files.actionFailed'))
        return
      }
      setDeleteTarget(null)
      setNotice(t('files.deleted'))
      load(machineId, path)
    }).catch((err: Error) => {
      setDialogBusy(false)
      setDialogError(err.message)
    })
  }

  const submitFolder = (): void => {
    const name = folderName.trim()
    if (!isUsableName(name)) {
      setDialogError(t('files.invalidName'))
      return
    }
    setDialogBusy(true)
    setDialogError('')
    void injected.createRemoteDir(machineId, path, name).then((r) => {
      setDialogBusy(false)
      if (!r.ok) {
        setDialogError(r.error ?? t('files.actionFailed'))
        return
      }
      setFolderDialog(false)
      setNotice(t('files.created'))
      load(machineId, path)
    }).catch((err: Error) => {
      setDialogBusy(false)
      setDialogError(err.message)
    })
  }

  /** Stage an upload into one directory and open the picker. */
  const uploadHere = (dir: string): void => {
    setMenu(null)
    uploadDir.current = dir
    fileInput.current?.click()
  }

  // Highlighting is only rebuilt for the read view (never per keystroke of the
  // editor): the preview shows the current draft, so an unsaved edit is visible
  // the moment the operator switches back. These hooks sit ABOVE the early
  // returns — a hook after a conditional return changes the hook count between
  // renders (React error #310).
  const highlighted = useMemo(
    () => (opened !== null && fileState === 'ready' && !editing ? highlightCode(draft, opened.name) : ''),
    [draft, editing, fileState, opened],
  )
  const gutter = useMemo(
    () => (opened !== null && fileState === 'ready' && !editing ? lineNumbers(draft) : ''),
    [draft, editing, fileState, opened],
  )

  if (!session.resolved) {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' }, t('files.loading')))
  }
  if (machineId === '') {
    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-empty' },
        createElement('div', null, t('files.notRemote')),
        createElement('div', { className: 'rdv-hint' }, t('files.notRemoteHint'))))
  }

  const dirty = fileState === 'ready' && draft !== savedText
  const download = (target: string): void => {
    const anchor = document.createElement('a')
    anchor.href = injected.remoteDownloadUrl(machineId, target)
    anchor.download = ''
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  if (opened !== null) {
    const body = ((): ReactElement => {
      if (fileState === 'loading') return createElement('div', { className: 'rdv-empty' }, t('files.loading'))
      if (fileState === 'error') return createElement('div', { className: 'rdv-filesError' }, fileError)
      if (fileState === 'binary' || fileState === 'tooLarge') {
        return createElement('div', { className: 'rdv-empty' },
          createElement('div', null, fileState === 'binary' ? t('files.binary') : t('files.tooLarge')),
          createElement('div', { className: 'rdv-hint' }, sizeText(fileSize)))
      }
      if (IMAGE_EXTENSIONS.test(opened.name)) {
        return createElement('div', { className: 'rdv-filesImage' },
          createElement('img', {
            src: injected.remoteDownloadUrl(machineId, opened.path),
            alt: opened.name,
          }))
      }
      if (editing) {
        return createElement('textarea', {
          className: 'rdv-filesEditor',
          value: draft,
          spellCheck: false,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => { setDraft(e.target.value); setSaveNote('') },
          onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
              e.preventDefault()
              saveFile()
            }
          },
        })
      }
      // The walking view: one scrolling surface holds a sticky line-number
      // gutter and the highlighted source, so both share a line grid.
      return createElement('div', { className: 'rdv-codeWrap' },
        createElement('div', { className: 'rdv-codeGutter', 'aria-hidden': true }, gutter),
        createElement('pre', { className: 'rdv-code' },
          createElement('code', { dangerouslySetInnerHTML: { __html: highlighted } })))
    })()

    return createElement('div', { className: 'rdv-files' },
      createElement('div', { className: 'rdv-filesHead' },
        createElement('div', { className: 'rdv-filesViewerBar' },
          createElement(Button, { size: 'sm', onClick: () => setOpened(null) }, t('files.back')),
          createElement('span', { className: 'rdv-filesViewerName', title: opened.path }, opened.name),
          createElement('span', { className: 'rdv-filesSize' }, sizeText(fileSize)),
          createElement(Button, { size: 'sm', onClick: () => download(opened.path) }, t('files.download')),
          fileState === 'ready' && !IMAGE_EXTENSIONS.test(opened.name) && createElement(Button, {
            size: 'sm',
            variant: 'outline',
            onClick: () => { setEditing(!editing); setSaveNote('') },
          }, editing ? t('files.preview') : t('files.edit')),
          fileState === 'ready' && editing && createElement(Button, {
            size: 'sm',
            variant: 'primary',
            disabled: !dirty || saving,
            onClick: saveFile,
          }, saving ? t('files.saving') : t('files.save')))),
      body,
      saveNote !== '' && createElement('div', { className: 'rdv-filesNote' }, saveNote))
  }

  const canGoUp = parent !== null && path !== ''
  /**
   * The row icon: the sidebar's own artwork when the service answers, the
   * plugin's plain glyph otherwise. The lookup is per row, so an icon-theme
   * plugin installed in the sidebar restyles this tab too.
   */
  const iconFor = (entry: RemoteFileEntry): ReactElement => {
    try {
      const custom = entry.dir
        ? injected.folderIcon?.(entry.path, false, 14)
        : injected.fileIcon?.(entry.path, 14)
      if (custom !== undefined && custom !== null) {
        return createElement('span', { className: 'rdv-filesIcon' }, custom as ReactElement)
      }
    } catch {
      // A throwing icon provider must never take the listing down.
    }
    return entry.dir ? FOLDER_ICON : FILE_ICON
  }
  /** One row's context menu entry. */
  const menuItem = (label: string, onClick: () => void, options: { danger?: boolean } = {}): ReactElement =>
    createElement('button', {
      type: 'button',
      role: 'menuitem',
      className: 'rdv-ctxItem' + (options.danger === true ? ' rdv-ctxDanger' : ''),
      onClick,
    }, label)

  const row = (entry: RemoteFileEntry): ReactElement => {
    if (entry.dir) {
      return createElement('button', {
        key: entry.path,
        type: 'button',
        className: 'rdv-filesRow',
        title: entry.path,
        onClick: () => load(machineId, entry.path),
        onContextMenu: (e: React.MouseEvent) => openMenu(e, entry),
      },
        iconFor(entry),
        createElement('span', { className: 'rdv-filesName' }, entry.name),
        createElement('span', { className: 'rdv-filesGlyph', 'aria-hidden': true }, '›'))
    }
    return createElement('button', {
      key: entry.path,
      type: 'button',
      className: 'rdv-filesRow',
      title: entry.path,
      onClick: () => openFile(entry),
      onContextMenu: (e: React.MouseEvent) => openMenu(e, entry),
    },
      iconFor(entry),
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
    notice !== '' && createElement('div', { className: 'rdv-ok rdv-filesNote' }, notice),
    createElement('div', {
      className: 'rdv-filesList',
      // Right-clicking the empty area offers the directory-level actions.
      onContextMenu: (e: React.MouseEvent) => openMenu(e, null),
    },
      loading && entries.length === 0
        ? createElement('div', { className: 'rdv-empty' }, t('files.loading'))
        : entries.length === 0
          ? createElement('div', { className: 'rdv-empty' }, t('files.empty'))
          : entries.map(row)),
    createElement('div', { className: 'rdv-filesFoot' },
      createElement('span', { className: 'rdv-filesMachine', title: machineId }, machineName || machineId)),
    menu !== null && createElement(Fragment, null,
      createElement('button', {
        type: 'button',
        className: 'rdv-ctxBackdrop',
        'aria-label': t('files.cancel'),
        onClick: () => setMenu(null),
        onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); setMenu(null) },
      }),
      createElement('div', { className: 'rdv-ctxMenu', role: 'menu', style: { left: menu.x, top: menu.y } },
        menu.entry === null
          ? [
              menuItem(t('files.newFolder'), () => {
                setMenu(null)
                setFolderName('')
                setDialogError('')
                setFolderDialog(true)
              }),
              menuItem(t('files.uploadHere'), () => uploadHere(path)),
              createElement('div', { key: 'sep', className: 'rdv-ctxSep' }),
              menuItem(t('files.refresh'), () => { setMenu(null); load(machineId, path) }),
            ]
          : [
              menuItem(menu.entry.dir ? t('files.openFolder') : t('files.openFile'), () => {
                const entry = menu.entry
                setMenu(null)
                if (entry === null) return
                if (entry.dir) load(machineId, entry.path)
                else openFile(entry)
              }),
              menu.entry.dir
                ? menuItem(t('files.uploadIn'), () => { const entry = menu.entry; setMenu(null); if (entry !== null) uploadHere(entry.path) })
                : menuItem(t('files.download'), () => { const entry = menu.entry; setMenu(null); if (entry !== null) download(entry.path) }),
              menuItem(t('files.copyPath'), () => copyPath(menu.entry)),
              createElement('div', { key: 'sep', className: 'rdv-ctxSep' }),
              menuItem(t('files.rename'), () => { const entry = menu.entry; setMenu(null); if (entry !== null) startRename(entry) }),
              menuItem(t('files.delete'), () => { const entry = menu.entry; setMenu(null); if (entry !== null) startDelete(entry) }, { danger: true }),
            ])),
    renameTarget !== null && createElement(Modal, {
      open: true,
      onClose: () => { if (!dialogBusy) { setRenameTarget(null); setDialogError('') } },
      title: t('files.renameTitle'),
      closeLabel: t('files.cancel'),
      footer: createElement(Fragment, null,
        createElement(Button, { variant: 'outline', disabled: dialogBusy, onClick: () => setRenameTarget(null) }, t('files.cancel')),
        createElement(Button, { variant: 'primary', disabled: dialogBusy, onClick: submitRename }, t('files.confirm'))),
    }, createElement('div', { className: 'rdv-field' },
      createElement('span', { className: 'rdv-label' }, t('files.renameLabel')),
      createElement(Input, {
        value: renameValue,
        autoFocus: true,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value),
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') submitRename() },
      }),
      dialogError !== '' && createElement('div', { className: 'rdv-error' }, dialogError))),
    deleteTarget !== null && createElement(Modal, {
      open: true,
      onClose: () => { if (!dialogBusy) { setDeleteTarget(null); setDialogError('') } },
      title: t('files.deleteTitle'),
      closeLabel: t('files.cancel'),
      description: t('files.deleteConfirm').replace('{name}', deleteTarget.name)
        + (deleteTarget.dir ? ' ' + t('files.deleteDirWarning') : ''),
      footer: createElement(Fragment, null,
        createElement(Button, { variant: 'outline', disabled: dialogBusy, onClick: () => setDeleteTarget(null) }, t('files.cancel')),
        createElement(Button, { variant: 'outline', disabled: dialogBusy, onClick: submitDelete }, t('files.confirm'))),
    }, dialogError === '' ? null : createElement('p', { className: 'rdv-error', style: { margin: 0 } }, dialogError)),
    folderDialog && createElement(Modal, {
      open: true,
      onClose: () => { if (!dialogBusy) { setFolderDialog(false); setDialogError('') } },
      title: t('files.newFolderTitle'),
      closeLabel: t('files.cancel'),
      footer: createElement(Fragment, null,
        createElement(Button, { variant: 'outline', disabled: dialogBusy, onClick: () => setFolderDialog(false) }, t('files.cancel')),
        createElement(Button, { variant: 'primary', disabled: dialogBusy, onClick: submitFolder }, t('files.confirm'))),
    }, createElement('div', { className: 'rdv-field' },
      createElement('span', { className: 'rdv-label' }, t('files.newFolderLabel')),
      createElement(Input, {
        value: folderName,
        autoFocus: true,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFolderName(e.target.value),
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') submitFolder() },
      }),
      dialogError !== '' && createElement('div', { className: 'rdv-error' }, dialogError))))
}
