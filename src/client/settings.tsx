/**
 * The settings page: the saved-machine registry (add, edit, test, delete).
 * Pure presentation — every fact and callback arrives through the props
 * shares. Machines are standby connection records only: which machine serves
 * a workspace is decided by that workspace's anchor, so there is no
 * "current machine" to pick here.
 * @module dsh-remote-development/client/settings
 */

import { Fragment, createElement, useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: the settings section owner-share declaration.
import type { SettingsSectionOwnerProps } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ClientMachine, ForwardInfo, LocalPickerMode, ProbeResult } from './api.ts'

/** Injected face bound in the plugin's apply closure. */
export interface SettingsInjected {
  listMachines: () => Promise<{ machines: ClientMachine[] }>
  saveMachine: (machine: Record<string, unknown>) => Promise<{ machine: ClientMachine }>
  deleteMachine: (id: string) => Promise<{ ok: boolean }>
  testConnection: (machine: Record<string, unknown>) => Promise<ProbeResult>
  getPreferences: () => Promise<{ localPicker: LocalPickerMode }>
  setPreferences: (localPicker: LocalPickerMode) => Promise<{ ok: true; localPicker: LocalPickerMode }>
  /** Re-read the anchors and recolor the workspace tree's remote markers. */
  refreshTreeMark: () => Promise<void>
  /** Open on-demand port forwards, listed and closed here. */
  listForwards: () => Promise<{ forwards: ForwardInfo[]; lastError: string }>
  openForward: (input: { machineId: string; remotePort: number; remoteHost?: string; localPort?: number }) => Promise<{ ok: boolean; forward: ForwardInfo }>
  closeForward: (id: string) => Promise<{ ok: boolean }>
  t: Translate
}

/** Draft machine being added or edited. */
interface Draft {
  id: string
  name: string
  host: string
  port: string
  username: string
  auth: 'password' | 'key' | 'agent'
  password: string
  /** Whether the machine being edited has a stored password (the wire never echoes one). */
  hasPassword: boolean
  privateKeyPath: string
  proxyHost: string
  proxyPort: string
  proxyUser: string
  keyboardInteractive: boolean
  color: string
}

const EMPTY_DRAFT: Draft = {
  id: '',
  name: '',
  host: '',
  port: '22',
  username: 'root',
  auth: 'password',
  password: '',
  hasPassword: false,
  privateKeyPath: '',
  proxyHost: '',
  proxyPort: '22',
  proxyUser: '',
  keyboardInteractive: false,
  color: '',
}

/** The `probing` sentinel for a probe of the open form rather than a saved machine. */
const DRAFT_PROBE = 'draft'

function field(label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string): ReactElement {
  return createElement('label', { className: 'rdv-field' },
    createElement('span', { className: 'rdv-label' }, label),
    createElement(Input, {
      value,
      type: type ?? 'text',
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      autoComplete: 'off',
      spellCheck: false,
    }))
}

/** Preset marker colors offered in the palette (readable as icon colors on light and dark themes). */
const COLOR_PRESETS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

/**
 * The 远程开发 settings section.
 * @param props - owner conversation plus the injected machine API.
 * @returns the section element.
 */
export function MachinesSection(props: SettingsSectionOwnerProps & SettingsInjected): ReactElement {
  const { t } = props
  const [machines, setMachines] = useState<ClientMachine[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ClientMachine | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Which probe is in flight, if any: a saved machine's id, or DRAFT_PROBE for
  // the open form. One slot at a time is deliberate — a second concurrent probe
  // would race its verdict into the wrong target, and the buttons disable
  // while one runs. `null` is idle, which a machine id can never be.
  const [probing, setProbing] = useState<string | null>(null)
  const [draftResult, setDraftResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [machineResults, setMachineResults] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [localPicker, setLocalPicker] = useState<LocalPickerMode>('browse')
  const [pickerBusy, setPickerBusy] = useState(false)
  // On-demand forwards: live records plus the small add form.
  const [forwards, setForwards] = useState<ForwardInfo[]>([])
  const [forwardMachine, setForwardMachine] = useState('')
  const [forwardPort, setForwardPort] = useState('')
  const [forwardHost, setForwardHost] = useState('')
  const [forwardBusy, setForwardBusy] = useState(false)
  const [forwardError, setForwardError] = useState('')

  const refreshForwards = useCallback((): void => {
    void props.listForwards().then((r) => {
      setForwards(r.forwards)
      setForwardError(r.lastError)
    }).catch((err: Error) => setForwardError(err.message))
  }, [props])

  useEffect(() => { refreshForwards() }, [refreshForwards])

  /**
   * Open one forward from the form, defaulting the machine to the first saved
   * one: a single-machine setup never has to pick twice.
   */
  const openForward = (): void => {
    const machineId = forwardMachine || machines[0]?.id || ''
    const remotePort = Number(forwardPort)
    if (machineId === '') { setForwardError(t('forwards.machine')); return }
    if (!Number.isInteger(remotePort) || remotePort < 1 || remotePort > 65535) {
      setForwardError(t('forwards.remotePort'))
      return
    }
    setForwardBusy(true)
    setForwardError('')
    void props.openForward({
      machineId,
      remotePort,
      ...(forwardHost.trim() === '' ? {} : { remoteHost: forwardHost.trim() }),
    }).then(() => {
      setForwardBusy(false)
      setForwardPort('')
      setNotice(t('forwards.opened'))
      refreshForwards()
    }).catch((err: Error) => {
      setForwardBusy(false)
      setForwardError(err.message)
    })
  }

  const closeForward = (id: string): void => {
    setForwardBusy(true)
    setForwardError('')
    void props.closeForward(id).then(() => {
      setForwardBusy(false)
      refreshForwards()
    }).catch((err: Error) => {
      setForwardBusy(false)
      setForwardError(t('forwards.closeFailed') + ': ' + err.message)
    })
  }

  useEffect(() => {
    void props.getPreferences().then((p) => setLocalPicker(p.localPicker))
      .catch((err: Error) => setError(err.message))
  }, [props])

  /** Store the picked interaction and re-read the page so the dialog follows it. */
  const choosePicker = (mode: LocalPickerMode): void => {
    if (mode === localPicker) return
    setPickerBusy(true)
    setError('')
    void props.setPreferences(mode).then((p) => {
      setLocalPicker(p.localPicker)
      setPickerBusy(false)
      setNotice(t('settings.pickerSaved'))
    }).catch((err: Error) => {
      setError(err.message)
      setPickerBusy(false)
    })
  }

  // The palette belongs to one draft form; closing the form closes it too.
  useEffect(() => { if (draft === null) setPaletteOpen(false) }, [draft])

  const refresh = useCallback((): void => {
    void props.listMachines().then((r) => {
      setMachines(r.machines)
    }).catch((err: Error) => setError(err.message))
  }, [props])

  useEffect(() => { refresh() }, [refresh])

  /**
   * The wire payload for the open draft's fields. An untouched stored password
   * is omitted rather than sent empty, so probing a saved machine's edit keeps
   * the secret the host already holds.
   *
   * The machine `id` is deliberately absent: it identifies the record being
   * replaced on save, but naming it on a probe would make the host test the
   * saved machine instead of the fields actually typed into the form.
   */
  const draftFields = useCallback((d: Draft): Record<string, unknown> => ({
    name: d.name || d.host,
    host: d.host.trim(),
    port: Number(d.port) || 22,
    username: d.username.trim(),
    password: d.auth === 'password' ? (d.password === '' && d.hasPassword ? undefined : d.password) : '',
    privateKeyPath: d.auth === 'key' ? d.privateKeyPath.trim() : '',
    useAgent: d.auth === 'agent',
    keyboardInteractive: d.keyboardInteractive,
    proxyHost: d.proxyHost.trim(),
    proxyPort: Number(d.proxyPort) || 22,
    proxyUser: d.proxyUser.trim(),
    color: d.color.trim(),
  }), [])

  const resultText = (r: ProbeResult): string =>
    r.ok
      ? `${t('settings.connected')}${r.platform ? ' · ' + t('settings.platform').replace('{platform}', r.platform) : ''}`
      : r.error ?? t('settings.testFailed')

  /** Probe the open draft, without saving it. */
  const testDraft = (): void => {
    if (!draft) return
    if (!draft.host.trim()) { setError(t('settings.host') + ' ?'); return }
    setError('')
    setDraftResult(null)
    setProbing(DRAFT_PROBE)
    void props.testConnection(draftFields(draft)).then((r) => {
      setDraftResult({ ok: r.ok, text: resultText(r) })
      setProbing(null)
    }).catch((err: Error) => {
      setDraftResult({ ok: false, text: err.message })
      setProbing(null)
    })
  }

  const save = (): void => {
    if (!draft) return
    if (!draft.host.trim()) { setError(t('settings.host') + ' ?'); return }
    setBusy(true)
    setError('')
    void props.saveMachine({ ...draftFields(draft), id: draft.id || undefined }).then(() => {
      setDraft(null)
      setBusy(false)
      setDraftResult(null)
      refresh()
      // A color change re-marks every workspace the machine serves.
      void props.refreshTreeMark()
    }).catch((err: Error) => {
      setError(err.message)
      setBusy(false)
    })
  }

  /** Probe one saved machine by id. */
  const test = (machine: ClientMachine): void => {
    setError('')
    setProbing(machine.id)
    void props.testConnection({ machineId: machine.id }).then((r) => {
      setMachineResults((prev) => ({ ...prev, [machine.id]: { ok: r.ok, text: resultText(r) } }))
      setProbing(null)
    }).catch((err: Error) => {
      setMachineResults((prev) => ({ ...prev, [machine.id]: { ok: false, text: err.message } }))
      setProbing(null)
    })
  }

  const remove = (machine: ClientMachine): void => {
    setBusy(true)
    setDeleteError('')
    void props.deleteMachine(machine.id).then(() => {
      setBusy(false)
      setDeleteTarget(null)
      // The deleted machine's verdict is no longer about anything on screen.
      setMachineResults((prev) => {
        const next = { ...prev }
        delete next[machine.id]
        return next
      })
      refresh()
      // The surviving anchors lose their machine join and fall back to the
      // default marker color.
      void props.refreshTreeMark()
    }).catch((err: Error) => {
      setBusy(false)
      setDeleteError(err.message)
    })
  }

  return createElement('div', { className: 'rdv-page' },
    createElement('p', { className: 'rdv-intro' }, t('settings.intro')),
    createElement('div', { className: 'rdv-form' },
      createElement('div', { className: 'rdv-field' },
        createElement('span', { className: 'rdv-label' }, t('settings.localPicker')),
        createElement('select', {
          className: 'rdv-select',
          value: localPicker,
          disabled: pickerBusy,
          'aria-label': t('settings.localPicker'),
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => choosePicker(e.target.value as LocalPickerMode),
        },
          createElement('option', { value: 'browse' }, t('settings.localPickerBrowse')),
          createElement('option', { value: 'native' }, t('settings.localPickerNative')),
        ),
        createElement('span', { className: 'rdv-hint' }, t('settings.localPickerHint')),
      ),
    ),
    draft === null && createElement('div', { className: 'rdv-actions', style: { justifyContent: 'flex-start', marginTop: 0 } },
      createElement(Button, {
        variant: 'primary',
        onClick: () => { setDraft({ ...EMPTY_DRAFT }); setError(''); setNotice(''); setDraftResult(null) },
      }, t('settings.add')),
    ),
    error && createElement('div', { className: 'rdv-error' }, error),
    notice && createElement('div', { className: 'rdv-ok' }, notice),
    createElement('div', { className: 'rdv-cards' },
      machines.length === 0 && draft === null
        ? createElement('div', { className: 'rdv-empty' }, t('settings.noMachines'))
        : machines.map((m) => {
            const result = machineResults[m.id]
            return createElement('div', { key: m.id, className: 'rdv-card' },
            createElement('div', { className: 'rdv-cardMain' },
              createElement('div', { className: 'rdv-cardName' },
                m.color !== '' && createElement('span', {
                  'aria-hidden': true,
                  style: { width: 10, height: 10, borderRadius: 5, background: m.color, flex: 'none' },
                }),
                createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, m.name),
              ),
              createElement('div', { className: 'rdv-cardHost' }, `${m.username}@${m.host}:${m.port}`),
            ),
            // Each machine keeps its own last probe result: the cards list
            // independent servers, so one failure must not read as the verdict
            // on the next.
            result && createElement('div', { className: result.ok ? 'rdv-ok' : 'rdv-error' }, result.text),
            createElement('div', { className: 'rdv-cardActions' },
              createElement(Button, {
                size: 'sm',
                disabled: busy || probing !== null,
                onClick: () => test(m),
              }, probing === m.id ? t('settings.testing') : t('settings.test')),
              createElement(Button, {
                size: 'sm',
                disabled: busy || probing !== null,
                onClick: () => {
                  setError('')
                  setDraftResult(null)
                  setDraft({
                    id: m.id,
                    name: m.name,
                    host: m.host,
                    port: String(m.port),
                    username: m.username,
                    auth: m.hasPassword ? 'password' : (m.privateKeyPath ? 'key' : 'agent'),
                    password: '',
                    hasPassword: m.hasPassword,
                    privateKeyPath: m.privateKeyPath,
                    proxyHost: m.proxyHost,
                    // Without these two the save rewrites the jump host as port
                    // 22 with no user, silently dropping the real values.
                    proxyPort: String(m.proxyPort || 22),
                    proxyUser: m.proxyUser,
                    keyboardInteractive: m.keyboardInteractive,
                    color: m.color,
                  })
                },
              }, t('settings.edit')),
              createElement(Button, {
                size: 'sm',
                disabled: busy || probing !== null,
                onClick: () => { setDeleteTarget(m); setDeleteError('') },
              }, t('settings.delete')),
            ),
          )
          }),
    ),
    // ── on-demand port forwards ────────────────────────────────────────────
    createElement('div', { className: 'rdv-sectionTitle' }, t('forwards.title')),
    createElement('p', { className: 'rdv-intro' }, t('forwards.intro')),
    createElement('div', { className: 'rdv-cards' },
      forwards.length === 0
        ? createElement('div', { className: 'rdv-empty' }, t('forwards.none'))
        : forwards.map((f) => createElement('div', { key: f.id, className: 'rdv-forwardRow' },
            createElement('span', { className: 'rdv-forwardUrl', title: f.url }, f.url),
            createElement('span', { className: 'rdv-forwardTarget' }, `${f.remoteHost}:${f.remotePort}`),
            createElement(Button, { size: 'sm', disabled: forwardBusy, onClick: () => closeForward(f.id) },
              t('forwards.close')),
          )),
    ),
    machines.length > 0 && createElement('div', { className: 'rdv-row' },
      createElement('label', { className: 'rdv-field' },
        createElement('span', { className: 'rdv-label' }, t('forwards.machine')),
        createElement('select', {
          className: 'rdv-select',
          value: forwardMachine || machines[0]?.id || '',
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setForwardMachine(e.target.value),
        }, machines.map((m) => createElement('option', { key: m.id, value: m.id }, m.name))),
      ),
      field(t('forwards.remotePort'), forwardPort, (v) => setForwardPort(v), '3000', 'number'),
      field(t('forwards.remoteHost'), forwardHost, (v) => setForwardHost(v), '127.0.0.1'),
    ),
    machines.length > 0 && createElement('div', { className: 'rdv-actions', style: { justifyContent: 'flex-start', marginTop: 0 } },
      createElement(Button, { size: 'sm', disabled: forwardBusy, onClick: openForward }, t('forwards.open')),
    ),
    createElement('p', { className: 'rdv-hint' }, t('forwards.localOnly')),
    forwardError !== '' && createElement('div', { className: 'rdv-error' }, forwardError),
    draft !== null && createElement('div', { className: 'rdv-form' },
      createElement('div', { className: 'rdv-row' },
        field(t('settings.name'), draft.name, (v) => setDraft({ ...draft, name: v }), draft.host || 'my-server'),
        field(t('settings.host'), draft.host, (v) => setDraft({ ...draft, host: v }), '203.0.113.10'),
        field(t('settings.port'), draft.port, (v) => setDraft({ ...draft, port: v }), '22'),
        field(t('settings.username'), draft.username, (v) => setDraft({ ...draft, username: v }), 'root'),
      ),
      createElement('div', { className: 'rdv-row' },
        createElement('label', { className: 'rdv-field' },
          createElement('span', { className: 'rdv-label' }, t('settings.auth')),
          createElement('select', {
            className: 'rdv-select',
            value: draft.auth,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setDraft({ ...draft, auth: e.target.value as Draft['auth'] }),
          },
            createElement('option', { value: 'password' }, t('settings.authPassword')),
            createElement('option', { value: 'key' }, t('settings.authKey')),
            createElement('option', { value: 'agent' }, t('settings.authAgent')),
          ),
        ),
        draft.auth === 'password' && field(
          t('settings.password'),
          draft.password,
          (v) => setDraft({ ...draft, password: v }),
          draft.id && draft.hasPassword && !draft.password ? t('settings.passwordKeep') : '',
          'password',
        ),
        draft.auth === 'key' && field(
          t('settings.privateKeyPath'),
          draft.privateKeyPath,
          (v) => setDraft({ ...draft, privateKeyPath: v }),
          '~/.ssh/id_ed25519',
        ),
      ),
      createElement('div', { className: 'rdv-row' },
        createElement('div', { className: 'rdv-field', style: { position: 'relative' } },
          createElement('span', { className: 'rdv-label' }, t('settings.color')),
          createElement('button', {
            type: 'button',
            className: 'rdv-colorTrigger',
            onClick: () => setPaletteOpen(!paletteOpen),
          },
            draft.color !== '' && createElement('span', { className: 'rdv-colorDot', style: { background: draft.color } }),
            createElement('span', null, draft.color === '' ? t('settings.colorDefault') : draft.color),
          ),
          paletteOpen && draft !== null && createElement(Fragment, null,
            createElement('div', { className: 'rdv-paletteBackdrop', onClick: () => setPaletteOpen(false) }),
            createElement('div', { className: 'rdv-palette', role: 'listbox', 'aria-label': t('settings.color') },
              createElement('button', {
                type: 'button',
                role: 'option',
                'aria-selected': draft.color === '',
                className: 'rdv-swatch rdv-swatchDefault' + (draft.color === '' ? ' rdv-swatchActive' : ''),
                title: t('settings.colorDefault'),
                onClick: () => { setDraft({ ...draft, color: '' }); setPaletteOpen(false) },
              }),
              COLOR_PRESETS.map((c) => createElement('button', {
                key: c,
                type: 'button',
                role: 'option',
                'aria-selected': draft.color.toLowerCase() === c,
                className: 'rdv-swatch' + (draft.color.toLowerCase() === c ? ' rdv-swatchActive' : ''),
                style: { background: c },
                title: c,
                onClick: () => { setDraft({ ...draft, color: c }); setPaletteOpen(false) },
              })),
            ),
          ),
        ),
      ),
      createElement('details', { className: 'rdv-field' },
        createElement('summary', { className: 'rdv-label', style: { cursor: 'pointer' } }, t('settings.advanced')),
        createElement('div', { className: 'rdv-row', style: { marginTop: 8 } },
          field(t('settings.proxyHost'), draft.proxyHost, (v) => setDraft({ ...draft, proxyHost: v }), ''),
          field(t('settings.proxyPort'), draft.proxyPort, (v) => setDraft({ ...draft, proxyPort: v }), '22'),
          field(t('settings.proxyUser'), draft.proxyUser, (v) => setDraft({ ...draft, proxyUser: v }), ''),
        ),
        createElement('label', { className: 'rdv-label', style: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 } },
          createElement('input', {
            type: 'checkbox',
            checked: draft.keyboardInteractive,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, keyboardInteractive: e.target.checked }),
          }),
          t('settings.keyboardInteractive'),
        ),
      ),
      draftResult && createElement('div', { className: draftResult.ok ? 'rdv-ok' : 'rdv-error' }, draftResult.text),
      createElement('div', { className: 'rdv-actions' },
        createElement(Button, { disabled: busy, onClick: () => { setDraft(null); setDraftResult(null) } }, t('settings.cancel')),
        // Probe before saving: a machine is only worth keeping once it answers,
        // and testing the draft here costs nothing and stores nothing.
        createElement(Button, {
          disabled: busy || probing !== null,
          onClick: testDraft,
        }, probing === DRAFT_PROBE ? t('settings.testing') : t('settings.test')),
        createElement(Button, { variant: 'primary', disabled: busy, onClick: save }, t('settings.save')),
      ),
    ),
    createElement(Modal, {
      open: deleteTarget !== null,
      onClose: () => { if (!busy) setDeleteTarget(null) },
      title: t('settings.deleteTitle'),
      closeLabel: t('settings.cancel'),
      description: deleteTarget === null
        ? ''
        : t('settings.deleteConfirm').replace('{name}', `${deleteTarget.name} (${deleteTarget.username}@${deleteTarget.host}:${deleteTarget.port})`),
      footer: createElement(Fragment, null,
        createElement(Button, { variant: 'outline', autoFocus: true, disabled: busy, onClick: () => setDeleteTarget(null) }, t('settings.cancel')),
        createElement(Button, {
          variant: 'outline',
          disabled: busy || deleteTarget === null,
          onClick: () => { if (deleteTarget !== null) remove(deleteTarget) },
        }, t('settings.confirmDelete')),
      ),
    }, deleteError === '' ? null : createElement('p', { className: 'rdv-error', style: { margin: 0 } }, deleteError)),
  )
}
