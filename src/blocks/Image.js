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

export function Image({ data, className }) {
  const imgProps = {
    src: data?.src,
    alt: data?.alt ?? '',          // empty string = decorative; never undefined/missing
    width: data?.width,
    height: data?.height,
  }

  if (data?.caption) {
    return createElement('figure', { className },
      createElement('img', imgProps),
      createElement('figcaption', null, data.caption)
    )
  }

  return createElement('img', { ...imgProps, className })
}
