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

test('GalleryEditor supports saving uploaded gallery images to media library', () => {
  assert.ok(src.includes('addMediaItem'), 'GalleryEditor should import/use addMediaItem')
  assert.ok(src.includes('Add upload to Media Library'), 'GalleryEditor should show media-library metadata prompt for uploads')
  assert.ok(src.includes('Save to Library'), 'GalleryEditor should include Save to Library action')
})

test('GalleryEditor syncs metadata alt from gallery alt during upload until metadata alt is manually edited', () => {
  assert.ok(src.includes('handleGalleryAltChange'), 'GalleryEditor should define a gallery alt change handler')
  assert.ok(src.includes('altManuallyEdited'), 'GalleryEditor should track manual metadata alt edits')
  assert.ok(src.includes('if (isUploading)'), 'GalleryEditor should only live-sync during upload')
})

test('GalleryEditor copies metadata title to metadata alt unless alt is manually edited', () => {
  assert.ok(src.includes('handlePendingTitleChange'), 'GalleryEditor should handle metadata title changes')
  assert.ok(src.includes('alt: prev.altManuallyEdited ? prev.alt : nextTitle'), 'GalleryEditor should auto-copy title to alt unless manually overridden')
})

test('GalleryEditor updates item alt from locally saved metadata alt', () => {
  assert.ok(src.includes('items: items.map((it, i) => i === index ? { ...it, alt: trimmedAlt } : it)'), 'GalleryEditor should sync item alt from saved metadata alt without refetching')
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

test('GalleryEditor integrates media library in multi-select mode', () => {
  assert.ok(src.includes('MediaLibraryModal'), 'GalleryEditor should import/use MediaLibraryModal')
  assert.ok(src.includes('mode="select-multi"'), 'GalleryEditor should open media library in multi-select mode')
  assert.ok(src.includes('Add from library'), 'GalleryEditor should expose Add from library action')
})
