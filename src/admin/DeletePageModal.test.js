import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./DeletePageModal.js', import.meta.url), 'utf8')

test('DeletePageModal has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'Must start with "use client"')
})

test('DeletePageModal uses role="dialog" with aria-modal', () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which provides role="dialog" and aria-modal="true"')
})

test('DeletePageModal has aria-labelledby pointing to heading', () => {
  assert.ok(src.includes('labelId="delete-modal-heading"'), 'Must pass labelId to ModalShell')
  assert.ok(src.includes('id="delete-modal-heading"'), 'Heading must have matching id')
})

test('DeletePageModal heading text is "Delete page?"', () => {
  assert.ok(src.includes("t('deletePageTitle')"), 'Heading must use t("deletePageTitle")')
})

test('DeletePageModal shows confirmation text with slug', () => {
  assert.ok(src.includes("t('deletePageBody')"), 'Must warn about irreversibility via t("deletePageBody")')
})

test('DeletePageModal has correct button text', () => {
  assert.ok(src.includes("t('keepPage')"), 'Cancel button must use t("keepPage")')
  assert.ok(src.includes("t('deletePageAction')"), 'Confirm button must use t("deletePageAction")')
})

test('DeletePageModal confirm button uses destructive style', () => {
  assert.ok(src.includes('jeeby-cms-btn-destructive'), 'Must use destructive button class')
})

test('DeletePageModal has Escape key handler', () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which handles Escape key')
})

test('DeletePageModal has focus trap (Tab cycling)', () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which provides Tab focus trap')
})

test('DeletePageModal has disabled/busy state on confirm button', () => {
  assert.ok(src.includes('aria-busy'), 'Confirm button must have aria-busy')
  assert.ok(src.includes('disabled'), 'Confirm button must be disabled while deleting')
})

test('DeletePageModal calls deletePage', () => {
  assert.ok(src.includes('deletePage'), 'Must import and call deletePage')
})
