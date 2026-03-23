"use client"

import { useState, useRef } from 'react'
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
      <div className="jeeby-cms-gallery-item-row">
        {/* Drag handle — same pattern as BlockCanvas */}
        <button
          className="jeeby-cms-drag-handle"
          aria-label={'Drag to reorder gallery image ' + (index + 1)}
          aria-hidden="true"
          onPointerDown={(e) => { e.preventDefault(); controls.start(e) }}
        >⠿</button>

        {item.src && (
          <img
            src={item.src}
            alt={item.alt || ''}
            className="jeeby-cms-gallery-preview"
          />
        )}

        <div className="jeeby-cms-gallery-item-inputs">
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
          />
        </div>

        <button
          type="button"
          aria-label={'Remove gallery image ' + (index + 1)}
          onClick={() => onChange({
            ...data,
            items: items.filter((_, i) => i !== index),
          })}
          className="jeeby-cms-btn-ghost jeeby-cms-gallery-remove-btn"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  )
}

export function GalleryEditor({ data, onChange, blockId }) {
  const items = data?.items ?? []
  // Skip view mode entirely when there are no items — nothing to preview, so the
  // click-to-enter step is pure friction. Start in edit mode immediately.
  const [isEditing, setIsEditing] = useState(items.length === 0)
  const containerRef = useRef(null)
  const addButtonRef = useRef(null)
  // Entering edit mode unmounts the focused view div, whose blur fires before any
  // child of the edit container is focused. Suppress that one spurious blur so the
  // edit mode doesn't immediately close itself.
  const suppressNextBlur = useRef(false)

  function handleContainerBlur() {
    if (suppressNextBlur.current) {
      suppressNextBlur.current = false
      return
    }
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsEditing(false)
      }
    }, 0)
  }

  // View mode — thumbnail strip, click to edit
  if (!isEditing) {
    const itemsWithSrc = items.filter(item => item.src)
    return (
      <div
        ref={containerRef}
        className="jeeby-cms-gallery-view"
        role="button"
        tabIndex={0}
        id={'block-input-' + blockId}
        aria-label={'Gallery — ' + items.length + ' image' + (items.length !== 1 ? 's' : '') + '. Click to edit'}
        onClick={() => { suppressNextBlur.current = true; setIsEditing(true); requestAnimationFrame(() => addButtonRef.current?.focus()) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); suppressNextBlur.current = true; setIsEditing(true); requestAnimationFrame(() => addButtonRef.current?.focus()) } }}
      >
        {itemsWithSrc.length > 0 ? (
          <div className="jeeby-cms-gallery-thumb-strip">
            {itemsWithSrc.map((item, i) => (
              <img key={i} src={item.src} alt={item.alt || ''} className="jeeby-cms-gallery-thumb" />
            ))}
          </div>
        ) : (
          <p className="jeeby-cms-gallery-empty-hint">
            {items.length > 0 ? 'Gallery — click to add image URLs' : 'Empty gallery — click to add images'}
          </p>
        )}
      </div>
    )
  }

  // Edit mode — full controls with blur-to-dismiss
  return (
    <div ref={containerRef} onBlur={handleContainerBlur} className="jeeby-cms-gallery-editor">
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
            key={item.id ?? item.src + '-' + index}
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
        ref={addButtonRef}
        id={items.length === 0 ? 'block-input-' + blockId : undefined}
        type="button"
        className="jeeby-cms-btn-ghost jeeby-cms-gallery-add-btn"
        onClick={() => onChange({
          ...data,
          items: [...items, { src: '', alt: '', id: crypto.randomUUID() }],
        })}
      >+ Add image</button>
    </div>
  )
}

export default GalleryEditor
