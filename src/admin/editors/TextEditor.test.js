import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./TextEditor.js', import.meta.url), 'utf8')

test('TextEditor imports from @tiptap/react', () => {
  assert.ok(src.includes('@tiptap/react'), 'TextEditor must import from @tiptap/react')
})

test('TextEditor imports StarterKit', () => {
  assert.ok(
    src.includes('StarterKit') || src.includes('@tiptap/starter-kit'),
    'TextEditor must import StarterKit'
  )
})

test('TextEditor uses useEditor', () => {
  assert.ok(src.includes('useEditor'), 'TextEditor must use useEditor from @tiptap/react')
})

test('TextEditor uses EditorContent', () => {
  assert.ok(src.includes('EditorContent'), 'TextEditor must use EditorContent from @tiptap/react')
})

test('TextEditor writes data.html', () => {
  assert.ok(
    src.includes('data.html') || src.includes('.html') || src.includes('getHTML'),
    'TextEditor must write data.html (via getHTML or direct assignment)'
  )
})

test('TextEditor has aria-label="Text content"', () => {
  assert.ok(src.includes('aria-label="Text content"'), 'TextEditor must have aria-label="Text content"')
})

test('TextEditor has "use client" directive', () => {
  assert.ok(src.trimStart().startsWith('"use client"'), 'TextEditor must start with "use client"')
})
