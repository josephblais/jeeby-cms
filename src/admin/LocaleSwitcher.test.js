import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(__dirname, 'LocaleSwitcher.js'), 'utf8')

test('I18N-09: LocaleSwitcher renders a role="tablist" container', () => {
  assert.match(source, /role=["']tablist["']/, 'must use role="tablist"')
})

test('I18N-09: LocaleSwitcher renders two role="tab" buttons', () => {
  const matches = source.match(/role=["']tab["']/g) ?? []
  assert.equal(matches.length, 2, 'must render exactly two role="tab" elements')
})

test('I18N-10: LocaleSwitcher marks active locale with aria-selected', () => {
  assert.match(source, /aria-selected=\{locale === ['"]en['"]\}/, 'aria-selected for en tab')
  assert.match(source, /aria-selected=\{locale === ['"]fr['"]\}/, 'aria-selected for fr tab')
})

test('I18N-09: LocaleSwitcher supports keyboard navigation via onKeyDown', () => {
  assert.match(source, /onKeyDown/, 'must handle keyboard arrow navigation')
})
