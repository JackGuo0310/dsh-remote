/**
 * The plugin's stylesheet, injected once per page load. Class names carry the
 * `rdv-` prefix and every color/spacing value reads the harness `--dsw-*`
 * tokens, so light/dark themes follow the shell without extra work.
 * @module dsh-remote-development/client/styles
 */

const CSS = `
.rdv-page { display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
.rdv-intro { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.rdv-cards { display: flex; flex-direction: column; gap: 8px; }
.rdv-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.rdv-cardMain { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.rdv-cardName { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 510; line-height: 20px; display: flex; align-items: center; gap: 8px; }
.rdv-cardHost { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-cardActions { display: flex; align-items: center; gap: 4px; flex: none; }
.rdv-form { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }
.rdv-row { display: flex; gap: 10px; }
.rdv-row > * { flex: 1; min-width: 0; }
.rdv-field { display: flex; flex-direction: column; gap: 5px; }
.rdv-label { color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 500; line-height: 18px; }
.rdv-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.rdv-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; white-space: pre-wrap; }
.rdv-ok { color: var(--dsw-alias-state-success-primary, var(--dsw-alias-label-primary)); font-size: 12px; line-height: 18px; }
.rdv-dialog { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: var(--dsw-alias-overlay-bg, rgba(0,0,0,0.4)); }
.rdv-sheet { display: flex; flex-direction: column; width: min(640px, calc(100vw - 32px)); height: min(520px, calc(100dvh - 48px)); background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l3); border-radius: 14px; box-shadow: 0 18px 48px rgba(0,0,0,0.25); overflow: hidden; }
.rdv-sheetHead { display: flex; align-items: center; gap: 12px; padding: 14px 18px 10px; border-bottom: 1px solid var(--dsw-alias-border-l3); }
.rdv-tabs { display: flex; gap: 2px; padding: 3px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); }
.rdv-tab { border: none; background: transparent; border-radius: 7px; padding: 5px 14px; color: var(--dsw-alias-label-secondary); font-size: 13px; font-weight: 500; cursor: pointer; }
.rdv-tabActive { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
.rdv-sheetTitle { color: var(--dsw-alias-label-primary); font-size: 15px; font-weight: 510; flex: 1; }
.rdv-sheetBody { display: flex; flex-direction: column; gap: 10px; padding: 14px 18px; flex: 1; min-height: 0; overflow-y: auto; }
.rdv-hint { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.rdv-toolbar { display: flex; align-items: center; gap: 6px; }
.rdv-pathInput { flex: 1; min-width: 0; height: 30px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); padding: 0 10px; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; outline: none; }
.rdv-pathInput:focus { border-color: var(--dsw-alias-border-l2); }
.rdv-list { display: flex; flex-direction: column; gap: 1px; flex: 1; min-height: 0; overflow-y: auto; border: 1px solid var(--dsw-alias-border-l4); border-radius: 10px; }
.rdv-itemRow { display: flex; align-items: center; gap: 8px; width: 100%; border: none; background: transparent; text-align: left; padding: 8px 12px; color: var(--dsw-alias-label-primary); font-size: 13px; cursor: pointer; }
.rdv-itemRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-itemName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-itemIcon { color: var(--dsw-alias-label-tertiary); flex: none; display: inline-flex; }
.rdv-empty { padding: 24px; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
.rdv-sheetFoot { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--dsw-alias-border-l3); }
.rdv-spacer { flex: 1; }
.rdv-status { color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.rdv-select { height: 32px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); padding: 0 8px; font-size: 13px; outline: none; min-width: 0; flex: 1; }
/* The native popup does not inherit the page theme: without an explicit
   color-scheme it renders light even under dark tokens, leaving inherited
   near-white option text on a white list. Opaque option colors fix the list
   in every engine; color-scheme under the shell's dark-theme attribute also
   fixes the popup chrome (border, highlight, arrow). */
.rdv-select option { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
body[data-ds-dark-theme] .rdv-select { color-scheme: dark; }
/* Marker-color palette: a trigger button over an anchored 3x3 swatch card.
   The fixed transparent backdrop closes the card on any outside click while
   the card itself sits above it in the same stacking context. */
.rdv-colorTrigger { display: inline-flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); font-size: 13px; cursor: pointer; text-align: left; }
.rdv-colorDot { width: 12px; height: 12px; border-radius: 6px; flex: none; border: 1px solid var(--dsw-alias-border-l4); }
.rdv-paletteBackdrop { position: fixed; inset: 0; z-index: 50; background: transparent; border: none; padding: 0; cursor: default; }
.rdv-palette { position: absolute; top: calc(100% + 6px); left: 0; z-index: 51; display: grid; grid-template-columns: repeat(3, 30px); gap: 8px; padding: 10px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
.rdv-swatch { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l4); padding: 0; cursor: pointer; }
.rdv-swatchDefault { background: var(--dsw-alias-bg-layer-2); position: relative; }
.rdv-swatchDefault::after { content: ''; position: absolute; inset: 7px; border: 1.5px dashed var(--dsw-alias-label-tertiary); border-radius: 5px; }
.rdv-swatchActive { outline: 2px solid var(--dsw-alias-label-primary); outline-offset: 2px; }
/* Remote-file tab. It lives in a narrow sidebar column, so every row is one
   line and the path is the only thing that truncates. */
.rdv-files { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--dsw-alias-bg-layer-1); }
.rdv-filesHead { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--dsw-alias-border-l3); flex: none; }
.rdv-filesPath { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
.rdv-filesTools { display: flex; align-items: center; gap: 4px; }
.rdv-filesList { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto; padding: 2px 0; }
.rdv-filesRow { display: flex; align-items: center; gap: 6px; box-sizing: border-box; width: 100%; min-height: 26px; padding: 3px 12px 3px 10px; border: none; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 18px; text-align: left; cursor: pointer; text-decoration: none; }
.rdv-filesRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-filesRow:focus-visible { outline: 1px solid var(--dsw-alias-border-l2); outline-offset: -1px; }
.rdv-filesIcon { display: inline-flex; color: var(--dsw-alias-label-tertiary); flex: none; }
.rdv-filesName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-filesGlyph { color: var(--dsw-alias-label-tertiary); flex: none; font-size: 14px; line-height: 14px; }
.rdv-filesSize { color: var(--dsw-alias-label-secondary); font-size: 11px; flex: none; padding-left: 6px; font-variant-numeric: tabular-nums; }
.rdv-filesViewerBar { display: flex; align-items: center; gap: 6px; }
.rdv-filesViewerName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 510; }
.rdv-filesEditor { flex: 1; box-sizing: border-box; width: 100%; min-height: 0; resize: none; border: none; outline: none; padding: 8px 10px; background: transparent; color: var(--dsw-alias-label-primary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 18px; tab-size: 2; }
.rdv-filesImage { flex: 1; min-height: 0; overflow: auto; padding: 10px; display: flex; align-items: flex-start; justify-content: center; }
.rdv-filesImage img { max-width: 100%; height: auto; }
.rdv-filesNote { flex: none; padding: 4px 10px; border-top: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }
/* Read view. One scrolling surface holds a sticky gutter and the highlighted
   source; both share the same 18px line grid, so numbers stay aligned. The
   token colors are the sidebar's one-light / one-dark syntax families, so this
   view reads like its CodeMirror editor. */
.rdv-codeWrap { flex: 1; min-height: 0; overflow: auto; display: flex; align-items: flex-start; }
.rdv-codeGutter { position: sticky; left: 0; z-index: 1; flex: none; padding: 8px 8px 8px 10px; text-align: right; white-space: pre; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-1); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 18px; user-select: none; }
.rdv-code { margin: 0; padding: 8px 12px 8px 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 18px; tab-size: 2; color: var(--dsw-alias-label-primary); white-space: pre; }
.rdv-code code { font: inherit; color: inherit; }
.rdv-code .hljs-comment, .rdv-code .hljs-quote { color: #a0a1a7; font-style: italic; }
.rdv-code .hljs-keyword, .rdv-code .hljs-literal, .rdv-code .hljs-selector-tag, .rdv-code .hljs-doctag { color: #a626a4; }
.rdv-code .hljs-string, .rdv-code .hljs-regexp, .rdv-code .hljs-addition { color: #50a14f; }
.rdv-code .hljs-number, .rdv-code .hljs-symbol, .rdv-code .hljs-bullet { color: #986801; }
.rdv-code .hljs-title, .rdv-code .hljs-section, .rdv-code .hljs-name { color: #0184bc; }
.rdv-code .hljs-type, .rdv-code .hljs-built_in, .rdv-code .hljs-class .hljs-title { color: #c18401; }
.rdv-code .hljs-attr, .rdv-code .hljs-attribute, .rdv-code .hljs-variable, .rdv-code .hljs-template-variable { color: #e45649; }
.rdv-code .hljs-meta, .rdv-code .hljs-selector-id, .rdv-code .hljs-selector-class { color: #0997b3; }
.rdv-code .hljs-deletion { color: #e45649; }
.rdv-code .hljs-link { color: #4078f2; }
.rdv-code .hljs-emphasis { font-style: italic; }
.rdv-code .hljs-strong { font-weight: 600; }
body[data-ds-dark-theme] .rdv-code .hljs-comment, body[data-ds-dark-theme] .rdv-code .hljs-quote { color: #5c6370; }
body[data-ds-dark-theme] .rdv-code .hljs-keyword, body[data-ds-dark-theme] .rdv-code .hljs-literal, body[data-ds-dark-theme] .rdv-code .hljs-selector-tag, body[data-ds-dark-theme] .rdv-code .hljs-doctag { color: #c678dd; }
body[data-ds-dark-theme] .rdv-code .hljs-string, body[data-ds-dark-theme] .rdv-code .hljs-regexp, body[data-ds-dark-theme] .rdv-code .hljs-addition { color: #98c379; }
body[data-ds-dark-theme] .rdv-code .hljs-number, body[data-ds-dark-theme] .rdv-code .hljs-symbol, body[data-ds-dark-theme] .rdv-code .hljs-bullet { color: #d19a66; }
body[data-ds-dark-theme] .rdv-code .hljs-title, body[data-ds-dark-theme] .rdv-code .hljs-section, body[data-ds-dark-theme] .rdv-code .hljs-name { color: #61afef; }
body[data-ds-dark-theme] .rdv-code .hljs-type, body[data-ds-dark-theme] .rdv-code .hljs-built_in, body[data-ds-dark-theme] .rdv-code .hljs-class .hljs-title { color: #e5c07b; }
body[data-ds-dark-theme] .rdv-code .hljs-attr, body[data-ds-dark-theme] .rdv-code .hljs-attribute, body[data-ds-dark-theme] .rdv-code .hljs-variable, body[data-ds-dark-theme] .rdv-code .hljs-template-variable { color: #e06c75; }
body[data-ds-dark-theme] .rdv-code .hljs-meta, body[data-ds-dark-theme] .rdv-code .hljs-selector-id, body[data-ds-dark-theme] .rdv-code .hljs-selector-class { color: #56b6c2; }
body[data-ds-dark-theme] .rdv-code .hljs-deletion { color: #e06c75; }
body[data-ds-dark-theme] .rdv-code .hljs-link { color: #61afef; }
.rdv-filesError { padding: 6px 10px; color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; word-break: break-word; }
.rdv-filesFoot { flex: none; padding: 5px 10px; border-top: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-filesMachine { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
/* Port forwards in the settings page: a compact add row plus live records. */
.rdv-forwardRow { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.rdv-forwardUrl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--dsw-alias-label-primary); }
.rdv-forwardTarget { color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; }
.rdv-sectionTitle { margin: 8px 0 0; color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 510; line-height: 20px; }
`

/** Inject the stylesheet once (idempotent across plugin reloads). */
export function injectStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector('style[data-plugin-css="dsh-remote-development"]')
  if (existing) return () => {}
  const tag = document.createElement('style')
  tag.dataset.pluginCss = 'dsh-remote-development'
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => tag.remove()
}
