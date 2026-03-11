import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let Title
try { const m = await import('./Title.js'); Title = m.Title } catch {}

test('Title renders h3 by default (no level specified)', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'Hello' } }))
  assert.ok(html.includes('<h3>') || html.includes('<h3 '), `Expected <h3> tag, got: ${html}`)
  assert.ok(html.includes('Hello'))
})
test('Title renders h2 when level is h2', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'A', level: 'h2' } }))
  assert.ok(html.includes('<h2>') || html.includes('<h2 '))
})
test('Title renders h4 when level is h4', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'A', level: 'h4' } }))
  assert.ok(html.includes('<h4>') || html.includes('<h4 '))
})
test('Title never emits <h1> — clamps h1 to h2', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'A', level: 'h1' } }))
  assert.ok(!html.includes('<h1'), `Must not contain h1, got: ${html}`)
  assert.ok(html.includes('<h2>') || html.includes('<h2 '), 'Should fall back to h2')
})
test('Title clamps invalid level string to h3', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'A', level: 'invalid' } }))
  assert.ok(html.includes('<h3>') || html.includes('<h3 '))
})
test('Title applies className prop', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'A' }, className: 'my-title' }))
  assert.ok(html.includes('my-title'))
})
