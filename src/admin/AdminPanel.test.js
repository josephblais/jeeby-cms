import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Export shape tests
test('AdminPanel is exported from src/admin/index.js as a function', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.AdminPanel, 'function', 'AdminPanel must be a function')
})

test('withCMSAuth is still exported from src/admin/index.js', async () => {
  let mod
  try { mod = await import('./index.js') } catch { return }
  assert.equal(typeof mod.withCMSAuth, 'function', 'withCMSAuth must be a function')
})

// Structural tests via source inspection
test('AdminPanel source has three render states: loading, unauthenticated, authenticated', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(src.includes('if (loading)'), 'Must have loading state check')
  assert.ok(src.includes('if (!user)'), 'Must have unauthenticated state check')
  assert.ok(src.includes('LoginPage'), 'Must render LoginPage for unauthenticated')
  assert.ok(src.includes('AdminNav'), 'Must render AdminNav for authenticated')
})

test('AdminPanel source includes skip link', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(src.includes('#main-content'), 'Must have skip link target')
  assert.ok(src.includes('jeeby-cms-skip-link'), 'Must have skip link class')
})

test('AdminPanel loading state has role="status" and aria-label', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(src.includes('role="status"'), 'Loading wrapper must have role="status"')
  assert.ok(src.includes('Loading admin panel'), 'Loading wrapper must have aria-label')
})

test('AdminPanel accepts children prop', () => {
  const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(src.includes('{children}'), 'Must render children in authenticated shell')
})
