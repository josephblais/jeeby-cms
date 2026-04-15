import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./VideoEditor.js', import.meta.url), 'utf8')

test('VideoEditor imports or uses toEmbedUrl', () => {
  assert.ok(src.includes('toEmbedUrl'), 'VideoEditor must use toEmbedUrl for URL conversion')
})

test('VideoEditor has iframe preview', () => {
  assert.ok(
    src.includes('<iframe') || src.includes('iframe'),
    'VideoEditor must have an iframe for video preview'
  )
})

test('VideoEditor has video URL input', () => {
  assert.ok(src.includes('videoUrlLabel') || src.includes('Video URL'), 'VideoEditor must use videoUrlLabel i18n key')
})

test('VideoEditor has video URL hint text', () => {
  assert.ok(
    src.includes('videoUrlHint') || src.includes('YouTube, Vimeo, or Loom'),
    'VideoEditor must use videoUrlHint i18n key'
  )
})

test('VideoEditor has invalid URL error text', () => {
  assert.ok(
    src.includes('videoUnrecognised') || src.includes('Unrecognised video URL'),
    'VideoEditor must use videoUnrecognised i18n key'
  )
})

test('VideoEditor has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'VideoEditor must start with "use client"')
})
