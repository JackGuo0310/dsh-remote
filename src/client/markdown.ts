/**
 * Markdown rendering for the remote-file viewer. The sidebar's own preview
 * renders local files only — its `openFile`/viewer pipeline reads through the
 * sidebar's local fs service and exposes no "here is the content" entry — so a
 * remote file cannot be handed to it. This module renders the remote text with
 * the same Markdown feature set through the panel's own typography.
 *
 * Raw HTML in the source is NOT passed through (`html: false`): a remote file
 * is untrusted input, and echoing its `<script>`/`<iframe>` into the page would
 * be an injection channel.
 * @module dsh-remote-development/client/markdown
 */

import MarkdownIt from 'markdown-it'

/** Extensions the viewer renders as Markdown. */
const MARKDOWN_EXTENSIONS = /\.(?:md|markdown|mdown|mkdn|mkd|mdx)$/i

/**
 * Whether a file name is a Markdown document.
 * @param name - base name of the file.
 * @returns true when the preview may render it.
 */
export function isMarkdownName(name: string): boolean {
  return MARKDOWN_EXTENSIONS.test(name)
}

/** Hooks one render may use; they ride markdown-it's `env`, so renders cannot leak state. */
export interface MarkdownHooks {
  /** Map an image source (often relative to the file) to a URL the page can load. */
  image?: (src: string) => string | null
}

/** CommonMark plus tables/strikethrough/linkify, with no raw HTML. */
const engine = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
})

const renderImage = engine.renderer.rules.image
  ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
engine.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if (token === undefined) return ''
  const raw = token.attrGet('src')
  const source = typeof raw === 'string' ? raw : ''
  const next = (env as MarkdownHooks | undefined)?.image?.(source) ?? null
  if (next !== null) token.attrSet('src', next)
  return renderImage(tokens, idx, options, env, self)
}

// A link opened from the panel must not navigate the GUI away.
const renderLinkOpen = engine.renderer.rules.link_open
  ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
engine.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if (token !== undefined) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noreferrer noopener')
  }
  return renderLinkOpen(tokens, idx, options, env, self)
}

/**
 * Render one Markdown document to HTML that is safe to inject.
 * @param text - the file's text.
 * @param hooks - optional image source mapping (remote images are not
 *   reachable from the page, so relative ones become download URLs).
 * @returns HTML with every raw HTML character escaped.
 */
export function renderMarkdown(text: string, hooks: MarkdownHooks = {}): string {
  // Defensive: callers pass decoded text, and a non-string must not crash the viewer.
  return engine.render(typeof text === 'string' ? text : String(text ?? ''), hooks as unknown as Record<string, unknown>)
}
