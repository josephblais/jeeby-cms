"use client"

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { uploadFile, validateImageFile, MIME_TO_EXT } from '../../firebase/storage.js'
import { addMediaItem } from '../../firebase/firestore.js'
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

function makeBatchUploadId() {
  return 'batch-' + crypto.randomUUID()
}

// Memoized — prevents re-renders during concurrent upload progress ticks.
// onUploadStart/onUploadEnd must be stabilized with useCallback in the parent.
const GalleryItem = memo(function GalleryItem({ item, index, items, blockId, onChange, data, storage, db, filePickerOpen, onUploadStart, onUploadEnd }) {
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
  const [pendingLibraryItem, setPendingLibraryItem] = useState(null)

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
    const ext = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : (MIME_TO_EXT[file.type] ?? 'jpg')
    const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
    // Create metadata draft immediately so editors can type while upload is in flight.
    setPendingLibraryItem((prev) => ({
      storageUrl: prev?.storageUrl ?? '',
      storagePath: path,
      title: prev?.title ?? '',
      alt: prev?.alt ?? '',
      altManuallyEdited: prev?.altManuallyEdited ?? false,
      mimeType: file.type,
      size: file.size,
    }))
    const previewUrl = URL.createObjectURL(file)
    setPreviewSrc(previewUrl)
    setUploadProgress(0)
    try {
      const url = await uploadFile(storage, file, path, (pct) => setUploadProgress(pct), uploadCancelRef)
      onChange({
        ...data,
        items: items.map((it, i) => i === index ? { ...it, src: url } : it),
      })
      setPendingLibraryItem((prev) => prev ? {
        ...prev,
        storageUrl: url,
        storagePath: path,
        mimeType: file.type,
        size: file.size,
      } : prev)
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

  function handleGalleryAltChange(nextAlt) {
    onChange({
      ...data,
      items: updateItem(items, index, 'alt', nextAlt),
    })

    // Keep metadata alt in sync with the gallery item's alt while uploading,
    // unless the editor has manually changed the metadata alt field.
    if (isUploading) {
      setPendingLibraryItem((prev) => {
        if (!prev || prev.altManuallyEdited) return prev
        return { ...prev, alt: nextAlt }
      })
    }
  }

  async function savePendingLibraryItem() {
    if (!pendingLibraryItem?.storageUrl) return
    try {
      const trimmedAlt = pendingLibraryItem.alt.trim()
      await addMediaItem(db, {
        storageUrl: pendingLibraryItem.storageUrl,
        storagePath: pendingLibraryItem.storagePath,
        title: pendingLibraryItem.title.trim(),
        alt: trimmedAlt,
        mimeType: pendingLibraryItem.mimeType,
        size: pendingLibraryItem.size,
      })
      // Keep the gallery item's alt in sync with metadata entered during save.
      onChange({
        ...data,
        items: items.map((it, i) => i === index ? { ...it, alt: trimmedAlt } : it),
      })
      setPendingLibraryItem(null)
    } catch (err) {
      console.error('[jeeby-cms] Failed to save uploaded gallery image to library:', err)
    }
  }

  function handlePendingTitleChange(nextTitle) {
    setPendingLibraryItem((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        title: nextTitle,
        alt: prev.altManuallyEdited ? prev.alt : nextTitle,
      }
    })
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
          {pendingLibraryItem && (
            <div className="jeeby-cms-library-meta-form" role="region" aria-label={'Save uploaded gallery image ' + (index + 1) + ' to media library'}>
              <p className="jeeby-cms-field-label">Add upload to Media Library</p>
              <label className="jeeby-cms-field-label" htmlFor={'gallery-library-title-' + blockId + '-' + index}>Title</label>
              <input
                id={'gallery-library-title-' + blockId + '-' + index}
                type="text"
                value={pendingLibraryItem.title}
                onChange={(e) => handlePendingTitleChange(e.target.value)}
              />
              <label className="jeeby-cms-field-label" htmlFor={'gallery-library-alt-' + blockId + '-' + index}>Alt text</label>
              <input
                id={'gallery-library-alt-' + blockId + '-' + index}
                type="text"
                value={pendingLibraryItem.alt}
                onChange={(e) => setPendingLibraryItem((prev) => prev ? { ...prev, alt: e.target.value, altManuallyEdited: true } : prev)}
              />
              {!pendingLibraryItem.alt.trim() && (
                <p className="jeeby-cms-field-hint" role="alert">Images without alt text may fail accessibility checks.</p>
              )}
              <div className="jeeby-cms-image-done-row">
                <button
                  type="button"
                  className="jeeby-cms-btn-primary"
                  disabled={isUploading || !pendingLibraryItem.storageUrl}
                  onClick={savePendingLibraryItem}
                >
                  {isUploading ? 'Finishing upload…' : 'Save to Library'}
                </button>
                <button type="button" className="jeeby-cms-btn-ghost" onClick={() => setPendingLibraryItem(null)}>
                  Skip
                </button>
              </div>
            </div>
          )}
          <input
            type="text"
            value={item.alt ?? ''}
            aria-label={'Alt text for item ' + (index + 1)}
            placeholder="Describe the image"
            onChange={(e) => handleGalleryAltChange(e.target.value)}
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
  const { storage, db } = useCMSFirebase()
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
  const [batchUploads, setBatchUploads] = useState([])
  const latestDataRef = useRef(data)
  const latestItemsRef = useRef(items)
  const batchUploadsRef = useRef(batchUploads)
  const batchCancelRefs = useRef(new Map())
  // Mirrors uploadCountRef for reactive UI — keeps Done button disabled while
  // any item upload is in flight (closing edit mode would cancel them via cleanup).
  const [activeUploads, setActiveUploads] = useState(0)

  // Stable references required for GalleryItem memo to skip re-renders during
  // upload progress ticks. Deps are empty — both use only refs and setState updaters.
  const handleUploadStart = useCallback(() => { uploadCountRef.current++; setActiveUploads(c => c + 1) }, [])
  const handleUploadEnd   = useCallback(() => { uploadCountRef.current--; setActiveUploads(c => c - 1) }, [])

  useEffect(() => { latestDataRef.current = data }, [data])
  useEffect(() => { latestItemsRef.current = items }, [items])
  useEffect(() => { batchUploadsRef.current = batchUploads }, [batchUploads])

  function removeBatchUpload(id) {
    setBatchUploads((prev) => {
      const target = prev.find((u) => u.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((u) => u.id !== id)
    })
    const ref = batchCancelRefs.current.get(id)
    ref?.current?.()
    batchCancelRefs.current.delete(id)
  }

  function updateBatchUpload(id, patch) {
    setBatchUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  function handleBatchTitleChange(id, nextTitle) {
    setBatchUploads((prev) => prev.map((u) => {
      if (u.id !== id) return u
      return {
        ...u,
        title: nextTitle,
        alt: u.altManuallyEdited ? u.alt : nextTitle,
      }
    }))
  }

  function handleBatchAltChange(id, nextAlt) {
    setBatchUploads((prev) => prev.map((u) => (
      u.id === id ? { ...u, alt: nextAlt, altManuallyEdited: true } : u
    )))
  }

  async function saveBatchUploadToLibrary(id) {
    const upload = batchUploadsRef.current.find((u) => u.id === id)
    if (!upload?.storageUrl) return
    try {
      const trimmedAlt = upload.alt.trim()
      await addMediaItem(db, {
        storageUrl: upload.storageUrl,
        storagePath: upload.storagePath,
        title: upload.title.trim(),
        alt: trimmedAlt,
        mimeType: upload.mimeType,
        size: upload.size,
      })
      if (upload.galleryItemId) {
        const latestData = latestDataRef.current
        const latestItems = latestItemsRef.current
        onChange({
          ...latestData,
          items: latestItems.map((it) => it.id === upload.galleryItemId ? { ...it, alt: trimmedAlt } : it),
        })
      }
      removeBatchUpload(id)
    } catch (err) {
      console.error('[jeeby-cms] Failed to save batch upload to media library:', err)
    }
  }

  async function startBatchUpload(upload) {
    const cancelRef = { current: null }
    batchCancelRefs.current.set(upload.id, cancelRef)
    handleUploadStart()
    try {
      const url = await uploadFile(
        storage,
        upload.file,
        upload.storagePath,
        (pct) => updateBatchUpload(upload.id, { progress: pct }),
        cancelRef
      )
      const galleryItemId = crypto.randomUUID()
      const latestData = latestDataRef.current
      const latestItems = latestItemsRef.current
      onChange({
        ...latestData,
        items: [...latestItems, { src: url, alt: upload.alt.trim(), id: galleryItemId }],
      })
      updateBatchUpload(upload.id, {
        state: 'pending-meta',
        progress: 100,
        storageUrl: url,
        galleryItemId,
      })
    } catch (err) {
      if (err.code === 'storage/canceled') return
      console.error('[jeeby-cms] Batch upload failed:', err)
      updateBatchUpload(upload.id, {
        state: 'failed',
        error: 'Upload failed — check your connection and try again.',
      })
    } finally {
      handleUploadEnd()
      batchCancelRefs.current.delete(upload.id)
    }
  }

  function retryBatchUpload(id) {
    const upload = batchUploadsRef.current.find((u) => u.id === id)
    if (!upload?.file) return
    updateBatchUpload(id, { state: 'uploading', progress: 0, error: null })
    startBatchUpload(upload)
  }

  useEffect(() => {
    return () => {
      for (const upload of batchUploadsRef.current) {
        if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl)
      }
      for (const ref of batchCancelRefs.current.values()) {
        ref?.current?.()
      }
      batchCancelRefs.current.clear()
    }
  }, [])

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
    const valid = fileArray.filter((f) => !validateImageFile(f))
    const invalidCount = fileArray.length - valid.length

    if (valid.length === 0) {
      setBatchError('No valid images — only JPEG, PNG, GIF, and WebP under 10 MB are supported.')
      if (batchInputRef.current) batchInputRef.current.value = ''
      filePickerOpen.current = false
      return
    }

    if (invalidCount > 0) {
      setBatchError(`${invalidCount} file${invalidCount !== 1 ? 's' : ''} skipped (invalid type or size).`)
    }

    const pending = valid.map((file) => {
      const ext = file.name.includes('.')
        ? file.name.split('.').pop().toLowerCase()
        : (MIME_TO_EXT[file.type] ?? 'jpg')
      return {
        id: makeBatchUploadId(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        state: 'uploading',
        error: null,
        storageUrl: '',
        storagePath: `cms/media/images/${crypto.randomUUID()}.${ext}`,
        title: '',
        alt: '',
        altManuallyEdited: false,
        mimeType: file.type,
        size: file.size,
        galleryItemId: null,
      }
    })

    setBatchUploads((prev) => [...pending, ...prev])
    pending.forEach((upload) => startBatchUpload(upload))

    if (batchInputRef.current) batchInputRef.current.value = ''
    filePickerOpen.current = false
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
            db={db}
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
      {batchUploads.length > 0 && (
        <div className="jeeby-cms-gallery-batch-queue" role="region" aria-label="Batch uploads">
          {batchUploads.map((upload, idx) => (
            <div key={upload.id} className="jeeby-cms-gallery-batch-item">
              <img
                src={upload.storageUrl || upload.previewUrl}
                alt=""
                className="jeeby-cms-gallery-preview"
                aria-hidden="true"
              />
              <div className="jeeby-cms-gallery-batch-item-body">
                <p className="jeeby-cms-field-label">Upload {idx + 1}</p>
                {upload.state === 'uploading' && (
                  <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={Math.round(upload.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={'Upload progress for selected image ' + (idx + 1)}>
                    <div className="jeeby-cms-upload-progress-fill" style={{ width: `${upload.progress}%` }} />
                  </div>
                )}
                <div className="jeeby-cms-upload-status" aria-live="polite">
                  {upload.state === 'uploading' ? `Uploading — ${Math.round(upload.progress)}%` : null}
                  {upload.state === 'pending-meta' ? 'Upload complete. Ready to save metadata.' : null}
                  {upload.state === 'failed' ? upload.error : null}
                </div>

                <div className="jeeby-cms-library-meta-form" role="group" aria-label={'Metadata for selected image ' + (idx + 1)}>
                  <label className="jeeby-cms-field-label" htmlFor={'gallery-batch-title-' + upload.id}>Title</label>
                  <input
                    id={'gallery-batch-title-' + upload.id}
                    type="text"
                    value={upload.title}
                    onChange={(e) => handleBatchTitleChange(upload.id, e.target.value)}
                  />
                  <label className="jeeby-cms-field-label" htmlFor={'gallery-batch-alt-' + upload.id}>Alt text</label>
                  <input
                    id={'gallery-batch-alt-' + upload.id}
                    type="text"
                    value={upload.alt}
                    onChange={(e) => handleBatchAltChange(upload.id, e.target.value)}
                  />
                  {!upload.alt.trim() && (
                    <p className="jeeby-cms-field-hint" role="alert">Images without alt text may fail accessibility checks.</p>
                  )}
                  <div className="jeeby-cms-image-done-row">
                    {upload.state === 'failed' ? (
                      <button type="button" className="jeeby-cms-btn-ghost" onClick={() => retryBatchUpload(upload.id)}>Retry upload</button>
                    ) : (
                      <button
                        type="button"
                        className="jeeby-cms-btn-primary"
                        disabled={upload.state !== 'pending-meta' || !upload.storageUrl}
                        onClick={() => saveBatchUploadToLibrary(upload.id)}
                      >
                        Save to Library
                      </button>
                    )}
                    <button type="button" className="jeeby-cms-btn-ghost" onClick={() => removeBatchUpload(upload.id)}>
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
