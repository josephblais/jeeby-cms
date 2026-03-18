"use client"
import { useState, useEffect } from 'react'

export function EditorHeader({ pageName, slug, saveStatus, onRetry, onBackClick, onRenameSlug }) {
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
    <header className="jeeby-cms-editor-header" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <a
        href="/admin"
        onClick={onBackClick}
        aria-label="Back to Pages"
        style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
      >
        ← Pages
      </a>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <h1 className="jeeby-cms-editor-title" style={{ margin: 0 }}>{pageName || slug}</h1>
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
            style={{ minHeight: '44px' }}
          />
          {slugDirty && (
            <span className="jeeby-cms-slug-hint" aria-live="polite">
              Press Enter to rename
            </span>
          )}
        </div>
      </div>

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
              onClick={onRetry}
              style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}
            >Retry?</button>
          </span>
        )}
      </div>
    </header>
  )
}
