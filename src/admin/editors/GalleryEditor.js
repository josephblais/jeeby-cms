"use client"

import { Reorder, useDragControls } from 'framer-motion'

// GalleryEditor — ordered list of { src, alt } gallery items with add/remove/reorder controls.
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

function GalleryItem({ item, index, items, blockId, onChange, data }) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      as="li"
      style={{ listStyle: 'none' }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', paddingBottom: '8px' }}>
        {/* Drag handle — same pattern as BlockCanvas */}
        <button
          className="jeeby-cms-drag-handle"
          aria-label={'Drag to reorder gallery image ' + (index + 1)}
          aria-hidden="true"
          onPointerDown={(e) => { e.preventDefault(); controls.start(e) }}
          style={{ alignSelf: 'center' }}
        >⠿</button>

        {item.src && (
          <img
            src={item.src}
            alt={item.alt || ''}
            className="jeeby-cms-gallery-preview"
          />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

        <button
          type="button"
          aria-label={'Remove gallery image ' + (index + 1)}
          onClick={() => onChange({
            ...data,
            items: items.filter((_, i) => i !== index),
          })}
          className="jeeby-cms-btn-ghost"
          style={{ minWidth: '44px', padding: 0, alignSelf: 'center' }}
        >Remove</button>
      </div>
    </Reorder.Item>
  )
}

export function GalleryEditor({ data, onChange, blockId }) {
  const items = data?.items ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(newItems) => onChange({ ...data, items: newItems })}
        as="ol"
        aria-label="Gallery images"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {items.map((item, index) => (
          <GalleryItem
            key={item.src + index}
            item={item}
            index={index}
            items={items}
            blockId={blockId}
            onChange={onChange}
            data={data}
          />
        ))}
      </Reorder.Group>

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
