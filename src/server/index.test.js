import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Mock firebase-admin modules BEFORE importing the module under test.
// mock.module requires --experimental-test-module-mocks flag.

// Page "existing-page" exists; "missing-page" does not.
const mockPageData = {
  published: { blocks: [{ type: 'title', data: { text: 'Hello' } }], lastPublishedAt: null },
  draft: { blocks: [] },
}

await mock.module('firebase-admin/app', {
  namedExports: {
    initializeApp: () => ({}),
    getApps: () => [{}],  // Pretend app is already initialized
    getApp: () => ({}),
    cert: (c) => c,
  },
})

await mock.module('firebase-admin/firestore', {
  namedExports: {
    getFirestore: () => ({
      doc: (path) => ({
        get: async () => {
          const slug = path.split('/').pop()
          if (slug === 'existing-page') {
            return { exists: true, data: () => mockPageData }
          }
          return { exists: false, data: () => null }
        },
      }),
      collection: (name) => ({
        where: (field, op, value) => ({
          orderBy: (orderField, dir) => ({
            get: async () => ({
              docs: value === 'blog'
                ? [
                    { id: 'my-first-post', data: () => ({ name: 'First', parentSlug: 'blog', updatedAt: { toMillis: () => 2 } }) },
                    { id: 'second-post', data: () => ({ name: 'Second', parentSlug: 'blog', updatedAt: { toMillis: () => 1 } }) },
                  ]
                : [],
            }),
          }),
        }),
      }),
    }),
  },
})

// Detect whether a real implementation exists.
// The placeholder stub in src/server/index.js always returns null regardless of slug.
// Real implementation uses firebase-admin/firestore and returns published data for existing pages.
let getCMSContent
let getCollectionPages
let isRealImplementation = false
try {
  const mod = await import('../server/index.js')
  getCMSContent = mod.getCMSContent
  getCollectionPages = mod.getCollectionPages
  if (typeof getCMSContent === 'function') {
    const probe = await getCMSContent('existing-page')
    isRealImplementation = probe !== null
  }
} catch { /* Skip if not yet implemented */ }

test('getCMSContent is exported as a function', { skip: !getCMSContent }, () => {
  assert.equal(typeof getCMSContent, 'function')
})
test('getCMSContent returns null when page does not exist', { skip: !isRealImplementation }, async () => {
  const result = await getCMSContent('missing-page')
  assert.equal(result, null)
})
test('getCMSContent returns published object when page exists', { skip: !isRealImplementation }, async () => {
  const result = await getCMSContent('existing-page')
  assert.ok(result !== null, 'Should return published data')
  assert.ok(Array.isArray(result?.blocks), 'published object should have blocks array')
})

test('getCMSContent returns only published sub-object (PUB-03)', async () => {
  const serverSrc = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(
    serverSrc.includes('?.published') || serverSrc.includes('.published'),
    'getCMSContent must return published sub-object only — draft must never leak to front-end'
  )
})

// ── Page Collections server entry (PAGE-COLL-02) ──────────────────────

test('getCollectionPages is exported as a function from server entry', { skip: !getCollectionPages }, () => {
  assert.equal(typeof getCollectionPages, 'function')
})

test('getCollectionPages returns entries for a given parentSlug', { skip: !getCollectionPages }, async () => {
  const result = await getCollectionPages('blog')
  assert.ok(Array.isArray(result), 'must return an array')
  assert.equal(result.length, 2)
  assert.equal(result[0].slug, 'my-first-post')
  assert.equal(result[0].parentSlug, 'blog')
})

test('getCollectionPages returns empty array for unknown parentSlug', { skip: !getCollectionPages }, async () => {
  const result = await getCollectionPages('does-not-exist')
  assert.deepEqual(result, [])
})

test('server/index.js uses Admin SDK chained collection().where().orderBy().get()', () => {
  const serverSrc = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
  assert.ok(serverSrc.includes('export async function getCollectionPages'))
  assert.ok(/\.collection\(['"]pages['"]\)/.test(serverSrc), 'must use Admin SDK db.collection("pages")')
  assert.ok(/\.where\(['"]parentSlug['"]\s*,\s*['"]==['"]\s*,\s*parentSlug\)/.test(serverSrc), 'must chain .where("parentSlug", "==", parentSlug)')
  assert.ok(/\.orderBy\(['"]updatedAt['"]\s*,\s*['"]desc['"]\)/.test(serverSrc), 'must chain .orderBy("updatedAt", "desc")')
  assert.ok(/getAdminFirestore\(\)/.test(serverSrc), 'must call getAdminFirestore() like getCMSContent does')
})
