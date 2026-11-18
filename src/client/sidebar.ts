/**
 * Optional integration with the third-party `dsh-better-sidebar` plugin. That
 * plugin publishes `ctx.betterSidebar.registerTab()`, so this module registers
 * one extra tab through the public seam and nothing else: no source edits, no
 * DOM injection, and no dependency (the package stays out of this plugin's
 * graph, so a profile without it simply never provides the service).
 *
 * The tab is named "远程文件" precisely because the sidebar's built-in files tab
 * reads the HOST filesystem — in a remote session that is not the project.
 * @module dsh-remote-development/client/sidebar
 */

import { createElement } from 'react'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import * as api from './api.ts'
import { RemoteFiles } from './remote-files.tsx'
import type { RemoteFilesInjected } from './remote-files.tsx'

/** The subset of the sidebar's public tab descriptor this registration uses. */
interface SidebarTabLike {
  id: string
  title: string | (() => string)
  description?: string | (() => string)
  order?: number
  single?: boolean
  component: (props: { scope: { sessionId: string } }) => unknown
}

/** The subset of `ctx.betterSidebar` this registration uses. */
interface BetterSidebarLike {
  registerTab(tab: SidebarTabLike): () => void
  /** The sidebar's own file artwork (feature `fileIcons`, v0.19.0+). */
  fileIcon?(path: string, size: number): unknown
  folderIcon?(path: string, open: boolean, size: number): unknown
}

/** A context that can wait for an optional service and scope effects to it. */
interface InjectableContext {
  inject(deps: string[], run: (scope: InjectableScope) => void): unknown
}

/** The fiber handed to an `inject` callback. */
interface InjectableScope {
  betterSidebar: BetterSidebarLike
  effect(run: () => () => void, label?: string): void
}

/**
 * Register the remote-file tab whenever the sidebar plugin is present. The
 * injection waits for `betterSidebar`, so installation order does not matter
 * and an absent sidebar is not an error.
 * @param ctx - client root context.
 * @param t - the plugin's bound translator.
 */
export function registerRemoteFilesTab(ctx: ClientContext, t: Translate): void {
  const injected: RemoteFilesInjected = {
    sessionRemote: api.sessionRemote,
    listRemoteFiles: api.listRemoteFiles,
    readRemoteFile: api.readRemoteFile,
    writeRemoteFile: api.writeRemoteFile,
    uploadRemoteFile: api.uploadRemoteFile,
    remoteDownloadUrl: api.remoteDownloadUrl,
    t,
  }
  const injectable = ctx as unknown as InjectableContext
  injectable.inject(['betterSidebar'], (scope) => {
    const sidebar = scope.betterSidebar
    // Rows use the sidebar's icon chain when the host version exposes it, so an
    // installed icon theme restyles this tab too; older hosts just get the
    // plugin's plain glyphs.
    const icons = {
      ...(typeof sidebar.fileIcon === 'function'
        ? { fileIcon: (path: string, size: number) => sidebar.fileIcon?.(path, size) }
        : {}),
      ...(typeof sidebar.folderIcon === 'function'
        ? { folderIcon: (path: string, open: boolean, size: number) => sidebar.folderIcon?.(path, open, size) }
        : {}),
    }
    const dispose = scope.betterSidebar.registerTab({
      id: 'dsh-remote:files',
      title: () => t('files.tabTitle'),
      description: () => t('files.tabDescription'),
      order: 12,
      single: true,
      component: ({ scope: sessionScope }) => createElement(RemoteFiles, {
        sessionId: sessionScope.sessionId,
        injected: { ...injected, ...icons },
      }),
    })
    // Tying the disposer to this fiber means unloading either plugin removes
    // the row from the + menu instead of leaving a dead tab behind.
    scope.effect(() => dispose, 'dsh-remote-development: sidebar tab')
  })
}
