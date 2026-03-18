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
