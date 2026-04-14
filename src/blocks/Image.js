// src/blocks/Image.js
// ACCESSIBILITY: WCAG 1.1.1 (Non-text Content)
// Rules:
//   1. alt="" (empty string) for decorative images — NEVER omit the alt attribute entirely.
//      Missing alt causes screen readers to announce the filename. Empty alt signals decorative.
//   2. Use <figure>/<figcaption> when caption data is present.
//   3. Include width/height when available to prevent cumulative layout shift (CLS).
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway,
// so the dist output is correct.

import { createElement } from 'react'
import { resolveLocale } from '../utils/resolveLocale.js'

export function Image({ data, className, locale = 'en' }) {
  if (!data?.src) return null

  const alt = resolveLocale(data?.alt, locale)
  const caption = resolveLocale(data?.caption, locale)

  const imgProps = {
    src: data.src,
    alt,                           // empty string = decorative; never undefined/missing
    width: data?.width,
    height: data?.height,
  }

  if (caption) {
    return createElement('figure', { className },
      createElement('img', imgProps),
      createElement('figcaption', null, caption)
    )
  }

  return createElement('img', { ...imgProps, className })
}
