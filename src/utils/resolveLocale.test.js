import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveLocale } from './resolveLocale.js'

test('I18N-01: resolveLocale returns plain string value unchanged', () => {
  assert.equal(resolveLocale('Hello', 'en'), 'Hello')
  assert.equal(resolveLocale('Hello', 'fr'), 'Hello')
})

test('I18N-02: resolveLocale returns the requested locale value from a locale object', () => {
  assert.equal(resolveLocale({ en: 'Hello', fr: 'Bonjour' }, 'fr'), 'Bonjour')
  assert.equal(resolveLocale({ en: 'Hello', fr: 'Bonjour' }, 'en'), 'Hello')
})

test('I18N-03: resolveLocale falls back to en when requested locale missing', () => {
  assert.equal(resolveLocale({ en: 'Hello' }, 'fr'), 'Hello')
  assert.equal(resolveLocale({ en: 'Hello', fr: '' }, 'fr'), 'Hello')
})

test('I18N-04: resolveLocale returns empty string for null/undefined', () => {
  assert.equal(resolveLocale(null), '')
  assert.equal(resolveLocale(undefined), '')
  assert.equal(resolveLocale({}, 'fr'), '')
})
