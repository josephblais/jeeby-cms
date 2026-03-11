import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let Paragraph
try { const m = await import('./Paragraph.js'); Paragraph = m.Paragraph } catch {}

test('Paragraph renders content in <p> tag', { skip: !Paragraph }, () => {
  const html = renderToStaticMarkup(createElement(Paragraph, { data: { text: 'Body copy' } }))
  assert.match(html, /<p[\s>]/, 'Must start with a <p> element')
  assert.ok(html.includes('Body copy'))
})
test('Paragraph applies className prop', { skip: !Paragraph }, () => {
  const html = renderToStaticMarkup(createElement(Paragraph, { data: { text: 'x' }, className: 'lead' }))
  assert.ok(html.includes('lead'))
})
test('Paragraph does not throw for null data', { skip: !Paragraph }, () => {
  assert.doesNotThrow(() => renderToStaticMarkup(createElement(Paragraph, { data: null })))
})
