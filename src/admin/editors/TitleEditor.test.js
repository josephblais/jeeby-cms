import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./TitleEditor.js', import.meta.url), 'utf8')

test('TitleEditor uses contentEditable', () => {
  assert.ok(src.includes('contentEditable'), 'TitleEditor must use contentEditable for text input')
})

test('TitleEditor has role="textbox"', () => {
  assert.ok(src.includes('role="textbox"'), 'TitleEditor contenteditable must have role="textbox"')
})

test('TitleEditor has aria-label="Title text"', () => {
  assert.ok(src.includes('aria-label="Title text"'), 'TitleEditor must have aria-label="Title text"')
})

test('TitleEditor has heading level select', () => {
  assert.ok(src.includes('<select'), 'TitleEditor must have a <select> for heading level')
})

test('Select has aria-label="Heading level"', () => {
  assert.ok(src.includes('aria-label="Heading level"'), 'Select must have aria-label="Heading level"')
})

test('TitleEditor has h2-h6 options', () => {
  assert.ok(src.includes("'h2'") && src.includes("'h6'"), 'TitleEditor must include h2 and h6 options')
})

test('TitleEditor writes data.text', () => {
  assert.ok(
    src.includes('data.text') || src.includes('text:'),
    'TitleEditor must write data.text field'
  )
})

test('TitleEditor writes data.level', () => {
  assert.ok(
    src.includes('data.level') || src.includes('level:'),
    'TitleEditor must write data.level field'
  )
})

test('TitleEditor has canvas font sizes for h2', () => {
  assert.ok(src.includes('28px'), 'TitleEditor must use 28px font size for h2 canvas fidelity')
})
