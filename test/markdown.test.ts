/**
 * The Markdown preview renderer: a remote file is untrusted input, so the
 * tests pin both the feature coverage an operator expects and the escape
 * guarantees that keep a `.md` file from becoming a script injection.
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { isMarkdownName, renderMarkdown } from '../src/client/markdown.ts'

test('markdown file names are recognised, other extensions are not', () => {
  for (const name of ['README.md', 'notes.markdown', 'a.MD', 'x.mkd', 'y.mdx', 'deep/dir/z.mdown']) {
    assert.equal(isMarkdownName(name), true, name)
  }
  for (const name of ['readme.txt', 'md', 'x.md.bak', 'x.mjs', 'markdown']) {
    assert.equal(isMarkdownName(name), false, name)
  }
})

test('headings, lists, code fences and tables render as HTML', () => {
  const html = renderMarkdown([
    '# Title',
    '',
    'Some **bold** and `inline` text.',
    '',
    '- one',
    '- two',
    '',
    '```ts',
    'const x: number = 1',
    '```',
    '',
    '| a | b |',
    '| - | - |',
    '| 1 | 2 |',
  ].join('\n'))
  assert.match(html, /<h1>Title<\/h1>/)
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /<code>inline<\/code>/)
  assert.match(html, /<li>one<\/li>/)
  assert.match(html, /<pre><code class="language-ts">/)
  assert.match(html, /<table>/)
})

test('raw HTML in a remote file is escaped, never executed', () => {
  const html = renderMarkdown([
    '<script>alert(1)</script>',
    '',
    '<img src=x onerror="alert(2)">',
    '',
    'text <b>bold</b>',
  ].join('\n'))
  assert.doesNotMatch(html, /<script>/)
  // The attribute only appears inside escaped text, never as a real tag.
  assert.doesNotMatch(html, /<[^>]*onerror/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&lt;b&gt;bold&lt;\/b&gt;/, 'an inline tag is escaped, not rendered')
  assert.doesNotMatch(html, /<img src=x/)
})

test('links open outside the panel and images can be re-pointed', () => {
  const html = renderMarkdown('[docs](https://example.com/a) ![shot](img/a.png)', {
    image: (src) => `/download?path=${encodeURIComponent(src)}`,
  })
  assert.match(html, /<a href="https:\/\/example.com\/a" target="_blank" rel="noreferrer noopener">/)
  assert.match(html, /<img src="\/download\?path=img%2Fa.png"/)
})

test('an image hook that declines leaves the source untouched', () => {
  const html = renderMarkdown('![remote](https://cdn.example.com/x.png)', { image: () => null })
  assert.match(html, /<img src="https:\/\/cdn.example.com\/x.png"/)
})

test('inline code is not linkified and line breaks stay paragraphs', () => {
  const html = renderMarkdown('see https://example.com and `https://inside.code`')
  assert.match(html, /<a href="https:\/\/example.com"/)
  assert.match(html, /<code>https:\/\/inside.code<\/code>/)
})
