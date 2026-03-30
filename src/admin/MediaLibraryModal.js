"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ModalShell } from './ModalShell.js'
import { addMediaItem, listMediaPaginated, updateMediaItem } from '../firebase/firestore.js'
import { uploadFile, validateImageFile, MIME_TO_EXT } from '../firebase/storage.js'
import { useCMSFirebase } from '../index.js'

const PAGE_SIZE = 24

function makeTempId() {
  return 'tmp-' + crypto.randomUUID()
}

export function MediaLibraryModal({ open, mode = 'browse', onSelect, triggerRef, onClose }) {
  const reduced = useReducedMotion()
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

  const cursorRef = useRef(null)
  const sentinelRef = useRef(null)
  const fileInputRef = useRef(null)

  const closeGuardActive = useMemo(
    () => pendingUploads.some((u) => u.state === 'pending-meta'),
    [pendingUploads]
  )

  const updatePending = useCallback((id, patch) => {
    setPendingUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const removePending = useCallback((id) => {
    setPendingUploads((prev) => prev.filter((u) => u.id !== id))
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
    setPendingUploads([])
    setEditingId(null)
    setEditDraft({ title: '', alt: '' })
    cursorRef.current = null
    fetchInitialPage()
  }, [open, fetchInitialPage])

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
    const ext = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : (MIME_TO_EXT[file.type] ?? 'jpg')
    const path = `cms/media/images/${crypto.randomUUID()}.${ext}`

    setPendingUploads((prev) => [
      {
        id,
        file,
        title: '',
        alt: '',
        progress: 0,
        state: 'uploading',
        storageUrl: '',
        storagePath: path,
        mimeType: file.type,
        size: file.size,
      },
      ...prev,
    ])

    try {
      const storageUrl = await uploadFile(storage, file, path, (pct) => updatePending(id, { progress: pct }))
      updatePending(id, { state: 'pending-meta', progress: 100, storageUrl })
    } catch (err) {
      console.error('[jeeby-cms] Upload failed:', err)
      removePending(id)
    }
  }

  async function handleFilesSelected(files) {
    const fileArray = Array.from(files || [])
    await Promise.all(fileArray.map((f) => handleUpload(f)))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSavePending(pending) {
    try {
      const newId = await addMediaItem(db, {
        storageUrl: pending.storageUrl,
        storagePath: pending.storagePath,
        title: pending.title.trim(),
        alt: pending.alt.trim(),
        mimeType: pending.mimeType,
        size: pending.size,
      })
      setItems((prev) => [{
        id: newId,
        storageUrl: pending.storageUrl,
        storagePath: pending.storagePath,
        title: pending.title.trim(),
        alt: pending.alt.trim(),
        mimeType: pending.mimeType,
        size: pending.size,
      }, ...prev])
      removePending(pending.id)
    } catch (err) {
      console.error('[jeeby-cms] Failed to save media item:', err)
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

        {isLoading ? (
          <div className="jeeby-cms-media-library-loading" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="jeeby-cms-media-card-skeleton" />)}
          </div>
        ) : (
          <div className="jeeby-cms-media-library-grid">
            {pendingUploads.map((pending) => (
              <div key={pending.id} className="jeeby-cms-media-card jeeby-cms-media-card--pending-meta">
                {pending.state === 'uploading' && (
                  <div className="jeeby-cms-media-card-meta-form">
                    <p className="jeeby-cms-field-label">Uploading...</p>
                    <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={pending.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                      <div className="jeeby-cms-upload-progress-fill" style={{ width: `${pending.progress}%` }} />
                    </div>
                  </div>
                )}
                {pending.state === 'pending-meta' && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pending.id + '-meta'}
                      className="jeeby-cms-media-card-meta-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0.01 : 0.2 }}
                    >
                      <label className="jeeby-cms-field-label" htmlFor={'pending-title-' + pending.id}>Title</label>
                      <input
                        id={'pending-title-' + pending.id}
                        type="text"
                        value={pending.title}
                        onChange={(e) => updatePending(pending.id, { title: e.target.value })}
                      />
                      <label className="jeeby-cms-field-label" htmlFor={'pending-alt-' + pending.id}>Alt text</label>
                      <input
                        id={'pending-alt-' + pending.id}
                        type="text"
                        value={pending.alt}
                        onChange={(e) => updatePending(pending.id, { alt: e.target.value })}
                      />
                      {!pending.alt.trim() && (
                        <p className="jeeby-cms-field-hint" role="alert">Images without alt text may fail accessibility checks.</p>
                      )}
                      <div className="jeeby-cms-image-done-row">
                        <button type="button" className="jeeby-cms-btn-primary" onClick={() => handleSavePending(pending)}>
                          Save to Library
                        </button>
                        <button type="button" className="jeeby-cms-btn-ghost" onClick={() => removePending(pending.id)}>
                          Discard upload
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            ))}

            {items.map((item) => {
              const checked = selected.has(item.id)
              const inEdit = editingId === item.id
              return (
                <div
                  key={item.id}
                  className={['jeeby-cms-media-card', checked ? 'jeeby-cms-media-card--selected' : ''].filter(Boolean).join(' ')}
                  onClick={() => { if (!inEdit) handleCardClick(item) }}
                >
                  {!inEdit && (
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
                  )}
                  {inEdit && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={item.id + '-edit'}
                        className="jeeby-cms-media-card-meta-form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduced ? 0.01 : 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="jeeby-cms-field-label" htmlFor={'edit-title-' + item.id}>Title</label>
                        <input
                          id={'edit-title-' + item.id}
                          type="text"
                          value={editDraft.title}
                          onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                        />
                        <label className="jeeby-cms-field-label" htmlFor={'edit-alt-' + item.id}>Alt text</label>
                        <input
                          id={'edit-alt-' + item.id}
                          type="text"
                          value={editDraft.alt}
                          onChange={(e) => setEditDraft((d) => ({ ...d, alt: e.target.value }))}
                        />
                        <div className="jeeby-cms-image-done-row">
                          <button type="button" className="jeeby-cms-btn-primary" onClick={handleSaveEdit}>Save</button>
                          <button type="button" className="jeeby-cms-btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )
            })}

            {items.length === 0 && pendingUploads.length === 0 && (
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
