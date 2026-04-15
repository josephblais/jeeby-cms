import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./BlockTypePicker.js', import.meta.url), 'utf8')

test('BlockTypePicker has role="listbox"', () => {
  assert.ok(src.includes('role="listbox"'), 'BlockTypePicker must have role="listbox"')
})

test('BlockTypePicker has aria-label="Choose block type"', () => {
  assert.ok(src.includes("t('chooseBlockType')"), 'BlockTypePicker must set aria-label via t("chooseBlockType")')
})

test('BlockTypePicker lists all block type labels', () => {
  assert.ok(src.includes('blockTypeHeading'), 'Must reference Heading block labelKey')
  assert.ok(src.includes('blockTypeText'), 'Must reference Text block labelKey')
  assert.ok(src.includes('blockTypeBulletList'), 'Must reference Bullet List block labelKey')
  assert.ok(src.includes('blockTypeNumberedList'), 'Must reference Numbered List block labelKey')
  assert.ok(src.includes('blockTypeImage'), 'Must reference Image block labelKey')
  assert.ok(src.includes('blockTypeVideo'), 'Must reference Video block labelKey')
  assert.ok(src.includes('blockTypeGallery'), 'Must reference Gallery block labelKey')
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
