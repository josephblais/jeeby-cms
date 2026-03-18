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
