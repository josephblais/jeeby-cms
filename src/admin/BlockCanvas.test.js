import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./BlockCanvas.js', import.meta.url), 'utf8')
const gutterSrc = readFileSync(new URL('./BlockGutter.js', import.meta.url), 'utf8')

test('BlockCanvas uses Reorder.Group', () => {
  assert.ok(src.includes('Reorder.Group'), 'BlockCanvas must use Reorder.Group from framer-motion')
})

test('Reorder.Group has aria-label="Page blocks"', () => {
  assert.ok(src.includes('aria-label="Page blocks"'), 'Reorder.Group must have aria-label="Page blocks"')
})

test('BlockCanvas uses Reorder.Item', () => {
  assert.ok(src.includes('Reorder.Item'), 'BlockCanvas must use Reorder.Item from framer-motion')
})

test('BlockCanvas sets dragListener={false}', () => {
  assert.ok(src.includes('dragListener={false}'), 'Reorder.Item must have dragListener={false}')
})

test('BlockCanvas uses useDragControls', () => {
  assert.ok(src.includes('useDragControls'), 'BlockCanvas must use useDragControls from framer-motion')
})

test('BlockCard uses article element', () => {
  assert.ok(src.includes('<article'), 'BlockCard must use <article> element')
})

test('Article has aria-label with block type', () => {
  assert.ok(/aria-label=.*block/.test(src), 'Article element must have aria-label referencing block type')
})

test('Drag handle has aria-hidden="true"', () => {
  assert.ok(src.includes('aria-hidden="true"'), 'Drag handle must have aria-hidden="true"')
})

test('Delete button has aria-label with Delete', () => {
  assert.ok(gutterSrc.includes("t('deleteBlockAriaLabel')"), 'Delete button must set aria-label via t("deleteBlockAriaLabel")')
})

test('Delete button has 44px touch target (CSS class or inline)', () => {
  // Touch target provided by CSS class or inline style
  assert.ok(
    gutterSrc.includes('jeeby-cms-block-delete-btn') || gutterSrc.includes('jeeby-cms-btn-ghost') || gutterSrc.includes("minHeight: '44px'"),
    'Delete button must have a touch target CSS class or inline style'
  )
})

test('BlockCanvas has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'BlockCanvas must start with "use client"')
})
