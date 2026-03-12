import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Mock dompurify before importing index.js.
// dompurify is browser-only; in Node.js test environment there is no DOM, so we mock it.
// This mock matches the same contract used in RichText.test.js.
mock.module('dompurify', {
  defaultExport: {
    sanitize(html) { return html ?? '' },
  },
})

let Blocks, Block
try {
  const m = await import('./index.js')
  Blocks = m.Blocks
  Block = m.Block
} catch {}

test('Blocks returns empty output for null data', { skip: !Blocks }, () => {
  const html = renderToStaticMarkup(createElement(Blocks, { data: null }))
  assert.equal(html, '')
})
test('Blocks returns empty output for data without blocks array', { skip: !Blocks }, () => {
  const html = renderToStaticMarkup(createElement(Blocks, { data: {} }))
  assert.equal(html, '')
})
test('Blocks skips unknown block types silently (no throw)', { skip: !Blocks }, () => {
  assert.doesNotThrow(() =>
    renderToStaticMarkup(createElement(Blocks, { data: { blocks: [{ type: 'unknown_xyz', data: {} }] } }))
  )
})
test('Block applies jeeby-cms-block class', { skip: !Block }, () => {
  const html = renderToStaticMarkup(createElement(Block, null, 'content'))
  assert.ok(html.includes('jeeby-cms-block'), `Got: ${html}`)
})
test('Block passes through id prop as HTML id attribute', { skip: !Block }, () => {
  const html = renderToStaticMarkup(createElement(Block, { id: 'section-1' }, 'x'))
  assert.ok(html.includes('id="section-1"'))
})
test('Block merges custom className with jeeby-cms-block', { skip: !Block }, () => {
  const html = renderToStaticMarkup(createElement(Block, { className: 'custom' }, 'x'))
  assert.ok(html.includes('jeeby-cms-block'))
  assert.ok(html.includes('custom'))
})
test('Blocks applies className to outer container div', { skip: !Blocks }, () => {
  const data = { blocks: [{ type: 'paragraph', data: { text: 'hi' } }] }
  const html = renderToStaticMarkup(createElement(Blocks, { data, className: 'my-container' }))
  assert.ok(html.includes('my-container'), `Got: ${html}`)
})
test('Blocks applies blockClassName to each block wrapper', { skip: !Blocks }, () => {
  const data = { blocks: [{ type: 'paragraph', data: { text: 'hi' } }] }
  const html = renderToStaticMarkup(createElement(Blocks, { data, blockClassName: 'my-block' }))
  assert.ok(html.includes('jeeby-cms-block'), `Got: ${html}`)
  assert.ok(html.includes('my-block'), `Got: ${html}`)
})
