import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let Video
try { const m = await import('./Video.js'); Video = m.Video } catch {}

test('Video converts YouTube watch URL to embed URL', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } }))
  assert.ok(html.includes('youtube.com/embed/dQw4w9WgXcQ'), `Got: ${html}`)
})
test('Video converts youtu.be short URL to embed URL', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://youtu.be/dQw4w9WgXcQ' } }))
  assert.ok(html.includes('youtube.com/embed/dQw4w9WgXcQ'))
})
test('Video converts Vimeo URL to embed URL', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://vimeo.com/123456789' } }))
  assert.ok(html.includes('player.vimeo.com/video/123456789'))
})
test('Video converts Loom share URL to embed URL', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://www.loom.com/share/abc123def456' } }))
  assert.ok(html.includes('loom.com/embed/abc123def456'))
})
test('Video iframe has non-empty title attribute (WCAG 4.1.2)', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://youtu.be/dQw4w9WgXcQ' } }))
  assert.match(html, /title="[^"]+"/,`iframe must have non-empty title, got: ${html}`)
})
test('Video uses block data title in iframe title', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://youtu.be/xxx', title: 'My Video' } }))
  assert.ok(html.includes('title="My Video"'))
})
test('Video falls back to "Embedded video" title when no title in data', { skip: !Video }, () => {
  const html = renderToStaticMarkup(createElement(Video, { data: { src: 'https://youtu.be/xxx' } }))
  assert.ok(html.includes('title="Embedded video"'))
})
