"use client"

import { useState, useRef, useEffect, memo } from 'react'
import { uploadFile, validateImageFile, MIME_TO_EXT } from '../../firebase/storage.js'
import { addMediaItem } from '../../firebase/firestore.js'
import { useCMSFirebase } from '../../index.js'
import { useT, tf } from '../useT.js'
import { MediaLibraryModal } from '../MediaLibraryModal.js'

// ImageEditor — URL + alt text inputs with image preview.
// Props: { data: { src, alt, caption }, onChange, blockId }
//
// CRITICAL: writes data.src (NOT data.url) — matches Image.js front-end field schema.
// See RESEARCH.md Pitfall 4.
//
// States:
//   view mode (empty)  — icon + hint, click/Enter to edit. Shown when src is empty and at rest.
//   edit mode (empty)  — icon + URL/alt inputs. Auto-entered for new empty blocks; entered on click.
//   view mode (loaded) — image preview only, click/Enter to edit.
//   edit mode (loaded) — image preview above URL + alt fields, blur exits.
//
// Alt text is always reachable in edit states (never hidden behind block-aux)
// to prevent editors from publishing images without alt text (WCAG 1.1.1 failure).
//
// TODO: data.caption is in the schema but not yet surfaced as an input field.
//   Add a caption input below alt text (optional, renders as <figcaption> on the front end).
//
// ACCESSIBILITY: WCAG 1.1.1 (alt text always reachable), 4.1.2 (visible labels + htmlFor),
//   1.4.3 (UI component contrast), 2.5.3 (visible label matches accessible name),
//   2.4.11 (focus appearance), 4.1.3 (status messages via role=alert)

// Hoisted outside the component — static SVG with no props or closures.
// Defining inside the component body causes React to treat them as new component
// types each render, forcing unmount/remount of the SVG instead of a no-op update.
function IconImage() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="26" height="22" rx="3" />
      <circle cx="11" cy="13" r="2.5" />
      <path d="M3 22 l7-7 5 5 4-4 10 9" />
    </svg>
  )
}

function IconPencil() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function ImageEditor({ data, onChange, blockId }) {
  const [imgError, setImgError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef(null)
  const urlInputRef = useRef(null)
  const viewButtonRef = useRef(null)
  const { storage, db, locale, isLocalized } = useCMSFirebase()
  const t = useT()

  // Locale-aware read helpers — resolved to current locale's string value.
  // When isLocalized is false, reads the plain string field (D-06 compatibility).
  const alt = isLocalized ? (data?.alt?.[locale] ?? '') : (data?.alt ?? '')
  const caption = isLocalized ? (data?.caption?.[locale] ?? '') : (data?.caption ?? '')

  function updateAlt(newAlt) {
    onChange(
      isLocalized
        ? { ...data, alt: { ...(data.alt ?? {}), [locale]: newAlt } }
        : { ...data, alt: newAlt }
    )
  }

  function updateCaption(newCaption) {
    onChange(
      isLocalized
        ? { ...data, caption: { ...(data.caption ?? {}), [locale]: newCaption } }
        : { ...data, caption: newCaption }
    )
  }

  // null | 0–100 (uploading) | { message: string, retryable: boolean } (error/validation fail)
  const [uploadProgress, setUploadProgress] = useState(null)
  const isUploading = typeof uploadProgress === 'number'
  const uploadError  = uploadProgress !== null && !isUploading ? uploadProgress : null
  const fileInputRef = useRef(null)
  const pendingFileRef = useRef(null)
  const isPickingFile = useRef(false)
  // Local blob URL shown immediately after file selection so the image appears
  // before the Firebase upload completes. Never written to data.src — only used
  // as a display source. Revoked automatically when cleared (see useEffect below).
  const [previewSrc, setPreviewSrc] = useState(null)
  // Populated by uploadFile while a transfer is in progress; calling it cancels
  // the Firebase task (e.g. on component unmount).
  const uploadCancelRef = useRef(null)
  const libraryTriggerRef = useRef(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [pendingLibraryItem, setPendingLibraryItem] = useState(null)
  const [altConflict, setAltConflict] = useState(null)

  // Revoke the blob URL after React has rendered without it to free memory.
  // The cleanup runs with the previous previewSrc value, which means the revoke
  // always happens after the next render — no flicker on the transition to the
  // Firebase URL.
  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc) }
  }, [previewSrc])

  // Cancel any in-flight upload when the component unmounts.
  useEffect(() => {
    return () => { uploadCancelRef.current?.() }
  }, [])

  // data.src is the persisted source; previewSrc is the local blob shown while
  // uploading. displaySrc drives every <img> in this component.
  const displaySrc = previewSrc ?? data?.src
  const hasImage   = displaySrc && !imgError

  // If the loaded image errors, enter edit mode so the user can fix the URL.
  useEffect(() => {
    if (imgError) setIsEditing(true)
  }, [imgError])

  // Reset imgError when data.src changes externally (e.g. real-time sync or
  // programmatic update) so a corrected URL isn't blocked by a stale error state.
  useEffect(() => { setImgError(false) }, [data?.src])

  // Focus the URL input whenever edit mode opens (reliable across React renders).
  useEffect(() => {
    if (isEditing) urlInputRef.current?.focus()
  }, [isEditing])

  const urlInputId = 'block-input-' + blockId
  const altInputId = 'image-alt-' + blockId
  const altHintId  = 'alt-hint-' + blockId

  function enterEditMode() {
    setIsEditing(true)
  }

  function exitEditMode() {
    setIsEditing(false)
    requestAnimationFrame(() => viewButtonRef.current?.focus())
  }

  async function handleUpload(file) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setUploadProgress({ message: validationError, retryable: false })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    pendingFileRef.current = file
    const ext = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : (MIME_TO_EXT[file.type] ?? 'jpg')
    const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
    // Start metadata drafting immediately so title/alt can be entered while upload runs.
    setPendingLibraryItem((prev) => ({
      storageUrl: prev?.storageUrl ?? '',
      storagePath: path,
      title: prev?.title ?? '',
      alt: prev?.alt ?? '',
      altManuallyEdited: prev?.altManuallyEdited ?? false,
      mimeType: file.type,
      size: file.size,
    }))
    // Show a local preview immediately — the image appears before Firebase responds.
    const previewUrl = URL.createObjectURL(file)
    setPreviewSrc(previewUrl)
    setUploadProgress(0)
    try {
      const url = await uploadFile(storage, file, path, (pct) => setUploadProgress(pct), uploadCancelRef)
      onChange({ ...data, src: url })
      setPendingLibraryItem((prev) => prev ? {
        ...prev,
        storageUrl: url,
        storagePath: path,
        mimeType: file.type,
        size: file.size,
      } : prev)
      setUploadProgress(null)
    } catch (err) {
      if (err.code === 'storage/canceled') return  // component unmounting — no state updates
      console.error('[jeeby-cms] Image upload failed:', err)
      setUploadProgress({ message: 'Upload failed — check your connection and try again.', retryable: true })
    } finally {
      // Clear preview regardless of outcome. The useEffect cleanup revokes the
      // blob URL after React renders with either the Firebase URL or no image.
      setPreviewSrc(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleRetry() {
    if (pendingFileRef.current) handleUpload(pendingFileRef.current)
  }

  function handleContainerBlur(e) {
    if (isUploading || isPickingFile.current) return
    if (!(e.relatedTarget instanceof Node) || !containerRef.current?.contains(e.relatedTarget)) {
      setIsEditing(false)
      // Return focus to the view-mode button so it isn't skipped in tab order.
      requestAnimationFrame(() => viewButtonRef.current?.focus())
    }
  }

  async function savePendingLibraryItem() {
    if (!pendingLibraryItem) return
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
      // Keep editor alt in sync with metadata entered during Save to Library.
      // When isLocalized, write to the current locale key; otherwise write plain string.
      if (isLocalized) {
        onChange({ ...data, alt: { ...(data.alt ?? {}), [locale]: trimmedAlt } })
      } else {
        onChange({ ...data, alt: trimmedAlt })
      }
      setPendingLibraryItem(null)
    } catch (err) {
      console.error('[jeeby-cms] Failed to save uploaded image to library:', err)
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

  function applySelectedMedia(item, { replaceAlt }) {
    const newAlt = replaceAlt ? (item.alt ?? '') : alt
    onChange(
      isLocalized
        ? { ...data, src: item.storageUrl, alt: { ...(data.alt ?? {}), [locale]: newAlt } }
        : { ...data, src: item.storageUrl, alt: newAlt }
    )
    setAltConflict(null)
    isPickingFile.current = false
    setLibraryOpen(false)
  }

  function handleLibrarySelect(item) {
    // Use the locale-resolved alt value for conflict detection (D-06 + I18N-12 compatible).
    const existingAlt = alt.trim()
    const incomingAlt = (item?.alt ?? '').trim()
    if (existingAlt && incomingAlt && existingAlt !== incomingAlt) {
      setAltConflict({ item, existingAlt, incomingAlt })
      return
    }
    applySelectedMedia(item, { replaceAlt: Boolean(incomingAlt) })
  }

  // Shared upload controls — identical in both edit modes. Defined as a JSX
  // variable (not a component function) so React never unmounts/remounts the
  // file input or URL input between the two edit-mode render branches.
  const uploadControls = (
    <>
      <div className="jeeby-cms-image-url-row">
        <input
          ref={urlInputRef}
          id={urlInputId}
          type="url"
          value={data?.src ?? ''}
          placeholder="https://example.com/image.jpg"
          onChange={(e) => { setImgError(false); onChange({ ...data, src: e.target.value }) }}
          onBlur={(e) => { const v = e.target.value.trim(); if (v !== e.target.value) onChange({ ...data, src: v }) }}
        />
        <span className="jeeby-cms-image-url-or" aria-hidden="true">or</span>
        <button
          type="button"
          className="jeeby-cms-btn-ghost jeeby-cms-upload-btn"
          aria-label={isUploading ? t('imageUploadingAriaLabel') : t('imageUploadAriaLabel')}
          disabled={isUploading}
          onClick={() => { isPickingFile.current = true; fileInputRef.current?.click() }}
        >
          {isUploading ? t('uploading') : t('upload')}
        </button>
        <button
          ref={libraryTriggerRef}
          type="button"
          className="jeeby-cms-btn-ghost jeeby-cms-upload-btn"
          aria-label={t('imageSelectLibraryAriaLabel')}
          disabled={isUploading}
          onClick={() => { isPickingFile.current = true; setLibraryOpen(true) }}
        >
          {t('libraryBtn')}
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
          isPickingFile.current = false
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
        onCancel={() => { isPickingFile.current = false }}
      />
      {isUploading && (
        <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={Math.round(uploadProgress)} aria-valuemin={0} aria-valuemax={100} aria-label={t('uploadProgressAriaLabel')}>
          <div className="jeeby-cms-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      {uploadError && (
        <div className="jeeby-cms-upload-error-row">
          <p role="alert" className="jeeby-cms-inline-error">{uploadError.message}</p>
          {uploadError.retryable && (
            <button type="button" className="jeeby-cms-btn-ghost" onClick={handleRetry}>{t('retry')}</button>
          )}
        </div>
      )}
      <div className="jeeby-cms-upload-status" aria-live="polite">
        {isUploading ? tf(t('uploadingProgress'), { pct: Math.round(uploadProgress) }) : null}
      </div>
      {pendingLibraryItem && (
        <div className="jeeby-cms-library-meta-form" role="region" aria-label={t('saveUploadedImageRegion')}>
          <p className="jeeby-cms-field-label">{t('saveUploadedImageLabel')}</p>
          <label className="jeeby-cms-field-label" htmlFor={'image-library-title-' + blockId}>{t('titleLabel')}</label>
          <input
            id={'image-library-title-' + blockId}
            type="text"
            value={pendingLibraryItem.title}
            onChange={(e) => handlePendingTitleChange(e.target.value)}
          />
          <label className="jeeby-cms-field-label" htmlFor={'image-library-alt-' + blockId}>{t('altTextLabel')}</label>
          <input
            id={'image-library-alt-' + blockId}
            type="text"
            value={pendingLibraryItem.alt}
            onChange={(e) => setPendingLibraryItem((prev) => prev ? { ...prev, alt: e.target.value, altManuallyEdited: true } : prev)}
          />
          <div className="jeeby-cms-image-done-row">
            <button
              type="button"
              className="jeeby-cms-btn-primary"
              disabled={isUploading || !pendingLibraryItem.storageUrl}
              onClick={savePendingLibraryItem}
            >
              {isUploading ? t('finishingUpload') : t('saveToLibrary')}
            </button>
            <button type="button" className="jeeby-cms-btn-ghost" onClick={() => setPendingLibraryItem(null)}>{t('skip')}</button>
          </div>
        </div>
      )}
      {altConflict && (
        <div className="jeeby-cms-alt-conflict" role="alertdialog" aria-label={t('altConflictAriaLabel')}>
          <p>
            {t('altConflictText')}
          </p>
          <div className="jeeby-cms-alt-conflict-actions">
            <button
              type="button"
              className="jeeby-cms-btn-ghost"
              onClick={() => applySelectedMedia(altConflict.item, { replaceAlt: false })}
            >
              {t('keepCurrentAlt')}
            </button>
            <button
              type="button"
              className="jeeby-cms-btn-primary"
              onClick={() => applySelectedMedia(altConflict.item, { replaceAlt: true })}
            >
              {t('useLibraryAlt')}
            </button>
          </div>
        </div>
      )}
    </>
  )

  // View mode — icon + hint, click or keyboard to enter edit mode
  if (!hasImage && !isEditing) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          id={urlInputId}
          aria-label={t('imageEmptyAriaLabel')}
          className="jeeby-cms-image-empty"
          onClick={enterEditMode}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterEditMode() }
          }}
        >
          <div className="jeeby-cms-image-empty-area" aria-hidden="true">
            <IconImage />
          </div>
          <p className="jeeby-cms-image-empty-hint">
            {t('imageAddHint')}
            <span className="jeeby-cms-image-empty-sub">{t('imageAddSub')}</span>
          </p>
        </div>
        <MediaLibraryModal
          open={libraryOpen}
          mode="select-single"
          onSelect={handleLibrarySelect}
          triggerRef={libraryTriggerRef}
          onClose={() => { isPickingFile.current = false; setLibraryOpen(false) }}
        />
      </>
    )
  }

  // Edit mode (empty) — icon + URL/alt inputs, blur exits
  if (!hasImage) {
    return (
      <>
        <div ref={containerRef} className="jeeby-cms-image-empty" onBlur={handleContainerBlur}>
          <div className="jeeby-cms-image-empty-area" aria-hidden="true">
            <IconImage />
          </div>
          <div className="jeeby-cms-image-empty-inputs">
            <label htmlFor={urlInputId} className="jeeby-cms-field-label">{t('imageUrlLabel')}</label>
            {uploadControls}
            {imgError && (
              <p role="alert" className="jeeby-cms-inline-error">
                {t('imageNotFound')}
              </p>
            )}
            <label htmlFor={altInputId} className="jeeby-cms-field-label jeeby-cms-image-alt-label">{t('altTextLabel')}</label>
            <input
              id={altInputId}
              type="text"
              value={alt}
              aria-describedby={altHintId}
              placeholder={t('altPlaceholder')}
              onChange={(e) => updateAlt(e.target.value)}
            />
            <p id={altHintId} className="jeeby-cms-field-hint">
              {t('altHint')}
            </p>
            <div className="jeeby-cms-image-done-row">
              <button
                type="button"
                className="jeeby-cms-btn-ghost jeeby-cms-image-done-btn"
                disabled={isUploading}
                onClick={exitEditMode}
              >
                {t('done')}
              </button>
            </div>
          </div>
        </div>
        <MediaLibraryModal
          open={libraryOpen}
          mode="select-single"
          onSelect={handleLibrarySelect}
          triggerRef={libraryTriggerRef}
          onClose={() => { isPickingFile.current = false; setLibraryOpen(false) }}
        />
      </>
    )
  }

  // Loaded view mode — image only, click or keyboard to enter edit mode
  if (!isEditing) {
    return (
      <>
        <div
          ref={viewButtonRef}
          role="button"
          tabIndex={0}
          aria-label={alt ? tf(t('editImageAlt'), { alt }) : t('imageBlockClickToEdit')}
          aria-expanded={false}
          className="jeeby-cms-image-editor jeeby-cms-image-editor--view"
          onClick={enterEditMode}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterEditMode() }
          }}
        >
          <figure className="jeeby-cms-image-figure">
            <img
              src={displaySrc}
              alt={alt}
              onError={() => setImgError(true)}
              className="jeeby-cms-image-preview"
            />
            <div className="jeeby-cms-image-edit-overlay" aria-hidden="true">
              <IconPencil />
              <span>{t('editImageOverlay')}</span>
            </div>
          </figure>
        </div>
        <MediaLibraryModal
          open={libraryOpen}
          mode="select-single"
          onSelect={handleLibrarySelect}
          triggerRef={libraryTriggerRef}
          onClose={() => { isPickingFile.current = false; setLibraryOpen(false) }}
        />
      </>
    )
  }

  // Loaded edit mode — image + inputs, blur exits
  return (
    <>
      <div ref={containerRef} className="jeeby-cms-image-editor" onBlur={handleContainerBlur}>
        <figure className="jeeby-cms-image-figure">
          <img
            src={displaySrc}
            alt={alt}
            onError={() => setImgError(true)}
            className="jeeby-cms-image-preview"
          />
        </figure>

        <div className="jeeby-cms-image-fields">
          <label htmlFor={urlInputId} className="jeeby-cms-field-label">{t('imageUrlLabel')}</label>
          {uploadControls}
          {imgError && (
            <p role="alert" className="jeeby-cms-inline-error">
              {t('imageNotFound')}
            </p>
          )}
          <label htmlFor={altInputId} className="jeeby-cms-field-label jeeby-cms-image-alt-label">{t('altTextLabel')}</label>
          <input
            id={altInputId}
            type="text"
            value={alt}
            aria-describedby={altHintId}
            placeholder={t('altPlaceholder')}
            onChange={(e) => updateAlt(e.target.value)}
          />
          <p id={altHintId} className="jeeby-cms-field-hint">
            {t('altHint')}
          </p>
          <div className="jeeby-cms-image-done-row">
            <button
              type="button"
              className="jeeby-cms-btn-ghost jeeby-cms-image-done-btn"
              disabled={isUploading}
              onClick={exitEditMode}
            >
              {t('done')}
            </button>
          </div>
        </div>
      </div>
      <MediaLibraryModal
        open={libraryOpen}
        mode="select-single"
        onSelect={handleLibrarySelect}
        triggerRef={libraryTriggerRef}
        onClose={() => { isPickingFile.current = false; setLibraryOpen(false) }}
      />
    </>
  )
}

export default ImageEditor
