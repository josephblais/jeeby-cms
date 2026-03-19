import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./EditorHeader.js', import.meta.url), 'utf8')

test('EditorHeader has h1 element', () => {
  assert.ok(src.includes('<h1'), 'EditorHeader must have an h1 element')
})

test('EditorHeader has back link', () => {
  assert.ok(
    src.includes('Back to Pages') || src.includes('aria-label="Back to Pages"'),
    'EditorHeader must have a back link to Pages'
  )
})

test('Save status has role="status"', () => {
  assert.ok(src.includes('role="status"'), 'Save status must have role="status"')
})

test('Save status has aria-live with polite', () => {
  assert.ok(
    src.includes('aria-live="polite"') || src.includes("'polite'"),
    'Save status must have aria-live="polite" (or dynamic expression defaulting to polite)'
  )
})

test('Save status has aria-atomic="true"', () => {
  assert.ok(src.includes('aria-atomic="true"'), 'Save status must have aria-atomic="true"')
})

test('EditorHeader contains "Saving..." text', () => {
  assert.ok(src.includes('Saving...'), 'EditorHeader must include "Saving..." save status text')
})

test('EditorHeader contains "Saved" text', () => {
  assert.ok(src.includes('Saved'), 'EditorHeader must include "Saved" save status text')
})

test('EditorHeader contains "Save failed" text', () => {
  assert.ok(src.includes('Save failed'), 'EditorHeader must include "Save failed" save status text')
})

test('EditorHeader has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'EditorHeader must start with "use client"')
})

// Phase 7: Publish controls tests (Wave 0 — will fail until EditorHeader.js is extended in Plan 02)
test('EditorHeader accepts lastPublishedAt prop', () => {
  assert.ok(src.includes('lastPublishedAt'), 'EditorHeader must accept lastPublishedAt prop')
})

test('EditorHeader accepts hasDraftChanges prop', () => {
  assert.ok(src.includes('hasDraftChanges'), 'EditorHeader must accept hasDraftChanges prop')
})

test('EditorHeader accepts onPublish prop', () => {
  assert.ok(src.includes('onPublish'), 'EditorHeader must accept onPublish prop')
})

test('EditorHeader displays "Last published:" text', () => {
  assert.ok(src.includes('Last published:'), 'EditorHeader must display "Last published:" text')
})

test('EditorHeader displays "Unpublished changes" indicator', () => {
  assert.ok(src.includes('Unpublished changes'), 'EditorHeader must display "Unpublished changes" when hasDraftChanges is true')
})

test('EditorHeader has Publish button', () => {
  assert.ok(src.includes('Publish'), 'EditorHeader must have a Publish button')
})

test('EditorHeader has jeeby-cms-publish-controls class', () => {
  assert.ok(src.includes('jeeby-cms-publish-controls'), 'EditorHeader must have jeeby-cms-publish-controls wrapper')
})
