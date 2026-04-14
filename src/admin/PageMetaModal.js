"use client"
import { useState, useEffect, useRef } from 'react'
import { ModalShell } from './ModalShell.js'
import { MediaLibraryModal } from './MediaLibraryModal.js'

const DESCRIPTION_MAX = 160

export function PageMetaModal({ open, onClose, triggerRef, meta, onSave, saving }) {
  const [description, setDescription] = useState('')
  const [shareImageUrl, setShareImageUrl] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const libraryTriggerRef = useRef(null)

  // Reset local state each time modal opens
  useEffect(() => {
    if (open) {
      setDescription(meta?.description ?? '')
      setShareImageUrl(meta?.shareImageUrl ?? '')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ description: description.trim(), shareImageUrl: shareImageUrl.trim() })
  }

  function handleLibrarySelect(item) {
    setShareImageUrl(item.storageUrl)
    setLibraryOpen(false)
  }

  const descLength = description.length
  const descOver = descLength > DESCRIPTION_MAX

  return (
    <>
      <ModalShell
        open={open}
        labelId="meta-modal-heading"
        triggerRef={triggerRef}
        onClose={onClose}
        cardClassName="jeeby-cms-modal-card--meta"
      >
        <h2 id="meta-modal-heading">Page settings</h2>
        <form onSubmit={handleSubmit} noValidate>

          {/* Description */}
          <div className="jeeby-cms-field">
            <label htmlFor="cms-meta-description">
              Description
            </label>
            <textarea
              id="cms-meta-description"
              data-autofocus
              rows={3}
              maxLength={DESCRIPTION_MAX + 20}
              value={description}
              onChange={e => setDescription(e.target.value)}
              aria-describedby="cms-meta-description-hint cms-meta-description-count"
            />
            <div className="jeeby-cms-meta-description-footer">
              <span id="cms-meta-description-hint" className="jeeby-cms-field-hint">
                Shown in search results and social share previews.
              </span>
              <span
                id="cms-meta-description-count"
                className={`jeeby-cms-field-hint jeeby-cms-meta-char-count${descOver ? ' jeeby-cms-meta-char-count--over' : ''}`}
                aria-live="polite"
                aria-atomic="true"
              >
                {descLength}/{DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          {/* Share image */}
          <div className="jeeby-cms-field">
            <label htmlFor="cms-meta-share-image">Share image</label>
            <div className="jeeby-cms-meta-image-row">
              <input
                id="cms-meta-share-image"
                type="url"
                placeholder="https://"
                value={shareImageUrl}
                onChange={e => setShareImageUrl(e.target.value)}
                aria-describedby="cms-meta-share-image-hint"
              />
              <button
                ref={libraryTriggerRef}
                type="button"
                className="jeeby-cms-btn-ghost jeeby-cms-meta-library-btn"
                onClick={() => setLibraryOpen(true)}
              >
                Library
              </button>
            </div>
            <span id="cms-meta-share-image-hint" className="jeeby-cms-field-hint">
              Used as the Open Graph image for social sharing.
            </span>
            {shareImageUrl && (
              <div className="jeeby-cms-meta-image-preview">
                <img
                  src={shareImageUrl}
                  alt="Share image preview"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
                <button
                  type="button"
                  className="jeeby-cms-meta-image-remove"
                  aria-label="Remove share image"
                  onClick={() => setShareImageUrl('')}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="jeeby-cms-modal-actions">
            <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="jeeby-cms-btn-primary"
              disabled={saving || descOver}
              aria-busy={saving ? 'true' : undefined}
              style={{ cursor: saving || descOver ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </form>
      </ModalShell>

      <MediaLibraryModal
        open={libraryOpen}
        mode="select-single"
        onSelect={handleLibrarySelect}
        onClose={() => setLibraryOpen(false)}
        triggerRef={libraryTriggerRef}
      />
    </>
  )
}
