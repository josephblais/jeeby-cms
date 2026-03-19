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
  assert.ok(src.includes('Name'), 'Must have Name column')
  assert.ok(src.includes('Slug'), 'Must have Slug column')
  assert.ok(src.includes('Last Published'), 'Must have Last Published column')
  assert.ok(src.includes('Actions'), 'Must have Actions column')
})

// PAGE-01: Empty state
test('PageManager has empty state with correct copy', () => {
  assert.ok(src.includes('No pages yet.'), 'Must show empty state heading')
  assert.ok(src.includes('Create your first page'), 'Must show create CTA')
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
  assert.ok(/aria-label=.*Edit name/.test(src), 'Edit name buttons must have descriptive aria-label')
  assert.ok(/aria-label=.*Edit slug/.test(src), 'Edit slug buttons must have descriptive aria-label')
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
  assert.ok(/aria-label=.*Edit blocks/.test(src), 'Edit button must have aria-label describing action')
})
