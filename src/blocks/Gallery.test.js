import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let Gallery
try { const m = await import('./Gallery.js'); Gallery = m.Gallery } catch {}

test('Gallery renders a <ul> container', { skip: !Gallery }, () => {
  const html = renderToStaticMarkup(createElement(Gallery, { data: { items: [] } }))
  assert.ok(html.includes('<ul'), `Must render ul, got: ${html}`)
})
test('Gallery renders aria-label="Gallery" on the ul', { skip: !Gallery }, () => {
  const html = renderToStaticMarkup(createElement(Gallery, { data: { items: [] } }))
  assert.ok(html.includes('aria-label="Gallery"'))
})
test('Gallery renders one <li> per item', { skip: !Gallery }, () => {
  const html = renderToStaticMarkup(createElement(Gallery, { data: { items: [{ src: '/a.jpg' }, { src: '/b.jpg' }] } }))
  assert.equal((html.match(/<li/g) ?? []).length, 2)
})
test('Gallery items each have alt attribute', { skip: !Gallery }, () => {
  const html = renderToStaticMarkup(createElement(Gallery, { data: { items: [{ src: '/a.jpg', alt: 'Cat' }, { src: '/b.jpg' }] } }))
  assert.ok(html.includes('alt="Cat"'))
  assert.ok(html.includes('alt=""'), 'Missing alt should default to empty string')
})
test('Gallery renders figcaption when item has caption', { skip: !Gallery }, () => {
  const html = renderToStaticMarkup(createElement(Gallery, { data: { items: [{ src: '/a.jpg', caption: 'Sunset' }] } }))
  assert.ok(html.includes('<figcaption>Sunset</figcaption>'))
})
test('Gallery applies className to ul', { skip: !Gallery }, () => {
  const html = renderToStaticMarkup(createElement(Gallery, { data: { items: [] }, className: 'my-gallery' }))
  assert.ok(html.includes('my-gallery'))
})
