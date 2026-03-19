"use client"
import { useState, useEffect } from 'react'

function formatDate(ts) {
  if (!ts) return 'Never'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function EditorHeader({ pageName, slug, saveStatus, onRetry, onBackClick, onRenameSlug, lastPublishedAt, hasDraftChanges, onPublish, publishStatus, publishBtnRef }) {
  const [editingSlug, setEditingSlug] = useState(slug)
  const [slugDirty, setSlugDirty] = useState(false)

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
      <a
        href="/admin"
        onClick={onBackClick}
        aria-label="Back to Pages"
      >
        ← Pages
      </a>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <h1 className="jeeby-cms-editor-title">{pageName || slug}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              Press Enter to rename
            </span>
          )}
        </div>
      </div>

      <div className="jeeby-cms-publish-controls">
        <span className="jeeby-cms-publish-status">
          Last published: {formatDate(lastPublishedAt)}
        </span>
        {hasDraftChanges && (
          <>
            <span aria-hidden="true">&middot;</span>
            <span className="jeeby-cms-draft-indicator">Unpublished changes</span>
          </>
        )}
        <div
          role="status"
          aria-live={saveStatus === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {saveStatus === 'saving' && <span>Saving...</span>}
          {saveStatus === 'saved' && <span>Saved</span>}
          {saveStatus === 'error' && (
            <span>
              Save failed.{' '}
              <button
                type="button"
                className="jeeby-cms-btn-ghost"
                onClick={onRetry}
              >Retry?</button>
            </span>
          )}
        </div>
        <button
          ref={publishBtnRef}
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={onPublish}
          aria-disabled={publishStatus === 'publishing' || saveStatus === 'saving' ? 'true' : undefined}
          aria-busy={publishStatus === 'publishing' ? 'true' : undefined}
          style={{ cursor: publishStatus === 'publishing' || saveStatus === 'saving' ? 'not-allowed' : 'pointer', pointerEvents: publishStatus === 'publishing' || saveStatus === 'saving' ? 'none' : undefined }}
        >
          {publishStatus === 'publishing' ? 'Publishing\u2026' : 'Publish'}
        </button>
      </div>
    </header>
  )
}
