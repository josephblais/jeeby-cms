import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./GalleryEditor.js', import.meta.url), 'utf8')

test('GalleryEditor writes item.src (not item.url)', () => {
  assert.ok(
    src.includes('item.src') || src.includes('src:'),
    'GalleryEditor must write item.src field (not item.url)'
  )
})

test('GalleryEditor has aria-label="Gallery images" on items list', () => {
  assert.ok(src.includes('aria-label="Gallery images"'), 'Gallery items list must have aria-label="Gallery images"')
})

test('GalleryEditor has Add image button', () => {
  assert.ok(src.includes('Add image'), 'GalleryEditor must have an "Add image" button')
})

test('GalleryEditor has Remove button with aria-label', () => {
  assert.ok(src.includes('Remove gallery image'), 'GalleryEditor must have "Remove gallery image" aria-label on remove button')
})

test('GalleryEditor has alt text per item', () => {
  assert.ok(src.includes('Alt text for item'), 'GalleryEditor must have "Alt text for item" label per gallery item')
})

test('GalleryEditor has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'GalleryEditor must start with "use client"')
})

// ─── Upload feature stubs (Phase 09 — wave 0) ────────────────────────────────
// These tests define the upload contract. They FAIL until Plan 02 implements
// the upload feature in GalleryEditor.js.

test('GalleryEditor imports uploadFile from storage', () => {
  assert.ok(
    src.includes("from '../../firebase/storage.js'") || src.includes('uploadFile'),
    'GalleryEditor must import uploadFile'
  )
})

test('GalleryEditor imports useCMSFirebase', () => {
  assert.ok(src.includes('useCMSFirebase'), 'GalleryEditor must import useCMSFirebase hook')
})

test('GalleryEditor has per-item upload button', () => {
  assert.ok(
    src.includes('Upload image') || src.includes('jeeby-cms-gallery-upload-btn'),
    'GalleryItem must have per-item upload button'
  )
})

test('GalleryEditor has batch upload button', () => {
  assert.ok(
    src.includes('Upload multiple') || src.includes('jeeby-cms-gallery-batch-btn'),
    'GalleryEditor must have batch "Upload multiple" button'
  )
})

test('GalleryEditor has hidden file input for upload', () => {
  assert.ok(src.includes('type="file"'), 'GalleryEditor must have hidden file input')
})
