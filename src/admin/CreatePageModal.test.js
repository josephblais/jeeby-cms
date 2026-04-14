import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./CreatePageModal.js', import.meta.url), 'utf8')

test('CreatePageModal has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'Must start with "use client"')
})

test('CreatePageModal uses role="dialog" with aria-modal', () => {
  assert.ok(src.includes('role="dialog"'), 'Must have role="dialog"')
  assert.ok(src.includes('aria-modal="true"'), 'Must have aria-modal="true"')
})

test('CreatePageModal has aria-labelledby pointing to heading', () => {
  assert.ok(src.includes('aria-labelledby="create-modal-heading"'), 'Must reference heading id')
  assert.ok(src.includes('id="create-modal-heading"'), 'Heading must have matching id')
})

test('CreatePageModal heading text is "Create New Page"', () => {
  assert.ok(src.includes('Create New Page'), 'Heading must say "Create New Page"')
})

test('CreatePageModal has labeled form fields', () => {
  assert.ok(src.includes('htmlFor="cms-page-name"'), 'Name label must have htmlFor')
  assert.ok(src.includes('id="cms-page-name"'), 'Name input must have matching id')
  assert.ok(src.includes('htmlFor="cms-page-slug"'), 'Slug label must have htmlFor')
  assert.ok(src.includes('id="cms-page-slug"'), 'Slug input must have matching id')
})

test('CreatePageModal slug field has aria-describedby', () => {
  assert.ok(src.includes('aria-describedby'), 'Slug input must have aria-describedby')
  assert.ok(src.includes('cms-slug-hint'), 'Must reference slug hint id')
  assert.ok(src.includes('cms-slug-error'), 'Must reference slug error id')
})

test('CreatePageModal slug error uses role="alert"', () => {
  assert.ok(src.includes('role="alert"'), 'Slug error must use role="alert"')
})

test('CreatePageModal has hint text for slug', () => {
  assert.ok(src.includes('e.g. /about or /blog/my-post'), 'Must show slug hint text')
})

test('CreatePageModal template dropdown has label and placeholder', () => {
  assert.ok(src.includes('htmlFor="cms-page-template"'), 'Template label must have htmlFor')
  assert.ok(src.includes('id="cms-page-template"'), 'Template select must have matching id')
  assert.ok(src.includes('Select a template'), 'Must have placeholder option')
})

test('CreatePageModal hides template dropdown when no templates', () => {
  assert.ok(src.includes('templates.length'), 'Must check templates.length before rendering dropdown')
})

test('CreatePageModal has Escape key handler', () => {
  assert.ok(src.includes('Escape'), 'Must handle Escape key')
})

test('CreatePageModal has focus trap (Tab cycling)', () => {
  assert.ok(src.includes('Tab'), 'Must handle Tab key')
  assert.ok(src.includes('shiftKey'), 'Must handle Shift+Tab')
  assert.ok(/querySelectorAll|querySelector/.test(src), 'Must query focusable elements')
})

test('CreatePageModal buttons have correct text', () => {
  assert.ok(src.includes('Discard'), 'Cancel button must say "Discard"')
  assert.ok(src.includes('Create Page'), 'Submit button must say "Create Page"')
})

test('CreatePageModal validates slug uniqueness', () => {
  assert.ok(src.includes('already in use'), 'Must check for duplicate slugs')
})

test('CreatePageModal validates slug against template pattern', () => {
  assert.ok(src.includes('validateSlug'), 'Must call validateSlug')
  assert.ok(src.includes('does not match'), 'Must show pattern mismatch error')
})

test('CreatePageModal has disabled/busy state on submit button', () => {
  assert.ok(src.includes('aria-busy'), 'Submit button must have aria-busy')
  assert.ok(src.includes('disabled'), 'Submit button must be disabled while submitting')
})

// ── Page Collections (PAGE-COLL-04) ──────────────────────────────────

test('CreatePageModal has labeled page type selector', () => {
  assert.ok(src.includes('htmlFor="cms-page-type"'), 'Page type label must have htmlFor="cms-page-type"')
  assert.ok(src.includes('id="cms-page-type"'), 'Page type select must have matching id')
  assert.ok(/<option[^>]*value="page"/.test(src), 'Must have option value="page"')
  assert.ok(/<option[^>]*value="collection"/.test(src), 'Must have option value="collection"')
})

test('CreatePageModal tracks pageType state', () => {
  assert.ok(/pageType/.test(src), 'Component must track pageType state')
  assert.ok(/setPageType/.test(src), 'Component must have setPageType setter')
})

test('CreatePageModal has parent collection picker when type is page', () => {
  assert.ok(src.includes('htmlFor="cms-parent-collection"'), 'Parent collection label must have htmlFor')
  assert.ok(src.includes('id="cms-parent-collection"'), 'Parent collection select must have matching id')
  assert.ok(src.includes('None (top-level page)') || src.includes('None — top-level page'), 'Must have a "none" option for top-level pages')
})

test('CreatePageModal parent picker filters to collections only', () => {
  assert.ok(/pageType\s*===\s*['"]collection['"]/.test(src), 'Must filter by pageType === "collection" to populate picker')
})

test('CreatePageModal parent picker hidden when pageType is collection', () => {
  // The parent picker must be conditionally rendered based on pageType
  assert.ok(/pageType\s*===\s*['"]page['"]/.test(src) || /pageType\s*!==\s*['"]collection['"]/.test(src),
    'Parent picker must be conditionally rendered based on pageType (D-12)')
})

test('CreatePageModal shows locked prefix when parent selected', () => {
  assert.ok(src.includes('jeeby-cms-slug-prefixed'), 'Must have jeeby-cms-slug-prefixed wrapper class')
  assert.ok(src.includes('jeeby-cms-slug-prefix'), 'Must have jeeby-cms-slug-prefix span class for locked prefix')
  assert.ok(/aria-hidden="true"/.test(src), 'Prefix span must use aria-hidden="true" (prefix is visual only)')
})

test('CreatePageModal slug hint shows full derived path when parent selected', () => {
  // D-13: hint should show parentSlug/slug full path
  assert.ok(/Full path/.test(src) || /\$\{parentSlug\}\/\$\{slug/.test(src),
    'Slug hint must show derived full path when parent is selected')
})

test('CreatePageModal loads pages on open to populate parent picker', () => {
  // RESEARCH Pitfall 5: listPages must be called when modal opens, not only on submit
  const openEffectMatch = src.match(/useEffect\(\(\)\s*=>\s*\{[^}]*if\s*\(open\)[\s\S]*?\},\s*\[open\]\)/)
  assert.ok(openEffectMatch, 'Must have useEffect keyed on [open]')
  // listPages must appear somewhere in the open effect OR in a separate [open] effect
  assert.ok(src.includes('listPages(db)'), 'Must call listPages(db) to populate parent picker')
})

test('CreatePageModal uniqueness check uses full derived path (parentSlug/slug)', () => {
  // D-13: uniqueness must compare full paths, not bare slugs
  assert.ok(
    /parentSlug\s*\?\s*.*parentSlug.*\+.*['"]\/['"]\s*\+\s*.*slug/.test(src) ||
    /\$\{parentSlug\}\/\$\{slug\}/.test(src),
    'Uniqueness check must compose full path as parentSlug + "/" + slug',
  )
  // Existing check `p.slug === slug` alone is insufficient after this phase
  assert.ok(
    /p\.parentSlug/.test(src),
    'Uniqueness check must reference p.parentSlug to derive existing full paths',
  )
})

test('CreatePageModal savePage call includes pageType field', () => {
  assert.ok(/pageType:\s*pageType/.test(src) || /pageType,/.test(src),
    'savePage payload must include pageType field (D-03)')
})

test('CreatePageModal savePage sets isCollectionIndex for collection type', () => {
  assert.ok(/isCollectionIndex:\s*true/.test(src),
    'Collection pages must be saved with isCollectionIndex: true (D-04)')
})

test('CreatePageModal savePage sets parentSlug for entry pages', () => {
  assert.ok(/parentSlug:\s*parentSlug/.test(src) || /parentSlug\s*\|\|\s*null/.test(src),
    'Entry pages must be saved with parentSlug field (D-02)')
})
