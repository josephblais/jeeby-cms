"use client"

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { uploadFile, validateImageFile, MIME_TO_EXT } from '../../firebase/storage.js'
import { useCMSFirebase } from '../../index.js'
import { MediaLibraryModal } from '../MediaLibraryModal.js'

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

// Runs async factory functions with at most `limit` in flight simultaneously.
// Returns a Promise.allSettled-shaped array of { status, value | reason } objects.
async function withConcurrency(factories, limit = 3) {
  const results = []
  for (let i = 0; i < factories.length; i += limit) {
    const batch = await Promise.allSettled(factories.slice(i, i + limit).map(fn => fn()))
    results.push(...batch)
  }
  return results
}

// Memoized — prevents re-renders during concurrent upload progress ticks.
// onUploadStart/onUploadEnd must be stabilized with useCallback in the parent.
const GalleryItem = memo(function GalleryItem({ item, index, items, blockId, onChange, data, storage, filePickerOpen, onUploadStart, onUploadEnd }) {
  const controls = useDragControls()
  // null | 0–100 (uploading) | { message: string, retryable: boolean } (error/validation fail)
  const [uploadProgress, setUploadProgress] = useState(null)
  const isUploading = typeof uploadProgress === 'number'
  const uploadError  = uploadProgress !== null && !isUploading ? uploadProgress : null
  const fileInputRef = useRef(null)
  const pendingFileRef = useRef(null)
  // Local blob preview shown immediately after file selection.
  // Never written to item.src — only used as a display source.
  const [previewSrc, setPreviewSrc] = useState(null)
  const uploadCancelRef = useRef(null)
  const [imgLoadError, setImgLoadError] = useState(false)

  // Revoke the blob URL after React renders without it.
  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc) }
  }, [previewSrc])

  // Reset img error when the source changes (user corrected the URL).
  useEffect(() => { setImgLoadError(false) }, [item.src])

  // Cancel any in-flight upload when the item unmounts.
  useEffect(() => {
    return () => { uploadCancelRef.current?.() }
  }, [])

  const displaySrc = previewSrc ?? item.src

  async function handleItemUpload(file) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setUploadProgress({ message: validationError, retryable: false })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    onUploadStart?.()
    pendingFileRef.current = file
    const previewUrl = URL.createObjectURL(file)
    setPreviewSrc(previewUrl)
    setUploadProgress(0)
    try {
      const ext = file.name.includes('.')
        ? file.name.split('.').pop().toLowerCase()
        : (MIME_TO_EXT[file.type] ?? 'jpg')
      const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
      const url = await uploadFile(storage, file, path, (pct) => setUploadProgress(pct), uploadCancelRef)
      onChange({
        ...data,
        items: items.map((it, i) => i === index ? { ...it, src: url } : it),
      })
      setUploadProgress(null)
    } catch (err) {
      if (err.code === 'storage/canceled') return
      console.error('[jeeby-cms] Gallery item upload failed:', err)
      setUploadProgress({ message: 'Upload failed — check your connection and try again.', retryable: true })
    } finally {
      setPreviewSrc(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploadEnd?.()
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

        {displaySrc && !imgLoadError && (
          <img
            src={displaySrc}
            alt={item.alt || ''}
            className="jeeby-cms-gallery-preview"
            onError={() => setImgLoadError(true)}
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
              onBlur={(e) => { const v = e.target.value.trim(); if (v !== e.target.value) onChange({ ...data, items: updateItem(items, index, 'src', v) }) }}
            />
            <span className="jeeby-cms-image-url-or" aria-hidden="true">or</span>
            <button
              type="button"
              className="jeeby-cms-btn-ghost jeeby-cms-gallery-upload-btn"
              aria-label={isUploading ? 'Uploading item ' + (index + 1) + '…' : 'Upload image for item ' + (index + 1)}
              disabled={isUploading}
              onClick={() => { if (filePickerOpen) filePickerOpen.current = true; fileInputRef.current?.click() }}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
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
              if (filePickerOpen) filePickerOpen.current = false
              const file = e.target.files?.[0]
              if (file) handleItemUpload(file)
            }}
            onCancel={() => { if (filePickerOpen) filePickerOpen.current = false }}
          />
          {isUploading && (
            <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={Math.round(uploadProgress)} aria-valuemin={0} aria-valuemax={100} aria-label={'Upload progress for item ' + (index + 1)}>
              <div className="jeeby-cms-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {uploadError && (
            <div className="jeeby-cms-upload-error-row">
              <p role="alert" className="jeeby-cms-inline-error">{uploadError.message}</p>
              {uploadError.retryable && (
                <button type="button" className="jeeby-cms-btn-ghost" onClick={handleItemRetry}>Retry</button>
              )}
            </div>
          )}
          <div className="jeeby-cms-upload-status" aria-live="polite">
            {isUploading ? `Uploading — ${Math.round(uploadProgress)}%` : null}
          </div>
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
})

export function GalleryEditor({ data, onChange, blockId }) {
  const items = data?.items ?? []
  // Skip view mode entirely when there are no items — nothing to preview, so the
  // click-to-enter step is pure friction. Start in edit mode immediately.
  const [isEditing, setIsEditing] = useState(items.length === 0)
  const containerRef = useRef(null)
  const addButtonRef = useRef(null)
  const { storage } = useCMSFirebase()
  const batchInputRef = useRef(null)
  const filePickerOpen = useRef(false)
  // Counter tracking concurrent in-progress item uploads. When an upload starts,
  // the upload button becomes disabled and the browser moves focus to body. Without
  // this guard, that focus move triggers blur → setIsEditing(false).
  // A counter (not a boolean) handles multiple simultaneous uploads correctly.
  const uploadCountRef = useRef(0)
  // Entering edit mode unmounts the focused view div, whose blur fires before any
  // child of the edit container is focused. Suppress that one spurious blur so the
  // edit mode doesn't immediately close itself.
  const suppressNextBlur = useRef(false)
  const libraryTriggerRef = useRef(null)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const [batchError, setBatchError] = useState(null)
  // Mirrors uploadCountRef for reactive UI — keeps Done button disabled while
  // any item upload is in flight (closing edit mode would cancel them via cleanup).
  const [activeUploads, setActiveUploads] = useState(0)

  // Stable references required for GalleryItem memo to skip re-renders during
  // upload progress ticks. Deps are empty — both use only refs and setState updaters.
  const handleUploadStart = useCallback(() => { uploadCountRef.current++; setActiveUploads(c => c + 1) }, [])
  const handleUploadEnd   = useCallback(() => { uploadCountRef.current--; setActiveUploads(c => c - 1) }, [])

  function handleContainerBlur() {
    if (suppressNextBlur.current) {
      suppressNextBlur.current = false
      return
    }
    if (filePickerOpen.current || uploadCountRef.current > 0) return
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsEditing(false)
      }
    }, 0)
  }

  async function handleBatchUpload(files) {
    setBatchError(null)
    const fileArray = Array.from(files)
    const valid = fileArray.filter(f => !validateImageFile(f))
    const invalidCount = fileArray.length - valid.length

    if (valid.length === 0) {
      setBatchError('No valid images — only JPEG, PNG, GIF, and WebP under 10 MB are supported.')
      if (batchInputRef.current) batchInputRef.current.value = ''
      filePickerOpen.current = false
      return
    }

    try {
      // Limit to 3 concurrent uploads to avoid saturating the connection on
      // large selections. withConcurrency processes files in waves of 3.
      const results = await withConcurrency(
        valid.map(file => () => {
          const ext = file.name.includes('.')
            ? file.name.split('.').pop().toLowerCase()
            : (MIME_TO_EXT[file.type] ?? 'jpg')
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
      const totalFailed = invalidCount + results.filter(r => r.status === 'rejected').length
      if (totalFailed > 0) {
        setBatchError(`${totalFailed} file${totalFailed !== 1 ? 's' : ''} could not be uploaded.`)
      }
    } catch (err) {
      console.error('[jeeby-cms] Batch upload failed:', err)
      setBatchError('Upload failed — check your connection and try again.')
    } finally {
      if (batchInputRef.current) batchInputRef.current.value = ''
      filePickerOpen.current = false
    }
  }

  function handleLibrarySelect(selectedItems) {
    const picked = Array.isArray(selectedItems) ? selectedItems : []
    if (picked.length === 0) {
      filePickerOpen.current = false
      setLibraryOpen(false)
      return
    }
    const appended = picked.map((item) => ({
      src: item.storageUrl,
      alt: item.alt ?? '',
      id: crypto.randomUUID(),
    }))
    onChange({
      ...data,
      items: [...items, ...appended],
    })
    filePickerOpen.current = false
    setLibraryOpen(false)
  }

  // View mode — thumbnail strip, click to edit
  if (!isEditing) {
    const itemsWithSrc = items.filter(item => item.src)
    return (
      <>
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
                <img key={i} src={item.src} alt={item.alt || ''} className="jeeby-cms-gallery-thumb" onError={e => { e.currentTarget.style.display = 'none' }} />
              ))}
            </div>
          ) : (
            <p className="jeeby-cms-gallery-empty-hint">
              {items.length > 0 ? 'Gallery — click to add image URLs' : 'Empty gallery — click to add images'}
            </p>
          )}
        </div>
        <MediaLibraryModal
          open={libraryOpen}
          mode="select-multi"
          onSelect={handleLibrarySelect}
          triggerRef={libraryTriggerRef}
          onClose={() => { filePickerOpen.current = false; setLibraryOpen(false) }}
        />
      </>
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
            filePickerOpen={filePickerOpen}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
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
          onClick={() => { filePickerOpen.current = true; batchInputRef.current?.click() }}
        >Upload multiple</button>
        <button
          ref={libraryTriggerRef}
          type="button"
          className="jeeby-cms-btn-ghost jeeby-cms-gallery-batch-btn"
          onClick={() => { filePickerOpen.current = true; setLibraryOpen(true) }}
        >Add from library</button>
      </div>
      {batchError && (
        <p role="alert" className="jeeby-cms-inline-error">{batchError}</p>
      )}
      <div className="jeeby-cms-image-done-row">
        <button
          type="button"
          className="jeeby-cms-btn-ghost jeeby-cms-image-done-btn"
          disabled={activeUploads > 0}
          onClick={() => setIsEditing(false)}
        >
          Done
        </button>
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
          filePickerOpen.current = false
          if (e.target.files?.length) handleBatchUpload(e.target.files)
        }}
        onCancel={() => { filePickerOpen.current = false }}
      />
      <MediaLibraryModal
        open={libraryOpen}
        mode="select-multi"
        onSelect={handleLibrarySelect}
        triggerRef={libraryTriggerRef}
        onClose={() => { filePickerOpen.current = false; setLibraryOpen(false) }}
      />
    </div>
  )
}

export default GalleryEditor
