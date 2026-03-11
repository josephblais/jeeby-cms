// src/blocks/Gallery.js
// ACCESSIBILITY: WCAG 1.1.1 (Non-text Content), 1.3.1 (Info and Relationships)
// Rules:
//   1. Use <ul>/<li> — a gallery is a list of items; list semantics convey count and navigation.
//   2. aria-label="Gallery" on the <ul> — provides context when no visible heading precedes it.
//   3. Per-image alt: same empty-string-for-decorative rule as Image block.
//   4. <figure>/<figcaption> per item when caption is present.
//   5. No keyboard interaction needed in Phase 3 (static display, no lightbox).
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway.

import { createElement } from 'react'

export function Gallery({ data, className }) {
  const items = data?.items ?? []
  return createElement(
    'ul',
    {
      className: ['jeeby-cms-gallery', className].filter(Boolean).join(' '),
      'aria-label': 'Gallery',
      style: { listStyle: 'none', padding: 0, margin: 0 },
    },
    ...items.map((item, i) =>
      createElement(
        'li',
        { key: item.id ?? i },
        item.caption
          ? createElement('figure', null,
              createElement('img', { src: item.src, alt: item.alt ?? '', loading: 'lazy' }),
              createElement('figcaption', null, item.caption)
            )
          : createElement('img', { src: item.src, alt: item.alt ?? '', loading: 'lazy' })
      )
    )
  )
}
