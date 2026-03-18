import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./UndoToast.js', import.meta.url), 'utf8')

test('UndoToast has role="status"', () => {
  assert.ok(src.includes('role="status"'), 'UndoToast must have role="status"')
})

test('UndoToast has aria-live="polite"', () => {
  assert.ok(src.includes('aria-live="polite"'), 'UndoToast must have aria-live="polite"')
})

test('UndoToast has aria-atomic="true"', () => {
  assert.ok(src.includes('aria-atomic="true"'), 'UndoToast must have aria-atomic="true"')
})

test('UndoToast has "Undo delete" button text', () => {
  assert.ok(src.includes('Undo delete'), 'UndoToast must have "Undo delete" button text')
})

test('UndoToast has position fixed', () => {
  assert.ok(
    src.includes('position: ') && src.includes('fixed'),
    'UndoToast must use position fixed for overlay placement'
  )
})

test('UndoToast has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'UndoToast must start with "use client"')
})
