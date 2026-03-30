"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ModalShell } from './ModalShell.js'
import { addMediaItem, listMediaPaginated, updateMediaItem } from '../firebase/firestore.js'
import { uploadFile, validateImageFile, MIME_TO_EXT } from '../firebase/storage.js'
import { useCMSFirebase } from '../index.js'

const PAGE_SIZE = 24

function makeTempId() {
  return 'tmp-' + crypto.randomUUID()
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Unknown size'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let idx = 0
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024
    idx += 1
  }
  return `${size.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

function formatUploadedAt(uploadedAt) {
  if (!uploadedAt) return 'Unknown upload date'
  try {
    const date = typeof uploadedAt?.toDate === 'function'
      ? uploadedAt.toDate()
      : new Date(uploadedAt)
    if (Number.isNaN(date.getTime())) return 'Unknown upload date'
    return date.toLocaleString()
  } catch {
    return 'Unknown upload date'
  }
}

async function readImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function MediaLibraryModal({ open, mode = 'browse', onSelect, triggerRef, onClose }) {
  const { storage, db } = useCMSFirebase()

  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState(() => new Set())

  const [pendingUploads, setPendingUploads] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ title: '', alt: '' })
  const [dimensionsByKey, setDimensionsByKey] = useState({})
  const [copiedValue, setCopiedValue] = useState('')

  const cursorRef = useRef(null)
  const sentinelRef = useRef(null)
  const fileInputRef = useRef(null)
  const pendingUploadsRef = useRef([])

  const closeGuardActive = useMemo(
    () => pendingUploads.some((u) => u.state === 'pending-meta'),
    [pendingUploads]
  )

  const editingItem = useMemo(
    () => items.find((it) => it.id === editingId) ?? null,
    [items, editingId]
  )

  const editingDimensions = editingItem ? dimensionsByKey[editingItem.id] : null

  const updatePending = useCallback((id, patch) => {
    setPendingUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const removePending = useCallback((id) => {
    setPendingUploads((prev) => {
      const target = prev.find((u) => u.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((u) => u.id !== id)
    })
  }, [])

  const fetchInitialPage = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await listMediaPaginated(db, { pageSize: PAGE_SIZE })
      setItems(result.items)
      cursorRef.current = result.nextCursor
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('[jeeby-cms] Failed to load media library:', err)
      setError('Could not load your media library. Check your connection and try again.')
      setItems([])
      cursorRef.current = null
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [db])

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursorRef.current) return
    setIsLoadingMore(true)
    try {
      const result = await listMediaPaginated(db, { pageSize: PAGE_SIZE, cursor: cursorRef.current })
      setItems((prev) => [...prev, ...result.items])
      cursorRef.current = result.nextCursor
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('[jeeby-cms] Failed to load more media:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [db, hasMore, isLoadingMore])

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setPendingUploads((prev) => {
      prev.forEach((u) => { if (u.previewUrl) URL.revokeObjectURL(u.previewUrl) })
      return []
    })
    setEditingId(null)
    setEditDraft({ title: '', alt: '' })
    setDimensionsByKey({})
    setCopiedValue('')
    cursorRef.current = null
    fetchInitialPage()
  }, [open, fetchInitialPage])

  useEffect(() => {
    pendingUploadsRef.current = pendingUploads
  }, [pendingUploads])

  useEffect(() => {
    return () => {
      pendingUploadsRef.current.forEach((u) => { if (u.previewUrl) URL.revokeObjectURL(u.previewUrl) })
    }
  }, [])

  useEffect(() => {
    if (!editingItem?.storageUrl) return
    if (dimensionsByKey[editingItem.id]) return
    let cancelled = false
    readImageDimensions(editingItem.storageUrl).then((dims) => {
      if (cancelled || !dims) return
      setDimensionsByKey((prev) => ({ ...prev, [editingItem.id]: dims }))
    })
    return () => {
      cancelled = true
    }
  }, [editingItem, dimensionsByKey])

  useEffect(() => {
    if (!open || !hasMore || isLoading || isLoadingMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage()
      },
      { rootMargin: '100px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, hasMore, isLoading, isLoadingMore, fetchNextPage])

  const guardedOnClose = useCallback(() => {
    if (closeGuardActive) return
    onClose?.()
  }, [closeGuardActive, onClose])

  async function handleUpload(file) {
    const validationError = validateImageFile(file)
    if (validationError) return

    const id = makeTempId()
    const previewUrl = URL.createObjectURL(file)
    const ext = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : (MIME_TO_EXT[file.type] ?? 'jpg')
    const path = `cms/media/images/${crypto.randomUUID()}.${ext}`

    setPendingUploads((prev) => [
      {
        id,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        alt: file.name.replace(/\.[^/.]+$/, ''),
        altManuallyEdited: false,
        progress: 0,
        state: 'uploading',
        storageUrl: '',
        previewUrl,
        storagePath: path,
        mimeType: file.type,
        size: file.size,
        dimensions: null,
      },
      ...prev,
    ])
    readImageDimensions(previewUrl).then((dims) => {
      if (!dims) return
      updatePending(id, { dimensions: dims })
    })

    try {
      const storageUrl = await uploadFile(storage, file, path, (pct) => updatePending(id, { progress: pct }))
      updatePending(id, { state: 'pending-meta', progress: 100, storageUrl })
    } catch (err) {
      console.error('[jeeby-cms] Upload failed:', err)
      updatePending(id, { state: 'failed', error: 'Upload failed — check your connection and try again.' })
    }
  }

  async function handleFilesSelected(files) {
    const fileArray = Array.from(files || [])
    await Promise.all(fileArray.map((f) => handleUpload(f)))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSavePending(pending) {
    if (!pending.storageUrl) return
    try {
      const trimmedTitle = pending.title.trim()
      const trimmedAlt = pending.alt.trim()
      const newId = await addMediaItem(db, {
        storageUrl: pending.storageUrl,
        storagePath: pending.storagePath,
        title: trimmedTitle,
        alt: trimmedAlt,
        mimeType: pending.mimeType,
        size: pending.size,
      })
      setItems((prev) => [{
        id: newId,
        storageUrl: pending.storageUrl,
        storagePath: pending.storagePath,
        title: trimmedTitle,
        alt: trimmedAlt,
        mimeType: pending.mimeType,
        size: pending.size,
        uploadedAt: new Date(),
      }, ...prev])
      removePending(pending.id)
    } catch (err) {
      console.error('[jeeby-cms] Failed to save media item:', err)
    }
  }

  function handlePendingTitleChange(id, nextTitle) {
    setPendingUploads((prev) => prev.map((u) => {
      if (u.id !== id) return u
      return {
        ...u,
        title: nextTitle,
        alt: u.altManuallyEdited ? u.alt : nextTitle,
      }
    }))
  }

  async function retryPendingUpload(pending) {
    if (!pending?.file) return
    updatePending(pending.id, { state: 'uploading', progress: 0, error: null })
    try {
      const storageUrl = await uploadFile(storage, pending.file, pending.storagePath, (pct) => updatePending(pending.id, { progress: pct }))
      updatePending(pending.id, { state: 'pending-meta', progress: 100, storageUrl })
    } catch (err) {
      if (err.code === 'storage/canceled') return
      console.error('[jeeby-cms] Upload failed:', err)
      updatePending(pending.id, { state: 'failed', error: 'Upload failed — check your connection and try again.' })
    }
  }

  function handleCardClick(item) {
    if (mode === 'select-single') {
      onSelect?.(item)
      onClose?.()
      return
    }

    if (mode === 'select-multi') {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(item.id)) next.delete(item.id)
        else next.add(item.id)
        return next
      })
      return
    }

    setEditingId(item.id)
    setEditDraft({ title: item.title ?? '', alt: item.alt ?? '' })
  }

  async function handleSaveEdit() {
    if (!editingId) return
    try {
      await updateMediaItem(db, editingId, { title: editDraft.title.trim(), alt: editDraft.alt.trim() })
      setItems((prev) => prev.map((it) => (
        it.id === editingId
          ? { ...it, title: editDraft.title.trim(), alt: editDraft.alt.trim() }
          : it
      )))
      setEditingId(null)
      setEditDraft({ title: '', alt: '' })
    } catch (err) {
      console.error('[jeeby-cms] Failed to update media item:', err)
    }
  }

  async function handleCopy(text) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedValue(text)
      setTimeout(() => setCopiedValue(''), 1200)
    } catch {
      setCopiedValue('')
    }
  }

  function handleConfirmSelection() {
    const picked = items.filter((item) => selected.has(item.id))
    onSelect?.(picked)
    onClose?.()
  }

  return (
    <ModalShell
      open={open}
      labelId="media-library-heading"
      triggerRef={triggerRef}
      onClose={guardedOnClose}
      backdropStyle={{ zIndex: 1100 }}
      cardClassName="jeeby-cms-modal-card--full"
    >
      <div className="jeeby-cms-media-library">
        <header className="jeeby-cms-media-library-header">
          <h2 id="media-library-heading">Media Library</h2>
          <button
            type="button"
            className="jeeby-cms-btn-ghost"
            onClick={guardedOnClose}
            aria-label="Close media library"
            disabled={closeGuardActive}
          >
            Close
          </button>
        </header>

        {closeGuardActive && (
          <div className="jeeby-cms-media-library-close-guard" role="alert">
            Finish saving the upload details before closing.
          </div>
        )}

        <div className="jeeby-cms-media-library-toolbar">
          <button type="button" className="jeeby-cms-btn-primary" onClick={() => fileInputRef.current?.click()}>
            Upload images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>

        {error && <div className="jeeby-cms-media-library-error" role="alert">{error}</div>}

        {mode === 'browse' && editingItem && (
          <section className="jeeby-cms-media-detail-panel" aria-label="Media details">
            <img
              className="jeeby-cms-media-detail-thumb"
              src={editingItem.storageUrl}
              alt={editDraft.alt || editingItem.alt || ''}
            />
            <div className="jeeby-cms-media-detail-body">
              <div className="jeeby-cms-media-detail-stats">
                <div><strong>Uploaded</strong><span>{formatUploadedAt(editingItem.uploadedAt)}</span></div>
                <div><strong>File size</strong><span>{formatBytes(editingItem.size)}</span></div>
                <div><strong>Dimensions</strong><span>{editingDimensions ? `${editingDimensions.width} x ${editingDimensions.height}` : 'Loading...'}</span></div>
              </div>

              <div className="jeeby-cms-library-meta-form" role="group" aria-label="Edit media metadata">
                <label className="jeeby-cms-field-label" htmlFor={'edit-title-' + editingItem.id}>Title</label>
                <input
                  id={'edit-title-' + editingItem.id}
                  type="text"
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                />
                <label className="jeeby-cms-field-label" htmlFor={'edit-alt-' + editingItem.id}>Alt text</label>
                <input
                  id={'edit-alt-' + editingItem.id}
                  type="text"
                  value={editDraft.alt}
                  onChange={(e) => setEditDraft((d) => ({ ...d, alt: e.target.value }))}
                />
                <label className="jeeby-cms-field-label" htmlFor={'edit-url-' + editingItem.id}>File URL</label>
                <div className="jeeby-cms-media-detail-url-row">
                  <input id={'edit-url-' + editingItem.id} type="text" value={editingItem.storageUrl} readOnly />
                  <button type="button" className="jeeby-cms-btn-ghost" onClick={() => handleCopy(editingItem.storageUrl)}>
                    {copiedValue === editingItem.storageUrl ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="jeeby-cms-image-done-row">
                  <button type="button" className="jeeby-cms-btn-primary" onClick={handleSaveEdit}>Save</button>
                  <button type="button" className="jeeby-cms-btn-ghost" onClick={() => setEditingId(null)}>Close</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {pendingUploads.length > 0 && (
          <section className="jeeby-cms-media-upload-queue" aria-label="Pending uploads">
            {pendingUploads.map((pending, idx) => (
              <div key={pending.id} className="jeeby-cms-media-upload-item">
                <img className="jeeby-cms-media-detail-thumb" src={pending.storageUrl || pending.previewUrl} alt="" aria-hidden="true" />
                <div className="jeeby-cms-media-upload-item-body">
                  <p className="jeeby-cms-field-label">Upload {idx + 1}</p>
                  {pending.state === 'uploading' && (
                    <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={pending.progress} aria-valuemin={0} aria-valuemax={100} aria-label={'Upload progress for image ' + (idx + 1)}>
                      <div className="jeeby-cms-upload-progress-fill" style={{ width: `${pending.progress}%` }} />
                    </div>
                  )}
                  <div className="jeeby-cms-upload-status" aria-live="polite">
                    {pending.state === 'uploading' ? `Uploading — ${Math.round(pending.progress)}%` : null}
                    {pending.state === 'pending-meta' ? 'Upload complete. Ready to save metadata.' : null}
                    {pending.state === 'failed' ? pending.error : null}
                  </div>
                  <div className="jeeby-cms-media-detail-stats">
                    <div><strong>File size</strong><span>{formatBytes(pending.size)}</span></div>
                    <div><strong>Dimensions</strong><span>{pending.dimensions ? `${pending.dimensions.width} x ${pending.dimensions.height}` : 'Loading...'}</span></div>
                    <div><strong>Storage path</strong><span>{pending.storagePath}</span></div>
                  </div>
                  <div className="jeeby-cms-library-meta-form" role="group" aria-label={'Metadata for upload ' + (idx + 1)}>
                    <label className="jeeby-cms-field-label" htmlFor={'pending-title-' + pending.id}>Title</label>
                    <input
                      id={'pending-title-' + pending.id}
                      type="text"
                      value={pending.title}
                      onChange={(e) => handlePendingTitleChange(pending.id, e.target.value)}
                    />
                    <label className="jeeby-cms-field-label" htmlFor={'pending-alt-' + pending.id}>Alt text</label>
                    <input
                      id={'pending-alt-' + pending.id}
                      type="text"
                      value={pending.alt}
                      onChange={(e) => updatePending(pending.id, { alt: e.target.value, altManuallyEdited: true })}
                    />
                    {!pending.alt.trim() && (
                      <p className="jeeby-cms-field-hint" role="alert">Images without alt text may fail accessibility checks.</p>
                    )}
                    <div className="jeeby-cms-image-done-row">
                      {pending.state === 'failed' ? (
                        <button type="button" className="jeeby-cms-btn-ghost" onClick={() => retryPendingUpload(pending)}>Retry upload</button>
                      ) : (
                        <button
                          type="button"
                          className="jeeby-cms-btn-primary"
                          disabled={pending.state !== 'pending-meta' || !pending.storageUrl}
                          onClick={() => handleSavePending(pending)}
                        >
                          Save to Library
                        </button>
                      )}
                      <button type="button" className="jeeby-cms-btn-ghost" onClick={() => removePending(pending.id)}>
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {isLoading ? (
          <div className="jeeby-cms-media-library-loading" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="jeeby-cms-media-card-skeleton" />)}
          </div>
        ) : (
          <div className="jeeby-cms-media-library-grid">
            {items.map((item) => {
              const checked = selected.has(item.id)
              return (
                <div
                  key={item.id}
                  className={['jeeby-cms-media-card', checked ? 'jeeby-cms-media-card--selected' : ''].filter(Boolean).join(' ')}
                  onClick={() => handleCardClick(item)}
                >
                  <>
                    <img className="jeeby-cms-media-card-thumb" src={item.storageUrl} alt={item.alt || ''} loading="lazy" />
                    {mode === 'select-multi' && (
                      <input
                        className="jeeby-cms-media-card-checkbox"
                        type="checkbox"
                        checked={checked}
                        aria-label={item.title || 'Untitled image'}
                        onChange={() => handleCardClick(item)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {mode === 'browse' && (
                      <div className="jeeby-cms-media-card-edit-overlay">Edit details</div>
                    )}
                  </>
                </div>
              )
            })}

            {items.length === 0 && (
              <div className="jeeby-cms-media-library-empty">
                <p><strong>No media yet</strong></p>
                <p>Upload your first image to get started.</p>
              </div>
            )}

            {hasMore && <div ref={sentinelRef} className="jeeby-cms-media-library-sentinel" aria-hidden="true" />}
            {isLoadingMore && Array.from({ length: 4 }, (_, i) => <div key={'more-' + i} className="jeeby-cms-media-card-skeleton" aria-hidden="true" />)}
          </div>
        )}

        {mode === 'select-multi' && selected.size > 0 && (
          <div className="jeeby-cms-media-library-footer" role="region" aria-label="Selection summary">
            <span>{selected.size} selected</span>
            <button type="button" className="jeeby-cms-btn-primary" onClick={handleConfirmSelection}>
              Add {selected.size} {selected.size === 1 ? 'image' : 'images'}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  )
}

export default MediaLibraryModal
