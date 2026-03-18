import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./AddBlockButton.js', import.meta.url), 'utf8')

test('AddBlockButton has aria-label="Add block"', () => {
  assert.ok(src.includes('aria-label="Add block"'), 'Button must have aria-label="Add block"')
})

test('AddBlockButton has aria-expanded', () => {
  assert.ok(src.includes('aria-expanded'), 'Button must have aria-expanded attribute')
})

test('AddBlockButton has aria-haspopup="listbox"', () => {
  assert.ok(src.includes('aria-haspopup="listbox"'), 'Button must have aria-haspopup="listbox"')
})

test('AddBlockButton uses type="button"', () => {
  assert.ok(src.includes('type="button"'), 'Button must have explicit type="button"')
})

test('AddBlockButton has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'AddBlockButton must start with "use client"')
})
