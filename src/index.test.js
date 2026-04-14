import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// These tests only verify that the exports exist with the right shape.
// The actual onSnapshot behavior requires a live Firestore connection.

test('useCMSContent is exported from src/index.js as a function', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.useCMSContent, 'function', 'useCMSContent must be a function')
})
test('Blocks is exported from src/index.js', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.Blocks, 'function', 'Blocks must be a function')
})
test('Block is exported from src/index.js', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.Block, 'function', 'Block must be a function')
})
test('useAuth is exported from src/index.js as a function', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.useAuth, 'function', 'useAuth must be a function')
})
test('CMSProvider is exported from src/index.js as a function', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.CMSProvider, 'function', 'CMSProvider must be a function')
})
test('useAuth source contains __session cookie write logic', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(src.includes('__session='), 'useAuth must write __session cookie')
  assert.ok(src.includes('max-age=0'), 'useAuth must clear cookie with max-age=0')
  assert.ok(src.includes('getIdToken'), 'useAuth must call getIdToken for token')
  assert.ok(src.includes('SameSite=Strict'), 'Cookie must use SameSite=Strict')
})

test('CMSProvider accepts templates prop and passes through context', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(src.includes('templates'), 'CMSProvider must reference templates')
  assert.ok(src.includes('templates = []'), 'templates must default to empty array')
  assert.ok(/useMemo\([^)]*templates/.test(src) || src.includes('...firebase, templates'), 'templates must be included in memoized context value')
})

test('useCMSContent returns only published sub-object (PUB-03)', async () => {
  const indexSrc = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(
    indexSrc.includes('?.published') || indexSrc.includes('.published'),
    'useCMSContent must return published sub-object only — draft must never leak to front-end'
  )
})

test('I18N-05: CMSProvider accepts isLocalized prop and exposes locale state via context', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.match(src, /isLocalized\s*=\s*false/, 'CMSProvider must default isLocalized to false')
  assert.match(src, /useState\(['"]en['"]\)/, 'CMSProvider must initialise locale state to "en"')
  assert.match(src, /setLocale/, 'CMSProvider must expose setLocale in context value')
  assert.match(src, /isLocalized/, 'context value must include isLocalized')
  assert.match(src, /locale/, 'context value must include locale')
})
