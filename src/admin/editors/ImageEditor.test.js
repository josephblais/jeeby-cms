import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./ImageEditor.js', import.meta.url), 'utf8')

test('ImageEditor writes data.src (not data.url)', () => {
  assert.ok(
    src.includes('data.src') || (src.includes('src:') && !src.includes('url:')),
    'ImageEditor must write data.src field (not data.url)'
  )
})

test('ImageEditor has alt text input', () => {
  assert.ok(
    src.includes('aria-label="Alt text"') || src.includes('Alt text'),
    'ImageEditor must have an alt text input'
  )
})

test('ImageEditor has image URL input', () => {
  assert.ok(
    src.includes('type="url"') || src.includes('Image URL'),
    'ImageEditor must have an image URL input'
  )
})

test('ImageEditor has alt hint text for screen readers', () => {
  assert.ok(
    src.includes('Describe the image for screen readers'),
    'ImageEditor must have hint text "Describe the image for screen readers"'
  )
})

test('ImageEditor shows img preview', () => {
  assert.ok(src.includes('<img'), 'ImageEditor must show an <img> preview element')
})

test('ImageEditor has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'ImageEditor must start with "use client"')
})

// ─── Upload feature stubs (Phase 09 — wave 0) ────────────────────────────────
// These tests define the upload contract. They FAIL until Plan 02 implements
// the upload feature in ImageEditor.js.

test('ImageEditor imports uploadFile from storage', () => {
  assert.ok(
    src.includes("from '../../firebase/storage.js'") || src.includes('uploadFile'),
    'ImageEditor must import uploadFile'
  )
})

test('ImageEditor imports useCMSFirebase', () => {
  assert.ok(src.includes('useCMSFirebase'), 'ImageEditor must import useCMSFirebase hook')
})

test('ImageEditor has upload button with accessible label', () => {
  assert.ok(
    src.includes('Upload image from device'),
    'ImageEditor must have upload button with aria-label "Upload image from device"'
  )
})

test('ImageEditor has hidden file input for upload', () => {
  assert.ok(
    src.includes('type="file"') && src.includes('accept='),
    'ImageEditor must have hidden file input with accept attribute'
  )
})

test('ImageEditor has upload progress bar', () => {
  assert.ok(
    src.includes('jeeby-cms-upload-progress'),
    'ImageEditor must have upload progress bar with class jeeby-cms-upload-progress'
  )
})

test('ImageEditor has role=alert on upload error', () => {
  assert.ok(src.includes('Upload failed'), 'ImageEditor must show upload error message')
})

test('ImageEditor has retry button for failed uploads', () => {
  assert.ok(src.includes('Retry'), 'ImageEditor must have Retry button for failed uploads')
})

test('ImageEditor integrates media library modal', () => {
  assert.ok(src.includes('MediaLibraryModal'), 'ImageEditor should import/use MediaLibraryModal')
  assert.ok(src.includes('mode="select-single"'), 'ImageEditor should open MediaLibraryModal in select-single mode')
  assert.ok(src.includes('Select image from media library'), 'ImageEditor should expose a Select from Library control')
})

test('ImageEditor supports alt conflict resolution', () => {
  assert.ok(src.includes('Resolve alt text conflict'), 'ImageEditor should show alt conflict prompt when needed')
  assert.ok(src.includes('Keep current alt text'), 'ImageEditor should let users keep block alt text')
  assert.ok(src.includes('Use library alt text'), 'ImageEditor should let users replace with library alt text')
})

test('ImageEditor supports saving uploaded image metadata to media library', () => {
  assert.ok(src.includes('Save uploaded image to Media Library'), 'ImageEditor should prompt for metadata after upload')
  assert.ok(src.includes('Save to Library'), 'ImageEditor should include Save to Library action')
  assert.ok(src.includes('addMediaItem'), 'ImageEditor should persist uploaded media metadata')
})
