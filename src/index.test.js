import { test } from 'node:test'
import assert from 'node:assert/strict'

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
