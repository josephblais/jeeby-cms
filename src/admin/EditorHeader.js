"use client"
import { useState, useEffect } from 'react'

function formatPublishedDate(ts) {
  if (!ts) return null
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const isToday = date.toDateString() === new Date().toDateString()
  if (isToday) {
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `today at ${time}`
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Derives a single compound status from all document signals.
// Priority: error > saving > unpublished changes > published > idle.
function getDocumentStatus({ saveStatus, hasDraftChanges, lastPublishedAt }) {
  if (saveStatus === 'error') {
    return { label: 'Save failed', tone: 'error', retry: true }
  }
  if (saveStatus === 'saving') {
    return { label: 'Saving\u2026', tone: 'muted', retry: false }
  }
  if (hasDraftChanges) {
    return {
      label: saveStatus === 'saved' ? 'Unpublished, saved' : 'Unsaved changes',
      tone: 'draft',
      retry: false,
    }
  }
  if (lastPublishedAt) {
    const date = formatPublishedDate(lastPublishedAt)
    return { label: date ? `Published ${date}` : 'Published', tone: 'published', retry: false }
  }
  return { label: 'Not yet live', tone: 'muted', retry: false }
}

export function EditorHeader({ pageName, slug, saveStatus, onRetry, onBackClick, onRenameSlug, lastPublishedAt, hasDraftChanges, onPublish, publishStatus, publishBtnRef }) {
  const [editingSlug, setEditingSlug] = useState(slug)
  const [slugDirty, setSlugDirty] = useState(false)
  const status = getDocumentStatus({ saveStatus, hasDraftChanges, lastPublishedAt })

  useEffect(() => { setEditingSlug(slug); setSlugDirty(false) }, [slug])

  function handleSlugChange(e) {
    setEditingSlug(e.target.value)
    setSlugDirty(e.target.value !== slug)
  }

  function commitSlug() {
    const trimmed = editingSlug.trim()
    if (trimmed && trimmed !== slug) {
      onRenameSlug(trimmed)
    } else {
      setEditingSlug(slug)
      setSlugDirty(false)
    }
  }

  function handleSlugKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur() }
    if (e.key === 'Escape') { setEditingSlug(slug); setSlugDirty(false); e.target.blur() }
  }

  return (
    <header className="jeeby-cms-editor-header">

      {/* Left zone: back navigation */}
      <div className="jeeby-cms-editor-zone-left">
        <a
          href="/admin"
          onClick={onBackClick}
          className="jeeby-cms-editor-back"
          aria-label="Back to Pages"
        >
          ← Pages
        </a>
      </div>

      {/* Center zone: page identity — title + slug editor */}
      <div className="jeeby-cms-editor-zone-center">
        <h1 className="jeeby-cms-editor-title">{pageName || slug}</h1>
        <div className="jeeby-cms-slug-row">
          <span className="jeeby-cms-slug-prefix" aria-hidden="true">/</span>
          <input
            id="jeeby-slug-input"
            className="jeeby-cms-slug-input"
            type="text"
            value={editingSlug}
            aria-label="Page slug"
            onChange={handleSlugChange}
            onBlur={commitSlug}
            onKeyDown={handleSlugKeyDown}
          />
          {slugDirty && (
            <span className="jeeby-cms-slug-hint" aria-live="polite">
              Enter to save
            </span>
          )}
        </div>
      </div>

      {/* Right zone: document status chip + publish action */}
      <div className="jeeby-cms-editor-zone-right">
        <div
          role="status"
          aria-live={saveStatus === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          className={`jeeby-cms-doc-status jeeby-cms-doc-status--${status.tone}`}
        >
          <span>{status.label}</span>
          {status.retry && (
            <button
              type="button"
              className="jeeby-cms-status-retry"
              onClick={onRetry}
            >
              Try again
            </button>
          )}
        </div>
        <button
          ref={publishBtnRef}
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={onPublish}
          aria-disabled={publishStatus === 'publishing' || saveStatus === 'saving' ? 'true' : undefined}
          aria-busy={publishStatus === 'publishing' ? 'true' : undefined}
          style={{
            cursor: publishStatus === 'publishing' || saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            pointerEvents: publishStatus === 'publishing' || saveStatus === 'saving' ? 'none' : undefined,
          }}
        >
          {publishStatus === 'publishing' ? 'Publishing\u2026' : 'Publish'}
        </button>
      </div>

    </header>
  )
}
