import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

let src
try {
  src = readFileSync(new URL('./PublishConfirmModal.js', import.meta.url), 'utf8')
} catch {
  src = null
}

test('PublishConfirmModal source file exists', () => {
  assert.ok(src !== null, 'src/admin/PublishConfirmModal.js must exist')
})

test('PublishConfirmModal has "use client" directive', { skip: !src }, () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'Must start with "use client"')
})

test('PublishConfirmModal has role="dialog"', { skip: !src }, () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which provides role="dialog"')
})

test('PublishConfirmModal has aria-modal="true"', { skip: !src }, () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which provides aria-modal="true"')
})

test('PublishConfirmModal has aria-labelledby pointing to heading', { skip: !src }, () => {
  assert.ok(src.includes('labelId="publish-modal-heading"'), 'Must pass labelId to ModalShell')
})

test('PublishConfirmModal has h2 with publish-modal-heading id', { skip: !src }, () => {
  assert.ok(src.includes('id="publish-modal-heading"'), 'Heading must have id="publish-modal-heading"')
})

test('PublishConfirmModal has Escape key handler', { skip: !src }, () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which handles Escape key')
})

test('PublishConfirmModal has Tab key focus trap', { skip: !src }, () => {
  assert.ok(src.includes('ModalShell'), 'Must use ModalShell which provides Tab focus trap')
})

test('PublishConfirmModal has "Cancel" button text', { skip: !src }, () => {
  assert.ok(src.includes("t('cancel')"), 'Modal must have Cancel button via t("cancel")')
})

test('PublishConfirmModal has "Publish now" button text', { skip: !src }, () => {
  assert.ok(src.includes("t('publishNow')"), 'Modal must have Publish button via t("publishNow")')
})

test('PublishConfirmModal has error state with role="alert"', { skip: !src }, () => {
  assert.ok(src.includes('role="alert"'), 'Error message must have role="alert"')
})

test('PublishConfirmModal has triggerRef for focus return', { skip: !src }, () => {
  assert.ok(src.includes('triggerRef'), 'Modal must accept triggerRef for focus return')
})

test('PublishConfirmModal displays confirmation body copy', { skip: !src }, () => {
  assert.ok(
    src.includes("t('publishConfirmBody')"),
    'Modal must include confirmation body via t("publishConfirmBody")'
  )
})
