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

test('EditorHeader contains saving state text', () => {
  assert.ok(src.includes('Saving'), 'EditorHeader must include save status text for saving state')
})

test('EditorHeader contains saved state text', () => {
  assert.ok(src.includes('saved') || src.includes('Saved'), 'EditorHeader must include saved state text')
})

test('EditorHeader contains error state text', () => {
  assert.ok(src.includes('Save failed'), 'EditorHeader must include "Save failed" error state text')
})

test('EditorHeader has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'EditorHeader must start with "use client"')
})

// Publish controls
test('EditorHeader accepts lastPublishedAt prop', () => {
  assert.ok(src.includes('lastPublishedAt'), 'EditorHeader must accept lastPublishedAt prop')
})

test('EditorHeader accepts hasDraftChanges prop', () => {
  assert.ok(src.includes('hasDraftChanges'), 'EditorHeader must accept hasDraftChanges prop')
})

test('EditorHeader accepts onPublish prop', () => {
  assert.ok(src.includes('onPublish'), 'EditorHeader must accept onPublish prop')
})

test('EditorHeader shows Published status for published pages', () => {
  assert.ok(src.includes('Published'), 'EditorHeader must display Published status')
})

test('EditorHeader shows unpublished changes status', () => {
  assert.ok(src.includes('Unpublished') || src.includes('Unsaved'), 'EditorHeader must display unpublished/unsaved status when hasDraftChanges is true')
})

test('EditorHeader has Publish button', () => {
  assert.ok(src.includes('Publish'), 'EditorHeader must have a Publish button')
})

test('EditorHeader has document status indicator', () => {
  assert.ok(src.includes('jeeby-cms-doc-status'), 'EditorHeader must have document status chip')
})
