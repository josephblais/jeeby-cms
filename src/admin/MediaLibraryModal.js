"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ModalShell } from './ModalShell.js'
import { addMediaItem, listMediaPaginated, updateMediaItem } from '../firebase/firestore.js'
import { uploadFile, validateImageFile, MIME_TO_EXT, generateThumbnail } from '../firebase/storage.js'
import { useCMSFirebase } from '../index.js'
import { useT, tf } from './useT.js'

const PAGE_SIZE = 24

function makeTempId() {
  return 'tmp-' + crypto.randomUUID()
}

function formatBytes(bytes, unknownLabel = 'Unknown size') {
  if (!Number.isFinite(bytes) || bytes <= 0) return unknownLabel
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let idx = 0
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024
    idx += 1
  }
  return `${size.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

function truncateName(name, max = 24, fallback = 'Untitled') {
  if (!name) return fallback
  return name.length > max ? name.slice(0, max) + '\u2026' : name
}

function formatUploadedAt(uploadedAt, unknownLabel = 'Unknown upload date') {
  if (!uploadedAt) return unknownLabel
  try {
    const date = typeof uploadedAt?.toDate === 'function'
      ? uploadedAt.toDate()
      : new Date(uploadedAt)
    if (Number.isNaN(date.getTime())) return unknownLabel
    return date.toLocaleString()
  } catch {
    return unknownLabel
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
  const t = useT()

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
  const [closeConfirmActive, setCloseConfirmActive] = useState(false)
  const [editSaveError, setEditSaveError] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [panelAnnouncement, setPanelAnnouncement] = useState('')

  const cursorRef = useRef(null)
  const sentinelRef = useRef(null)
  const fileInputRef = useRef(null)
  const pendingUploadsRef = useRef([])
  const lightboxRef = useRef(null)
  const lightboxCloseRef = useRef(null)
  const copyTimeoutRef = useRef(null)

  const closeGuardActive = useMemo(
    () => pendingUploads.some((u) => u.state === 'pending-meta' || u.state === 'uploading'),
    [pendingUploads]
  )

  const editingItem = useMemo(
    () => items.find((it) => it.id === editingId) ?? null,
    [items, editingId]
  )

  const editingDimensions = editingItem ? dimensionsByKey[editingItem.id] : null

  const headingText = mode === 'select-single'
    ? t('selectImage')
    : mode === 'select-multi'
      ? t('selectImages')
      : t('mediaLibrary')

  const subtitleText = mode === 'select-single'
    ? t('clickToUse')
    : mode === 'select-multi' && selected.size === 0
      ? t('clickToSelect')
      : null

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
      setError(t('couldNotLoadMedia'))
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

  useEffect(() => {
    if (!closeGuardActive) setCloseConfirmActive(false)
  }, [closeGuardActive])

  // Close lightbox when detail panel closes
  useEffect(() => {
    if (!editingId) setLightboxOpen(false)
  }, [editingId])

  // Escape + Tab focus trap for lightbox — capture phase takes priority over ModalShell's bubble handler
  useEffect(() => {
    if (!lightboxOpen) return
    lightboxCloseRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setLightboxOpen(false)
        return
      }
      if (e.key === 'Tab') {
        const nodes = lightboxRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
          'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
        if (!nodes?.length) { e.preventDefault(); return }
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [lightboxOpen])

  // H2: announce detail panel open/close to screen readers
  useEffect(() => {
    setPanelAnnouncement(editingItem
      ? tf(t('detailsPanelOpened'), { name: editingItem.title || t('untitled') })
      : '')
  }, [editingItem]) // eslint-disable-line react-hooks/exhaustive-deps

  // M5: clean up copy feedback timeout on unmount
  useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current) }
  }, [])

  const guardedOnClose = useCallback(() => {
    if (closeGuardActive) {
      setCloseConfirmActive(true)
      return
    }
    onClose?.()
  }, [closeGuardActive, onClose])

  async function handleUpload(file) {
    const validationError = validateImageFile(file)
    if (validationError) return
    setEditingId(null)

    const id = makeTempId()
    const uuid = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    const ext = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : (MIME_TO_EXT[file.type] ?? 'jpg')
    const path = `cms/media/images/${uuid}.${ext}`
    const thumbPath = `cms/media/thumbs/${uuid}_thumb.webp`

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
        thumbUrl: '',
        thumbPath,
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

    // Generate and upload thumbnail in parallel with the main upload.
    // Thumbnail failure is non-fatal — falls back to storageUrl at display time.
    const thumbUploadPromise = generateThumbnail(file)
      .then((thumbFile) => thumbFile ? uploadFile(storage, thumbFile, thumbPath) : null)
      .then((url) => url ? { thumbUrl: url, thumbPath } : null)
      .catch(() => null)

    try {
      const storageUrl = await uploadFile(storage, file, path, (pct) => updatePending(id, { progress: pct }))
      const thumbResult = await thumbUploadPromise
      updatePending(id, {
        state: 'pending-meta',
        progress: 100,
        storageUrl,
        thumbUrl: thumbResult?.thumbUrl ?? '',
        thumbPath: thumbResult?.thumbPath ?? thumbPath,
      })
    } catch (err) {
      console.error('[jeeby-cms] Upload failed:', err)
      updatePending(id, { state: 'failed', error: t('uploadFailed') })
    }
  }

  async function handleFilesSelected(files) {
    const fileArray = Array.from(files || [])
    await Promise.all(fileArray.map((f) => handleUpload(f)))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSavePending(pending) {
    if (!pending.storageUrl) return
    updatePending(pending.id, { saveError: null })
    try {
      const trimmedTitle = pending.title.trim()
      const trimmedAlt = pending.alt.trim()
      const newId = await addMediaItem(db, {
        storageUrl: pending.storageUrl,
        storagePath: pending.storagePath,
        ...(pending.thumbUrl && { thumbUrl: pending.thumbUrl, thumbPath: pending.thumbPath }),
        title: trimmedTitle,
        alt: trimmedAlt,
        mimeType: pending.mimeType,
        size: pending.size,
      })
      setItems((prev) => [{
        id: newId,
        storageUrl: pending.storageUrl,
        storagePath: pending.storagePath,
        thumbUrl: pending.thumbUrl || '',
        thumbPath: pending.thumbPath || '',
        title: trimmedTitle,
        alt: trimmedAlt,
        mimeType: pending.mimeType,
        size: pending.size,
        uploadedAt: new Date(),
      }, ...prev])
      removePending(pending.id)
    } catch (err) {
      console.error('[jeeby-cms] Failed to save media item:', err)
      updatePending(pending.id, { saveError: t('couldNotSave') })
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

    const thumbUploadPromise = pending.thumbUrl
      ? Promise.resolve({ thumbUrl: pending.thumbUrl, thumbPath: pending.thumbPath })
      : generateThumbnail(pending.file)
          .then((f) => f ? uploadFile(storage, f, pending.thumbPath) : null)
          .then((url) => url ? { thumbUrl: url, thumbPath: pending.thumbPath } : null)
          .catch(() => null)

    try {
      const storageUrl = await uploadFile(storage, pending.file, pending.storagePath, (pct) => updatePending(pending.id, { progress: pct }))
      const thumbResult = await thumbUploadPromise
      updatePending(pending.id, {
        state: 'pending-meta',
        progress: 100,
        storageUrl,
        thumbUrl: thumbResult?.thumbUrl ?? '',
        thumbPath: thumbResult?.thumbPath ?? pending.thumbPath,
      })
    } catch (err) {
      if (err.code === 'storage/canceled') return
      console.error('[jeeby-cms] Upload failed:', err)
      updatePending(pending.id, { state: 'failed', error: t('uploadFailed') })
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
    setEditSaveError(null)
  }

  async function handleSaveEdit() {
    if (!editingId) return
    setEditSaveError(null)
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
      setEditSaveError(t('couldNotSave'))
    }
  }

  async function handleCopy(text) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      setCopiedValue(text)
      copyTimeoutRef.current = setTimeout(() => setCopiedValue(''), 1200)
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
      backdropClassName="jeeby-cms-modal-backdrop--elevated"
      cardClassName="jeeby-cms-modal-card--full"
    >
      <div className="jeeby-cms-media-library">
        <header className="jeeby-cms-media-library-header">
          <div className="jeeby-cms-media-library-header-title">
            <h2 id="media-library-heading">{headingText}</h2>
            {subtitleText && <p className="jeeby-cms-media-library-subtitle">{subtitleText}</p>}
          </div>
          <button
            type="button"
            className="jeeby-cms-btn-ghost"
            onClick={guardedOnClose}
            aria-label={t('closeMediaLibrary')}
            disabled={closeGuardActive}
          >
            {t('close')}
          </button>
        </header>

        {/* M2: always-mounted so live region announces content changes reliably in JAWS */}
        <div className={`jeeby-cms-media-library-close-guard${closeGuardActive ? '' : ' jeeby-cms-visually-hidden'}`} role="status" aria-live="polite" aria-atomic="true">
          {closeGuardActive && (closeConfirmActive ? (
              <>
                <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{flexShrink: 0}}>
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                <span>{t('unsavedUploads')}</span>
                <div className="jeeby-cms-close-guard-actions">
                  <button type="button" className="jeeby-cms-btn-ghost" onClick={() => { setCloseConfirmActive(false); onClose?.() }}>{t('leave')}</button>
                  <button type="button" className="jeeby-cms-btn-ghost" onClick={() => setCloseConfirmActive(false)}>{t('stay')}</button>
                </div>
              </>
            ) : (
              <>
                <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{flexShrink: 0}}>
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                <span>{t('finishBeforeClosing')}</span>
              </>
            ))}
        </div>

        {/* H2: panel open/close announcement for screen readers */}
        <p className="jeeby-cms-visually-hidden" aria-live="polite" aria-atomic="true">{panelAnnouncement}</p>

        <div className="jeeby-cms-media-library-toolbar">
          <button type="button" className="jeeby-cms-btn-primary" data-autofocus onClick={() => fileInputRef.current?.click()}>
            {t('uploadImages')}
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

        <p className="jeeby-cms-visually-hidden" aria-live="polite" aria-atomic="true">
          {isLoading ? t('loadingMediaLibrary') : ''}
        </p>

        {error && <div className="jeeby-cms-media-library-error" role="alert">{error}</div>}

        <div className="jeeby-cms-media-library-body">
          <div className="jeeby-cms-media-library-main">
            {pendingUploads.length > 0 && (
              <section className="jeeby-cms-media-upload-queue" aria-label={t('pendingUploadsLabel')}>
                {pendingUploads.map((pending) => (
                  <div key={pending.id} className="jeeby-cms-media-upload-item">
                    <img className="jeeby-cms-media-detail-thumb" src={pending.storageUrl || pending.previewUrl} alt="" aria-hidden="true" />
                    <div className="jeeby-cms-media-upload-item-body">
                      <span className="jeeby-cms-field-label">{truncateName(pending.title, 24, t('untitled'))}</span>
                      {pending.state === 'uploading' && (
                        <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={pending.progress} aria-valuemin={0} aria-valuemax={100} aria-label={tf(t('uploadProgressFor'), { name: truncateName(pending.title, 24, t('untitled')) })}>
                          <div className="jeeby-cms-upload-progress-fill" style={{ width: `${pending.progress}%` }} />
                        </div>
                      )}
                      <div className="jeeby-cms-upload-status" aria-live="polite">
                        {pending.state === 'uploading' ? tf(t('uploadingProgress'), { pct: Math.round(pending.progress) }) : null}
                        {pending.state === 'pending-meta' ? t('uploadComplete') : null}
                        {pending.state === 'failed' ? pending.error : null}
                      </div>
                      <div className="jeeby-cms-media-detail-stats">
                        <div><strong>{t('dimensionsLabel')}</strong><span>{pending.dimensions ? `${pending.dimensions.width} x ${pending.dimensions.height}` : t('loadingDimensions')}</span></div>
                      </div>
                      <div className="jeeby-cms-library-meta-form" role="group" aria-label={tf(t('metadataFor'), { name: truncateName(pending.title, 24, t('untitled')) })}>
                        <label className="jeeby-cms-field-label" htmlFor={'pending-title-' + pending.id}>{t('titleLabel')}</label>
                        <input
                          id={'pending-title-' + pending.id}
                          type="text"
                          value={pending.title}
                          onChange={(e) => handlePendingTitleChange(pending.id, e.target.value)}
                        />
                        <label className="jeeby-cms-field-label jeeby-cms-image-alt-label" htmlFor={'pending-alt-' + pending.id}>{t('altTextLabel')}</label>
                        <input
                          id={'pending-alt-' + pending.id}
                          type="text"
                          value={pending.alt}
                          aria-describedby={'pending-alt-hint-' + pending.id}
                          placeholder={t('altPlaceholder')}
                          onChange={(e) => updatePending(pending.id, { alt: e.target.value, altManuallyEdited: true })}
                        />
                        <p id={'pending-alt-hint-' + pending.id} className="jeeby-cms-field-hint">
                          {t('altHint')}
                        </p>
                        <div className="jeeby-cms-image-done-row">
                          {pending.state === 'failed' ? (
                            <button type="button" className="jeeby-cms-btn-ghost" onClick={() => retryPendingUpload(pending)}>{t('retryUpload')}</button>
                          ) : (
                            <button
                              type="button"
                              className="jeeby-cms-btn-primary"
                              disabled={pending.state !== 'pending-meta' || !pending.storageUrl}
                              onClick={() => handleSavePending(pending)}
                            >
                              {t('saveToLibrary')}
                            </button>
                          )}
                          <button type="button" className="jeeby-cms-btn-ghost" onClick={() => removePending(pending.id)}>
                            {t('discard')}
                          </button>
                        </div>
                        {pending.saveError && (
                          <p className="jeeby-cms-inline-error" role="alert">{pending.saveError}</p>
                        )}
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
              <div
                className="jeeby-cms-media-library-grid"
                role={mode === 'select-multi' ? 'listbox' : 'region'}
                aria-multiselectable={mode === 'select-multi' ? 'true' : undefined}
                aria-label={t('mediaImages')}
              >
                {items.map((item) => {
                  const checked = selected.has(item.id)
                  const isActive = item.id === editingId
                  const isMulti = mode === 'select-multi'
                  return (
                    <div
                      key={item.id}
                      role={isMulti ? 'option' : 'button'}
                      aria-selected={isMulti ? checked : undefined}
                      aria-expanded={!isMulti && mode === 'browse' ? isActive : undefined}
                      aria-controls={!isMulti && mode === 'browse' ? 'media-detail-panel' : undefined}
                      aria-label={item.title || 'Untitled image'}
                      tabIndex={0}
                      className={['jeeby-cms-media-card', checked ? 'jeeby-cms-media-card--selected' : '', isActive ? 'jeeby-cms-media-card--active' : ''].filter(Boolean).join(' ')}
                      onClick={() => handleCardClick(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleCardClick(item)
                        }
                      }}
                    >
                      <div className="jeeby-cms-media-card-image">
                        <img className="jeeby-cms-media-card-thumb" src={item.thumbUrl || item.storageUrl} alt={item.alt || ''} loading="lazy" decoding="async" />
                        {isMulti && (
                          <input
                            className="jeeby-cms-media-card-checkbox"
                            type="checkbox"
                            checked={checked}
                            aria-hidden="true"
                            tabIndex={-1}
                            onChange={() => {}}
                          />
                        )}
                        {mode === 'browse' && (
                          <div className="jeeby-cms-media-card-edit-overlay">{t('editDetails')}</div>
                        )}
                      </div>
                      <p className="jeeby-cms-media-card-title">{item.title || ''}</p>
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="jeeby-cms-media-library-empty">
                    <p><strong>{t('noMediaYet')}</strong></p>
                    <p>{t('uploadFirstImage')}</p>
                  </div>
                )}

                {hasMore && <div ref={sentinelRef} className="jeeby-cms-media-library-sentinel" aria-hidden="true" />}
                {isLoadingMore && Array.from({ length: 4 }, (_, i) => <div key={'more-' + i} className="jeeby-cms-media-card-skeleton" aria-hidden="true" />)}
              </div>
            )}
          </div>

          <aside
            id="media-detail-panel"
            className={`jeeby-cms-media-detail-panel${editingItem && mode === 'browse' ? ' jeeby-cms-media-detail-panel--open' : ''}`}
            aria-label={t('mediaDetails')}
          >
            {editingItem && mode === 'browse' && (
              <div className="jeeby-cms-media-detail-inner">
                <button
                  type="button"
                  className="jeeby-cms-media-thumb-btn"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={t('viewFullImage')}
                >
                  <img
                    className="jeeby-cms-media-detail-thumb"
                    src={editingItem.storageUrl}
                    alt={editDraft.alt || editingItem.alt || ''}
                  />
                </button>
                <div className="jeeby-cms-media-detail-body">
                  <div className="jeeby-cms-media-detail-stats">
                    <div><strong>{t('uploadedLabel')}</strong><span>{formatUploadedAt(editingItem.uploadedAt, t('unknownUploadDate'))}</span></div>
                    <div><strong>{t('fileSizeLabel')}</strong><span>{formatBytes(editingItem.size, t('unknownSize'))}</span></div>
                    <div><strong>{t('dimensionsLabel')}</strong><span>{editingDimensions ? `${editingDimensions.width} x ${editingDimensions.height}` : t('loadingDimensions')}</span></div>
                  </div>

                  <div className="jeeby-cms-library-meta-form" role="group" aria-label={t('editMediaMetadata')}>
                    <label className="jeeby-cms-field-label" htmlFor={'edit-title-' + editingItem.id}>{t('titleLabel')}</label>
                    <input
                      id={'edit-title-' + editingItem.id}
                      type="text"
                      value={editDraft.title}
                      onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                    />
                    <label className="jeeby-cms-field-label jeeby-cms-image-alt-label" htmlFor={'edit-alt-' + editingItem.id}>{t('altTextLabel')}</label>
                    <input
                      id={'edit-alt-' + editingItem.id}
                      type="text"
                      value={editDraft.alt}
                      aria-describedby={'edit-alt-hint-' + editingItem.id}
                      placeholder={t('altPlaceholder')}
                      onChange={(e) => setEditDraft((d) => ({ ...d, alt: e.target.value }))}
                    />
                    <p id={'edit-alt-hint-' + editingItem.id} className="jeeby-cms-field-hint">
                      {t('altHint')}
                    </p>
                    <label className="jeeby-cms-field-label" htmlFor={'edit-url-' + editingItem.id}>{t('fileUrl')}</label>
                    <div className="jeeby-cms-media-detail-url-row">
                      <input id={'edit-url-' + editingItem.id} type="text" value={editingItem.storageUrl} readOnly />
                      <button type="button" className="jeeby-cms-btn-ghost" onClick={() => handleCopy(editingItem.storageUrl)}>
                        {copiedValue === editingItem.storageUrl ? t('copied') : t('copy')}
                      </button>
                    </div>
                    <div className="jeeby-cms-image-done-row">
                      <button type="button" className="jeeby-cms-btn-primary" onClick={handleSaveEdit}>{t('save')}</button>
                      <button type="button" className="jeeby-cms-btn-ghost" onClick={() => setEditingId(null)}>{t('close')}</button>
                    </div>
                    {editSaveError && (
                      <p className="jeeby-cms-inline-error" role="alert">{editSaveError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {mode === 'select-multi' && selected.size > 0 && (
          <div className="jeeby-cms-media-library-footer" role="region" aria-label={t('selectionSummary')}>
            <span>{tf(t('selectedCount'), { count: selected.size })}</span>
            <button type="button" className="jeeby-cms-btn-primary" onClick={handleConfirmSelection}>
              {tf(t(selected.size === 1 ? 'addImage' : 'addImages'), { count: selected.size })}
            </button>
          </div>
        )}
      </div>

      {lightboxOpen && editingItem && (
        <div
          ref={lightboxRef}
          className="jeeby-cms-media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('fullImagePreview')}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            ref={lightboxCloseRef}
            type="button"
            className="jeeby-cms-media-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label={t('closePreview')}
          >
            ✕
          </button>
          <img
            src={editingItem.storageUrl}
            alt={editDraft.alt || editingItem.alt || ''}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </ModalShell>
  )
}

export default MediaLibraryModal
