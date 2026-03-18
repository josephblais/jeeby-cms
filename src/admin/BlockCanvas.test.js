import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./BlockCanvas.js', import.meta.url), 'utf8')

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
  assert.ok(/aria-label=.*Delete/.test(src), 'Delete button must have aria-label containing Delete')
})

test('Delete button has minHeight 44px', () => {
  assert.ok(
    src.includes("minHeight: '44px'") || src.includes('minHeight: 44'),
    'Delete button must have minHeight 44px for touch target'
  )
})

test('BlockCanvas has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'BlockCanvas must start with "use client"')
})
