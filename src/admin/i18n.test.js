import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ADMIN_STRINGS } from './i18n.js'

test('I18N-08: ADMIN_STRINGS has en and fr locale maps', () => {
  assert.ok(ADMIN_STRINGS.en, 'ADMIN_STRINGS.en must exist')
  assert.ok(ADMIN_STRINGS.fr, 'ADMIN_STRINGS.fr must exist')
})

test('I18N-08: ADMIN_STRINGS.en and ADMIN_STRINGS.fr have identical key sets', () => {
  const enKeys = Object.keys(ADMIN_STRINGS.en).sort()
  const frKeys = Object.keys(ADMIN_STRINGS.fr).sort()
  assert.deepEqual(enKeys, frKeys, 'EN and FR key sets must match to prevent missing translations')
  assert.ok(enKeys.length >= 10, 'ADMIN_STRINGS.en must contain at least 10 translated strings')
})
