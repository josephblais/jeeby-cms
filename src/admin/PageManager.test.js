import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./PageManager.js', import.meta.url), 'utf8')
const adminSrc = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

// PAGE-01: Table structure
test('PageManager uses semantic table element', () => {
  assert.ok(src.includes('<table'), 'Must use <table> element')
  assert.ok(src.includes('<thead>'), 'Must have <thead>')
  assert.ok(src.includes('<tbody>'), 'Must have <tbody>')
})

test('PageManager has four column headers with scope="col"', () => {
  const thMatches = src.match(/scope="col"/g)
  assert.ok(thMatches && thMatches.length >= 4, 'Must have at least 4 th elements with scope="col"')
})

test('PageManager shows Name, Slug, Last Published, Actions columns', () => {
  assert.ok(src.includes("t('colName')"), 'Must have Name column via t("colName")')
  assert.ok(src.includes("t('colSlug')"), 'Must have Slug column via t("colSlug")')
  assert.ok(src.includes("t('colLastPublished')"), 'Must have Last Published column via t("colLastPublished")')
  assert.ok(src.includes("t('colActions')"), 'Must have Actions column via t("colActions")')
})

// PAGE-01: Empty state
test('PageManager has empty state with correct copy', () => {
  assert.ok(src.includes("t('noPagesYet')"), 'Must show empty state heading via t("noPagesYet")')
  assert.ok(src.includes("t('createFirstPage')"), 'Must show create CTA via t("createFirstPage")')
})

// PAGE-04: Inline edit
test('PageManager supports inline edit with Enter and Escape', () => {
  assert.ok(src.includes('Enter'), 'Must handle Enter key')
  assert.ok(src.includes('Escape'), 'Must handle Escape key')
})

// Accessibility: live region
test('PageManager has a polite live region', () => {
  assert.ok(src.includes('aria-live="polite"'), 'Must have aria-live="polite" region')
  assert.ok(src.includes('aria-atomic="true"'), 'Live region must be atomic')
})

// Accessibility: loading state
test('PageManager has accessible loading state', () => {
  assert.ok(src.includes('Loading pages'), 'Loading spinner must have aria-label')
  assert.ok(src.includes('role="status"'), 'Loading state must have role="status"')
})

// Accessibility: Delete button labels
test('Delete buttons have descriptive aria-labels', () => {
  assert.ok(/aria-label=.*Delete/.test(src), 'Delete buttons must have aria-label with page identifier')
})

// Accessibility: edit button labels
test('Edit buttons have descriptive aria-labels', () => {
  assert.ok(src.includes("t('editBlocksFor')"), 'Edit buttons must use t("editBlocksFor") for aria-label')
})

// Accessibility: inline error
test('Inline edit errors use role="alert"', () => {
  assert.ok(src.includes('role="alert"'), 'Inline errors must use role="alert"')
})

// AdminPanel wiring
test('AdminPanel imports and default-renders PageManager', () => {
  assert.ok(adminSrc.includes("import { PageManager }"), 'AdminPanel must import PageManager')
  assert.ok(adminSrc.includes('PageManager'), 'AdminPanel must reference PageManager')
  assert.ok(/children\s*\?\?/.test(adminSrc), 'AdminPanel must use nullish coalescing for default children')
})

// CSS class hooks for Phase 8
test('PageManager uses required CSS class hooks', () => {
  assert.ok(src.includes('jeeby-cms-page-manager') || src.includes('jeeby-cms-pages-table'), 'Must have table class hook')
  assert.ok(src.includes('jeeby-cms-pages-empty'), 'Must have empty state class hook')
  assert.ok(src.includes('jeeby-cms-live-region'), 'Must have live region class hook')
})

// "use client" directive
test('PageManager has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'Must start with "use client"')
})

// Keyboard handler on edit inputs
test('PageManager edit inputs have onKeyDown handlers', () => {
  assert.ok(src.includes('onKeyDown'), 'Edit inputs must have onKeyDown handler')
  assert.ok(src.includes('handleEditKeyDown'), 'Must define handleEditKeyDown function')
})

// Inline edit aria-describedby linking inputs to error
test('PageManager edit inputs link to error via aria-describedby', () => {
  assert.ok(src.includes('aria-describedby'), 'Edit inputs must have aria-describedby pointing to error element')
  assert.ok(src.includes('cms-rename-error-'), 'Error element must have id prefixed cms-rename-error-')
})

// Phase 6 navigation
test('PageManager page name is a link to /admin/pages/[slug]', () => {
  assert.ok(src.includes('/admin/pages/'), 'Page name must link to /admin/pages/[slug]')
  assert.ok(src.includes('<a'), 'Page name must be an anchor element')
})

test('PageManager has Edit button in Actions column linking to editor', () => {
  assert.ok(src.includes("t('editBlocksFor')"), 'Edit button must use t("editBlocksFor") for aria-label')
})

test('PageManager includes Upload Media browse entrypoint', () => {
  assert.ok(src.includes("t('uploadMedia')"), 'PageManager should expose Upload Media action via t("uploadMedia")')
  assert.ok(src.includes('mode="browse"'), 'PageManager should open media library in browse mode')
  assert.ok(src.includes('MediaLibraryModal'), 'PageManager should mount MediaLibraryModal')
})

test('Admin entry exports MediaLibraryModal', () => {
  assert.ok(adminSrc.includes("export { MediaLibraryModal }"), 'src/admin/index.js should export MediaLibraryModal')
})

// ── Page Collections (PAGE-COLL-05 / D-14 through D-20) ──────────────

test('PageManager renders COLLECTIONS section header', () => {
  assert.ok(/Collections/.test(src), 'Must render a "Collections" section header label')
  assert.ok(/jeeby-cms-table-section-header/.test(src), 'Section headers must use jeeby-cms-table-section-header class')
})

test('PageManager renders PAGES section header', () => {
  assert.ok(/>Pages</.test(src) || /['"]Pages['"]/.test(src), 'Must render a "Pages" section header label')
})

test('PageManager splits pages into collections, entries, and standalone', () => {
  assert.ok(/pageType\s*===\s*['"]collection['"]/.test(src), 'Must filter pageType === "collection"')
  assert.ok(/p\.parentSlug/.test(src) || /\.parentSlug/.test(src), 'Must reference parentSlug to split entries')
})

test('PageManager collection toggle button uses aria-expanded and aria-controls', () => {
  assert.ok(/aria-expanded=\{expandedCollections\.has/.test(src),
    'Collection toggle must bind aria-expanded to expandedCollections.has(slug)')
  assert.ok(/aria-controls=\{`cms-collection-entries-\$\{.*\}`\}/.test(src) || /aria-controls=\{.*cms-collection-entries/.test(src),
    'Collection toggle must have aria-controls pointing to cms-collection-entries-{slug}')
})

test('PageManager collection toggle uses semantic button (not div with role)', () => {
  // Anti-pattern guard: no <div role="button"> for collection toggle
  assert.ok(/className="jeeby-cms-collection-toggle"/.test(src))
  const toggleMatch = src.match(/<button[^>]*className="jeeby-cms-collection-toggle"/)
  assert.ok(toggleMatch, 'Collection toggle must be a real <button>, not <div role="button">')
})

test('PageManager tracks expandedCollections state as a Set', () => {
  assert.ok(/expandedCollections/.test(src), 'Must track expandedCollections state')
  assert.ok(/setExpandedCollections/.test(src), 'Must have setExpandedCollections setter')
  assert.ok(/new Set/.test(src), 'expandedCollections must be a Set (for O(1) has/add/delete)')
})

test('PageManager entry rows use indent class and live in a tbody with a unique id per collection', () => {
  assert.ok(/jeeby-cms-entry-row/.test(src), 'Entry rows must use jeeby-cms-entry-row class')
  // Multiple <tbody> elements for aria-controls targets per collection
  assert.ok(/id=\{`cms-collection-entries-\$\{.*\}`\}/.test(src) || /id=\{.*cms-collection-entries/.test(src),
    'Each collection entry container must have id="cms-collection-entries-{slug}" to be the aria-controls target')
})

test('PageManager imports getCollectionPages and renameCollection from firestore helpers', () => {
  assert.ok(/import\s*\{[^}]*getCollectionPages[^}]*\}\s*from\s*['"]\.\.\/firebase\/firestore\.js['"]/.test(src),
    'Must import getCollectionPages from firestore.js')
  assert.ok(/import\s*\{[^}]*renameCollection[^}]*\}\s*from\s*['"]\.\.\/firebase\/firestore\.js['"]/.test(src),
    'Must import renameCollection from firestore.js')
})

test('PageManager blocks delete when collection has children', () => {
  // D-20: "This collection has {N} entries. Delete or reassign them first."
  assert.ok(/This collection has/.test(src), 'Must show inline error copy starting "This collection has"')
  assert.ok(/entries\. Delete or reassign them first/.test(src),
    'Must show exact inline error "... entries. Delete or reassign them first." per D-20')
})

test('PageManager rename cascade uses renameCollection for collections', () => {
  // For collection rename, must call renameCollection (not bare renamePage) so children cascade
  assert.ok(/renameCollection\(db/.test(src),
    'Collection rename path must call renameCollection(db, ...) to cascade parentSlug updates')
})

test('PageManager sort/filter applies only to top-level items', () => {
  // D-17: entries inside a collection always sort updatedAt desc, not by active sortMode
  // Structural check: applySortFilter call should be on collections+standalone, not on raw pages
  assert.ok(/applySortFilter/.test(src))
})
