import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let Image
try { const m = await import('./Image.js'); Image = m.Image } catch {}

test('Image renders img with empty alt when alt not provided (decorative)', { skip: !Image }, () => {
  const html = renderToStaticMarkup(createElement(Image, { data: { src: '/img.jpg' } }))
  assert.ok(html.includes('alt=""'), `Must include alt="" for decorative image, got: ${html}`)
})
test('Image renders img with provided alt text', { skip: !Image }, () => {
  const html = renderToStaticMarkup(createElement(Image, { data: { src: '/img.jpg', alt: 'A cat' } }))
  assert.ok(html.includes('alt="A cat"'))
})
test('Image always has alt attribute (never missing alt)', { skip: !Image }, () => {
  const html = renderToStaticMarkup(createElement(Image, { data: { src: '/img.jpg' } }))
  assert.ok(html.includes('alt='), 'alt attribute must always be present')
})
test('Image renders figure and figcaption when caption present', { skip: !Image }, () => {
  const html = renderToStaticMarkup(createElement(Image, { data: { src: '/img.jpg', caption: 'Sunset' } }))
  assert.ok(html.includes('<figure'), 'Should wrap in figure element')
  assert.ok(html.includes('<figcaption>Sunset</figcaption>'))
})
test('Image passes width and height attributes', { skip: !Image }, () => {
  const html = renderToStaticMarkup(createElement(Image, { data: { src: '/img.jpg', width: 800, height: 600 } }))
  assert.ok(html.includes('width="800"'))
  assert.ok(html.includes('height="600"'))
})
