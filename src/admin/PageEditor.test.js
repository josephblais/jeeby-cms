import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./PageEditor.js', import.meta.url), 'utf8')
const adminSrc = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

test('PageEditor is exported from src/admin/index.js', () => {
  assert.ok(adminSrc.includes('PageEditor'), 'PageEditor must be exported from admin index')
})

test('PageEditor imports getPage from firestore', () => {
  assert.ok(src.includes('getPage'), 'PageEditor must import getPage from firestore')
})

test('PageEditor imports saveDraft from firestore', () => {
  assert.ok(src.includes('saveDraft'), 'PageEditor must import saveDraft from firestore')
})

test('PageEditor uses useCMSFirebase', () => {
  assert.ok(src.includes('useCMSFirebase'), 'PageEditor must use useCMSFirebase hook')
})

test('PageEditor uses crypto.randomUUID for block IDs', () => {
  assert.ok(src.includes('crypto.randomUUID'), 'PageEditor must use crypto.randomUUID for block IDs')
})

test('PageEditor has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'PageEditor must start with "use client"')
})

test('PageEditor uses debounce pattern with clearTimeout and useRef', () => {
  assert.ok(src.includes('clearTimeout') && src.includes('useRef'), 'PageEditor must use clearTimeout + useRef debounce pattern')
})

test('Delete undo uses 5000ms timer', () => {
  assert.ok(src.includes('5000'), 'Undo delete timer must use 5000ms')
})

// Phase 7: Publish wiring tests (Wave 0 — will fail until PageEditor.js is extended in Plan 02)
test('PageEditor imports publishPage from firestore', () => {
  assert.ok(src.includes('publishPage'), 'PageEditor must import publishPage')
})

test('PageEditor has showPublishModal state', () => {
  assert.ok(src.includes('showPublishModal'), 'PageEditor must manage showPublishModal state')
})

test('PageEditor has handlePublish function', () => {
  assert.ok(src.includes('handlePublish'), 'PageEditor must define handlePublish function')
})

test('PageEditor tracks lastPublishedAt state', () => {
  assert.ok(src.includes('lastPublishedAt'), 'PageEditor must track lastPublishedAt in state')
})

test('PageEditor tracks hasDraftChanges state', () => {
  assert.ok(src.includes('hasDraftChanges'), 'PageEditor must track hasDraftChanges in state')
})

test('PageEditor imports PublishConfirmModal', () => {
  assert.ok(src.includes('PublishConfirmModal'), 'PageEditor must import PublishConfirmModal')
})

test('PageEditor imports PublishToast', () => {
  assert.ok(src.includes('PublishToast'), 'PageEditor must import PublishToast')
})
