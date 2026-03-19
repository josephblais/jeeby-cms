import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

let src
try {
  src = readFileSync(new URL('./PublishToast.js', import.meta.url), 'utf8')
} catch {
  src = null
}

test('PublishToast source file exists', () => {
  assert.ok(src !== null, 'src/admin/PublishToast.js must exist')
})

test('PublishToast has "use client" directive', { skip: !src }, () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'Must start with "use client"')
})

test('PublishToast has role="status"', { skip: !src }, () => {
  assert.ok(src.includes('role="status"'), 'Toast must have role="status"')
})

test('PublishToast has aria-live="polite"', { skip: !src }, () => {
  assert.ok(src.includes('aria-live="polite"'), 'Toast must have aria-live="polite"')
})

test('PublishToast has aria-atomic="true"', { skip: !src }, () => {
  assert.ok(src.includes('aria-atomic="true"'), 'Toast must have aria-atomic="true"')
})

test('PublishToast uses CSS class for positioning', { skip: !src }, () => {
  assert.ok(src.includes('jeeby-cms-publish-toast'), 'Toast must use jeeby-cms-publish-toast class for fixed positioning')
})

test('PublishToast has jeeby-cms-publish-toast class for z-index', { skip: !src }, () => {
  assert.ok(src.includes('jeeby-cms-publish-toast'), 'Toast must use jeeby-cms-publish-toast class (z-index 200 in CSS)')
})

test('PublishToast displays success message', { skip: !src }, () => {
  assert.ok(src.includes('Page published successfully.'), 'Toast must display "Page published successfully."')
})

test('PublishToast has jeeby-cms-publish-toast class', { skip: !src }, () => {
  assert.ok(src.includes('jeeby-cms-publish-toast'), 'Toast must use jeeby-cms-publish-toast class name')
})
