/**
 * Syntax highlighting for the remote-file viewer. The sidebar's own editor is
 * CodeMirror with a one-dark / one-light palette; this module reproduces the
 * same visual result from `highlight.js` (bundled, no runtime service), and the
 * stylesheet colors its token classes with those palette values so the two
 * surfaces read the same.
 * @module dsh-remote-development/client/code-highlight
 */

import hljs from 'highlight.js/lib/common'

/** Extension → highlight.js language id (only ids `common` actually ships). */
const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  bash: 'bash',
  c: 'c',
  cc: 'cpp',
  cfg: 'ini',
  clj: 'clojure',
  cjs: 'javascript',
  conf: 'ini',
  cpp: 'cpp',
  cs: 'csharp',
  css: 'css',
  cxx: 'cpp',
  dart: 'dart',
  diff: 'diff',
  env: 'bash',
  erl: 'erlang',
  ex: 'elixir',
  go: 'go',
  gql: 'graphql',
  graphql: 'graphql',
  h: 'cpp',
  hpp: 'cpp',
  hs: 'haskell',
  htm: 'xml',
  html: 'xml',
  ini: 'ini',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsonc: 'json',
  jsx: 'javascript',
  kt: 'kotlin',
  less: 'less',
  lua: 'lua',
  m: 'objectivec',
  md: 'markdown',
  mjs: 'javascript',
  pl: 'perl',
  php: 'php',
  properties: 'ini',
  ps1: 'powershell',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  r: 'r',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
  svelte: 'xml',
  swift: 'swift',
  tex: 'latex',
  toml: 'ini',
  ts: 'typescript',
  tsx: 'typescript',
  txt: 'plaintext',
  vue: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
}

/** Whole-filename → language id, for files with no extension. */
const LANGUAGE_BY_NAME: Readonly<Record<string, string>> = {
  dockerfile: 'bash',
  makefile: 'makefile',
  '.gitignore': 'bash',
  '.npmrc': 'ini',
  '.editorconfig': 'ini',
}

/** HTML-escape text that gets no highlighting. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * The highlight.js language for one file name.
 * @param name - the file's basename.
 * @returns a language id, or undefined for plain text.
 */
export function languageFor(name: string): string | undefined {
  const lower = name.toLowerCase()
  const byName = LANGUAGE_BY_NAME[lower]
  if (byName !== undefined) return byName
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return undefined
  return LANGUAGE_BY_EXTENSION[lower.slice(dot + 1)]
}

/**
 * Highlight one file's source.
 * @param code - the file's text.
 * @param name - the file's basename (decides the language).
 * @returns HTML with `hljs-*` token spans, safe to inject.
 */
export function highlightCode(code: string, name: string): string {
  const language = languageFor(name)
  if (language !== undefined && language !== 'plaintext' && hljs.getLanguage(language) !== undefined) {
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    } catch {
      // A language module that rejects the input must not blank the file.
    }
  }
  return escapeHtml(code)
}

/**
 * The gutter's line numbers, as one string with a newline per line — the
 * gutter and the code share a line grid, so they stay aligned by construction.
 * @param code - the file's text.
 * @returns the numbered text.
 */
export function lineNumbers(code: string): string {
  // A trailing newline does not create an extra visible line.
  const count = Math.max(1, code.length === 0 ? 1 : code.split('\n').length - (code.endsWith('\n') ? 1 : 0))
  let out = ''
  for (let i = 1; i <= count; i += 1) out += (i === 1 ? '' : '\n') + i
  return out
}
