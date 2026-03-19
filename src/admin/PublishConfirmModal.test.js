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
  assert.ok(src.includes('role="dialog"'), 'Modal must have role="dialog"')
})

test('PublishConfirmModal has aria-modal="true"', { skip: !src }, () => {
  assert.ok(src.includes('aria-modal="true"'), 'Modal must have aria-modal="true"')
})

test('PublishConfirmModal has aria-labelledby pointing to heading', { skip: !src }, () => {
  assert.ok(src.includes('aria-labelledby="publish-modal-heading"'), 'Modal must reference heading id')
})

test('PublishConfirmModal has h2 with publish-modal-heading id', { skip: !src }, () => {
  assert.ok(src.includes('id="publish-modal-heading"'), 'Heading must have id="publish-modal-heading"')
})

test('PublishConfirmModal has Escape key handler', { skip: !src }, () => {
  assert.ok(src.includes("'Escape'") || src.includes('"Escape"'), 'Modal must handle Escape key')
})

test('PublishConfirmModal has Tab key focus trap', { skip: !src }, () => {
  assert.ok(src.includes("'Tab'") || src.includes('"Tab"'), 'Modal must trap Tab key')
})

test('PublishConfirmModal has "Cancel" button text', { skip: !src }, () => {
  assert.ok(src.includes('Cancel'), 'Modal must have Cancel button')
})

test('PublishConfirmModal has "Publish now" button text', { skip: !src }, () => {
  assert.ok(src.includes('Publish now'), 'Modal must have "Publish now" confirm button')
})

test('PublishConfirmModal has error state with role="alert"', { skip: !src }, () => {
  assert.ok(src.includes('role="alert"'), 'Error message must have role="alert"')
})

test('PublishConfirmModal has triggerRef for focus return', { skip: !src }, () => {
  assert.ok(src.includes('triggerRef'), 'Modal must accept triggerRef for focus return')
})

test('PublishConfirmModal displays confirmation body copy', { skip: !src }, () => {
  assert.ok(
    src.includes('This will replace the current live version'),
    'Modal must include the locked confirmation body copy'
  )
})
