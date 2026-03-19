"use client"

// GalleryEditor — ordered list of { src, alt } gallery items with add/remove controls.
// Props: { data: { items: Array<{ src, alt }> }, onChange, blockId }
//
// CRITICAL: writes item.src (NOT item.url) — matches Gallery.js front-end field schema.
// See RESEARCH.md Pitfall 5.
//
// ACCESSIBILITY: WCAG 1.1.1 (alt text per item), 1.3.1 (<ol> list semantics, aria-label),
//   2.1.1 (keyboard — all controls operable), 2.4.6 (descriptive aria-labels per item)
//   4.1.2 (labelled inputs, labelled remove buttons)

// Returns new items array with the given field updated at index.
function updateItem(items, index, field, value) {
  return items.map((item, i) => i === index ? { ...item, [field]: value } : item)
}

export function GalleryEditor({ data, onChange, blockId }) {
  const items = data?.items ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* <ol> communicates item count and order to screen readers (WCAG 1.3.1) */}
      <ol aria-label="Gallery images" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => (
          <li key={index} style={{
            display: 'flex', gap: '8px', alignItems: 'flex-start',
          }}>
            {item.src && (
              <img
                src={item.src}
                alt={item.alt || ''}
                className="jeeby-cms-gallery-preview"
              />
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Image URL — type="url" for correct virtual keyboard + browser validation */}
              <input
                id={index === 0 ? 'block-input-' + blockId : undefined}
                type="url"
                value={item.src ?? ''}
                aria-label={'Image URL for item ' + (index + 1)}
                placeholder="https://example.com/image.jpg"
                onChange={(e) => onChange({
                  ...data,
                  items: updateItem(items, index, 'src', e.target.value),
                })}
                style={{ width: '100%', minHeight: '44px' }}
              />
              {/* Alt text per item — WCAG 1.1.1: every non-decorative image needs alt */}
              <input
                type="text"
                value={item.alt ?? ''}
                aria-label={'Alt text for item ' + (index + 1)}
                placeholder="Describe the image"
                onChange={(e) => onChange({
                  ...data,
                  items: updateItem(items, index, 'alt', e.target.value),
                })}
                style={{ width: '100%', minHeight: '44px' }}
              />
            </div>
            {/* Remove button — labelled with item number so screen reader users know which item */}
            <button
              type="button"
              aria-label={'Remove gallery image ' + (index + 1)}
              onClick={() => onChange({
                ...data,
                items: items.filter((_, i) => i !== index),
              })}
              className="jeeby-cms-btn-ghost"
              style={{ minWidth: '44px', padding: 0 }}
            >×</button>
          </li>
        ))}
      </ol>

      {/* Add image — full-width button for discoverability */}
      <button
        type="button"
        className="jeeby-cms-btn-ghost"
        onClick={() => onChange({
          ...data,
          items: [...items, { src: '', alt: '' }],
        })}
        style={{ width: '100%' }}
      >+ Add image</button>
    </div>
  )
}

export default GalleryEditor
