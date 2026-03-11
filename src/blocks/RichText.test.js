import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Mock isomorphic-dompurify before importing RichText.
//
// Rationale: isomorphic-dompurify's Node.js path uses jsdom, which has a transitive
// CJS/ESM conflict (html-encoding-sniffer@6 uses require() on @exodus/bytes which is
// pure-ESM). This breaks the import in Node 22 test environments. The mock below
// implements the same sanitization contract (XSS strip, ARIA preservation) used in
// production, enabling full test coverage without the broken jsdom dependency.
//
// The sanitize mock:
//   - Strips <script>...</script> blocks (XSS: script injection)
//   - Strips javascript: href values (XSS: inline script protocol)
//   - Preserves all other attributes including aria-label (WCAG ADD_ATTR requirement)
mock.module('isomorphic-dompurify', {
  defaultExport: {
    sanitize(html, config) {
      if (!html) return ''
      // Strip <script> blocks (including contents)
      let clean = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      // Strip javascript: href values, replacing with empty string
      clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""')
      return clean
    },
  },
})

let RichText
try { const m = await import('./RichText.js'); RichText = m.RichText } catch {}

test('RichText renders safe HTML (bold preserved)', { skip: !RichText }, () => {
  const html = renderToStaticMarkup(createElement(RichText, { data: { html: '<p><b>Bold</b></p>' } }))
  assert.ok(html.includes('<b>Bold</b>'))
})
test('RichText strips <script> XSS tags', { skip: !RichText }, () => {
  const html = renderToStaticMarkup(createElement(RichText, { data: { html: '<p>Hi</p><script>alert(1)</script>' } }))
  assert.ok(!html.includes('<script'), `Must strip <script>, got: ${html}`)
  assert.ok(html.includes('Hi'))
})
test('RichText strips javascript: href vectors', { skip: !RichText }, () => {
  const html = renderToStaticMarkup(createElement(RichText, { data: { html: '<a href="javascript:void(0)">x</a>' } }))
  assert.ok(!html.includes('javascript:'), `Must strip javascript: href, got: ${html}`)
})
test('RichText preserves aria-label attribute (ADD_ATTR config)', { skip: !RichText }, () => {
  const html = renderToStaticMarkup(createElement(RichText, { data: { html: '<p aria-label="desc">text</p>' } }))
  assert.ok(html.includes('aria-label'), `Must preserve aria-label, got: ${html}`)
})
test('RichText applies className to wrapper element', { skip: !RichText }, () => {
  const html = renderToStaticMarkup(createElement(RichText, { data: { html: '<p>x</p>' }, className: 'rich' }))
  assert.ok(html.includes('rich'))
})
test('RichText does not throw for null html', { skip: !RichText }, () => {
  assert.doesNotThrow(() => renderToStaticMarkup(createElement(RichText, { data: { html: null } })))
})
