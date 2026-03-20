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

export function EditorHeader({ pageName, slug, saveStatus, onRetry, onBackClick, onRenameName, onRenameSlug, lastPublishedAt, hasDraftChanges, onPublish, publishStatus, publishBtnRef }) {
  const displayName = pageName || slug

  // Title inline edit
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(displayName)

  // Slug inline edit
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugValue, setSlugValue] = useState(slug)
  const [slugDirty, setSlugDirty] = useState(false)

  const status = getDocumentStatus({ saveStatus, hasDraftChanges, lastPublishedAt })

  // Sync from props after external rename
  useEffect(() => { setTitleValue(pageName || slug) }, [pageName, slug])
  useEffect(() => { setSlugValue(slug); setSlugDirty(false) }, [slug])

  // ── Title handlers ──────────────────────────────────────────────

  function commitTitle() {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== displayName) {
      onRenameName(trimmed)
    } else {
      setTitleValue(displayName)
    }
    setEditingTitle(false)
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur() }
    if (e.key === 'Escape') { setTitleValue(displayName); setEditingTitle(false) }
  }

  // ── Slug handlers ───────────────────────────────────────────────

  function commitSlug() {
    const trimmed = slugValue.trim()
    if (trimmed && trimmed !== slug) {
      onRenameSlug(trimmed)
    } else {
      setSlugValue(slug)
      setSlugDirty(false)
    }
    setEditingSlug(false)
  }

  function handleSlugChange(e) {
    setSlugValue(e.target.value)
    setSlugDirty(e.target.value !== slug)
  }

  function handleSlugKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur() }
    if (e.key === 'Escape') { setSlugValue(slug); setSlugDirty(false); setEditingSlug(false) }
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

      {/* Center zone: page identity — editable title + editable slug */}
      <div className="jeeby-cms-editor-zone-center">
        {editingTitle ? (
          <input
            type="text"
            className="jeeby-cms-editor-title-input"
            value={titleValue}
            aria-label="Page name"
            onChange={e => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          /*
           * <button> inside <h1>: valid HTML5. The heading provides document structure;
           * the button provides the native interactive semantics (keyboard operable,
           * announced as "button" by screen readers). WCAG 4.1.2 satisfied.
           */
          <h1 className="jeeby-cms-editor-title">
            <button
              className="jeeby-cms-editor-title-btn"
              onClick={() => setEditingTitle(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingTitle(true) } }}
              aria-label={`Page name: ${displayName}. Click to edit`}
            >
              {displayName}
            </button>
          </h1>
        )}

        <div className="jeeby-cms-slug-row">
          <span className="jeeby-cms-slug-prefix" aria-hidden="true">/</span>
          {editingSlug ? (
            <>
              <input
                type="text"
                className="jeeby-cms-slug-input"
                value={slugValue}
                aria-label="Page slug"
                onChange={handleSlugChange}
                onBlur={commitSlug}
                onKeyDown={handleSlugKeyDown}
                autoFocus
              />
              {slugDirty && (
                <span className="jeeby-cms-slug-hint" aria-live="polite">
                  Enter to save
                </span>
              )}
            </>
          ) : (
            <button
              className="jeeby-cms-slug-read-btn"
              onClick={() => setEditingSlug(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingSlug(true) } }}
              aria-label={`Page slug: ${slug}. Click to edit`}
            >
              {slug}
            </button>
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
