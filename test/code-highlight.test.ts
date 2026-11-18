/**
 * The viewer's code rendering: language selection, gutter line counts, and the
 * HTML that reaches the read view.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { highlightCode, languageFor, lineNumbers } from '../src/client/code-highlight.ts'

test('a file name selects its language by extension or whole name', () => {
  assert.equal(languageFor('src/index.ts'), 'typescript')
  assert.equal(languageFor('App.TSX'), 'typescript')
  assert.equal(languageFor('README.md'), 'markdown')
  assert.equal(languageFor('config.yml'), 'yaml')
  assert.equal(languageFor('Dockerfile'), 'bash')
  assert.equal(languageFor('.gitignore'), 'bash')
  assert.equal(languageFor('notes.unknown-ext'), undefined)
  assert.equal(languageFor('LICENSE'), undefined)
})

test('the gutter counts the lines the code actually shows', () => {
  assert.equal(lineNumbers(''), '1')
  assert.equal(lineNumbers('a'), '1')
  assert.equal(lineNumbers('a\nb'), '1\n2')
  // A trailing newline ends the last line; it does not add a phantom line.
  assert.equal(lineNumbers('a\nb\n'), '1\n2')
  assert.equal(lineNumbers('\n\n'), '1\n2')
})

test('highlighting emits token spans for a known language', () => {
  const html = highlightCode('const x = "s"', 'a.ts')
  assert.match(html, /hljs-keyword/)
  assert.match(html, /hljs-string/)
  // The source reaches the DOM as HTML, so markup in a plain file is escaped.
  const plain = highlightCode('<script>alert(1)</script>', 'notes.unknown-ext')
  assert.equal(plain, '&lt;script&gt;alert(1)&lt;/script&gt;')
})
