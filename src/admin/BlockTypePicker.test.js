import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./BlockTypePicker.js', import.meta.url), 'utf8')

test('BlockTypePicker has role="listbox"', () => {
  assert.ok(src.includes('role="listbox"'), 'BlockTypePicker must have role="listbox"')
})

test('BlockTypePicker has aria-label="Choose block type"', () => {
  assert.ok(src.includes('aria-label="Choose block type"'), 'BlockTypePicker must have aria-label="Choose block type"')
})

test('BlockTypePicker lists all block type labels', () => {
  assert.ok(src.includes('Heading'), 'Must list Heading block type')
  assert.ok(src.includes('Text'), 'Must list Text block type')
  assert.ok(src.includes('Bullet List'), 'Must list Bullet List block type')
  assert.ok(src.includes('Numbered List'), 'Must list Numbered List block type')
  assert.ok(src.includes('Image'), 'Must list Image block type')
  assert.ok(src.includes('Video'), 'Must list Video block type')
  assert.ok(src.includes('Gallery'), 'Must list Gallery block type')
})

test('BlockTypePicker has role="option"', () => {
  assert.ok(src.includes('role="option"'), 'Each block type option must have role="option"')
})

test('BlockTypePicker handles Escape key', () => {
  assert.ok(src.includes('Escape'), 'BlockTypePicker must handle Escape key to close')
})

test('BlockTypePicker handles Enter key', () => {
  assert.ok(src.includes('Enter'), 'BlockTypePicker must handle Enter key to select')
})

test('BlockTypePicker handles ArrowDown key', () => {
  assert.ok(src.includes('ArrowDown'), 'BlockTypePicker must handle ArrowDown key navigation')
})
