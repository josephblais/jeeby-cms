"use client"

import { useState, useRef } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { uploadFile } from '../../firebase/storage.js'
import { useCMSFirebase } from '../../index.js'

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

function GalleryItem({ item, index, items, blockId, onChange, data, storage }) {
  const controls = useDragControls()
  const [uploadProgress, setUploadProgress] = useState(null) // null | 0-100 | 'error'
  const fileInputRef = useRef(null)
  const pendingFileRef = useRef(null)

  async function handleItemUpload(file) {
    pendingFileRef.current = file
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
    setUploadProgress(0)
    try {
      const url = await uploadFile(storage, file, path, (pct) => setUploadProgress(pct))
      onChange({
        ...data,
        items: items.map((it, i) => i === index ? { ...it, src: url } : it),
      })
      setUploadProgress(null)
    } catch {
      setUploadProgress('error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleItemRetry() {
    if (pendingFileRef.current) handleItemUpload(pendingFileRef.current)
  }

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
          <div className="jeeby-cms-image-url-row">
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
            <button
              type="button"
              className="jeeby-cms-btn-ghost jeeby-cms-gallery-upload-btn"
              aria-label={uploadProgress !== null && uploadProgress !== 'error' ? 'Uploading item ' + (index + 1) + '...' : 'Upload image for item ' + (index + 1)}
              disabled={uploadProgress !== null && uploadProgress !== 'error'}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadProgress !== null && uploadProgress !== 'error' ? '...' : 'Upload'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleItemUpload(file)
            }}
          />
          {uploadProgress !== null && uploadProgress !== 'error' && (
            <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label={'Upload progress for item ' + (index + 1)}>
              <div className="jeeby-cms-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {uploadProgress === 'error' && (
            <div className="jeeby-cms-upload-error-row">
              <p role="alert" className="jeeby-cms-inline-error">Upload failed</p>
              <button type="button" className="jeeby-cms-btn-ghost" onClick={handleItemRetry}>Retry</button>
            </div>
          )}
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
  const { storage } = useCMSFirebase()
  const batchInputRef = useRef(null)
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

  async function handleBatchUpload(files) {
    const fileArray = Array.from(files)
    const results = await Promise.allSettled(
      fileArray.map(file => {
        const ext = file.name.split('.').pop().toLowerCase()
        const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
        return uploadFile(storage, file, path)
      })
    )
    const newItems = results
      .filter(r => r.status === 'fulfilled')
      .map(r => ({ src: r.value, alt: '', id: crypto.randomUUID() }))
    if (newItems.length > 0) {
      onChange({ ...data, items: [...items, ...newItems] })
    }
    if (batchInputRef.current) batchInputRef.current.value = ''
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
            storage={storage}
          />
        ))}
      </Reorder.Group>

      <div className="jeeby-cms-gallery-batch-row">
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
        <button
          type="button"
          className="jeeby-cms-btn-ghost jeeby-cms-gallery-batch-btn"
          onClick={() => batchInputRef.current?.click()}
        >Upload multiple</button>
      </div>
      <input
        ref={batchInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) handleBatchUpload(e.target.files)
        }}
      />
    </div>
  )
}

export default GalleryEditor
