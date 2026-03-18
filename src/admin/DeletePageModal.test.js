import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./DeletePageModal.js', import.meta.url), 'utf8')

test('DeletePageModal has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'Must start with "use client"')
})

test('DeletePageModal uses role="dialog" with aria-modal', () => {
  assert.ok(src.includes('role="dialog"'), 'Must have role="dialog"')
  assert.ok(src.includes('aria-modal="true"'), 'Must have aria-modal="true"')
})

test('DeletePageModal has aria-labelledby pointing to heading', () => {
  assert.ok(src.includes('aria-labelledby="delete-modal-heading"'), 'Must reference heading id')
  assert.ok(src.includes('id="delete-modal-heading"'), 'Heading must have matching id')
})

test('DeletePageModal heading text is "Delete page?"', () => {
  assert.ok(src.includes('Delete page?'), 'Heading must say "Delete page?"')
})

test('DeletePageModal shows confirmation text with slug', () => {
  assert.ok(src.includes('This cannot be undone'), 'Must warn about irreversibility')
})

test('DeletePageModal has correct button text', () => {
  assert.ok(src.includes('Keep Page'), 'Cancel button must say "Keep Page"')
  assert.ok(src.includes('Delete Page'), 'Confirm button must say "Delete Page"')
})

test('DeletePageModal confirm button uses destructive style', () => {
  assert.ok(src.includes('jeeby-cms-btn-destructive'), 'Must use destructive button class')
  assert.ok(src.includes('#DC2626'), 'Must use destructive red color')
})

test('DeletePageModal has Escape key handler', () => {
  assert.ok(src.includes('Escape'), 'Must handle Escape key')
})

test('DeletePageModal has focus trap (Tab cycling)', () => {
  assert.ok(src.includes('Tab'), 'Must handle Tab key')
  assert.ok(src.includes('shiftKey'), 'Must handle Shift+Tab')
})

test('DeletePageModal has disabled/busy state on confirm button', () => {
  assert.ok(src.includes('aria-busy'), 'Confirm button must have aria-busy')
  assert.ok(src.includes('disabled'), 'Confirm button must be disabled while deleting')
})

test('DeletePageModal calls deletePage', () => {
  assert.ok(src.includes('deletePage'), 'Must import and call deletePage')
})
