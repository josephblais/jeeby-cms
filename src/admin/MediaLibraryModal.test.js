import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./MediaLibraryModal.js', import.meta.url), 'utf8')

test('MediaLibraryModal uses ModalShell full card variant', () => {
  assert.ok(src.includes('cardClassName="jeeby-cms-modal-card--full"'), 'MediaLibraryModal should render in the full modal card layout')
})

test('MediaLibraryModal supports browse and select modes', () => {
  assert.ok(src.includes("mode = 'browse'"), 'MediaLibraryModal should default to browse mode')
  assert.ok(src.includes("select-single"), 'MediaLibraryModal should support single-select mode')
  assert.ok(src.includes("select-multi"), 'MediaLibraryModal should support multi-select mode')
})

test('MediaLibraryModal fetches paginated media', () => {
  assert.ok(src.includes('listMediaPaginated'), 'MediaLibraryModal should list media with pagination')
  assert.ok(src.includes('IntersectionObserver'), 'MediaLibraryModal should use a sentinel observer for infinite scroll')
})

test('MediaLibraryModal supports upload to metadata flow', () => {
  assert.ok(src.includes('uploadFile'), 'MediaLibraryModal should upload files')
  assert.ok(src.includes("state: 'pending-meta'"), 'MediaLibraryModal should transition to pending metadata state after upload')
  assert.ok(src.includes('Save to Library'), 'MediaLibraryModal should let users save uploaded media with metadata')
})

test('MediaLibraryModal persists metadata edits', () => {
  assert.ok(src.includes('addMediaItem'), 'MediaLibraryModal should save new media records')
  assert.ok(src.includes('updateMediaItem'), 'MediaLibraryModal should edit existing media metadata')
})

test('MediaLibraryModal has expanded detail state for browsing media', () => {
  assert.ok(src.includes('jeeby-cms-media-detail-panel'), 'MediaLibraryModal should render an expanded media detail panel in browse mode')
  assert.ok(src.includes('File URL'), 'MediaLibraryModal should show file URL metadata in detail state')
  assert.ok(src.includes('handleCopy'), 'MediaLibraryModal should provide copy-to-clipboard action')
})

test('MediaLibraryModal upload queue shows thumbnail, progress, and metadata form during upload', () => {
  assert.ok(src.includes('jeeby-cms-media-upload-queue'), 'MediaLibraryModal should render upload queue')
  assert.ok(src.includes('Uploading — ${Math.round(pending.progress)}%'), 'MediaLibraryModal should show per-upload progress status text')
  assert.ok(src.includes('handlePendingTitleChange'), 'MediaLibraryModal should update title/alt metadata while uploading')
  assert.ok(src.includes('altManuallyEdited'), 'MediaLibraryModal should stop title->alt sync after manual alt edit')
})

test('MediaLibraryModal blocks close when metadata is pending', () => {
  assert.ok(src.includes('closeGuardActive'), 'MediaLibraryModal should detect pending metadata')
  assert.ok(src.includes('Finish saving the upload details before closing.'), 'MediaLibraryModal should show a close guard message')
})
