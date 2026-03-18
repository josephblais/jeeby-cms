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
