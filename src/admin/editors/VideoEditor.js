"use client"

import { useState, useRef, useEffect } from 'react'
import { toEmbedUrl } from '../../blocks/Video.js'

// VideoEditor — URL input with iframe preview for recognized embed URLs.
// Props: { data: { url }, onChange, blockId }
//
// States:
//   view mode  — icon + hint, click/Enter to edit. Shown when url is empty and at rest.
//   edit mode  — icon + URL input. Auto-entered for new empty blocks; entered on click.
//   loaded     — iframe preview with URL input in block-aux.
//
// toEmbedUrl returns the embed URL for YouTube/Vimeo/Loom, or the original URL unchanged.
// isRecognized is true when toEmbedUrl transformed the URL (known platform).
// showError is true when a URL has been entered but is not recognized.
//
// ACCESSIBILITY: WCAG 4.1.2 (iframe title, labelled input), 1.4.3 (error color not sole indicator),
//   role="alert" on error so screen readers announce it immediately (WCAG 4.1.3)
export function VideoEditor({ data, onChange, blockId }) {
  const rawUrl = data?.url ?? ''
  const embedUrl = rawUrl ? toEmbedUrl(rawUrl) : null
  const isRecognized = rawUrl && embedUrl !== rawUrl
  const showError = rawUrl.length > 0 && !isRecognized

  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef(null)
  const urlInputRef = useRef(null)

  // If the URL is entered but unrecognized, stay in edit mode so user can fix it.
  useEffect(() => {
    if (showError) setIsEditing(true)
  }, [showError])

  function enterEditMode() {
    setIsEditing(true)
    requestAnimationFrame(() => urlInputRef.current?.focus())
  }

  function handleContainerBlur(e) {
    if (!(e.relatedTarget instanceof Node) || !containerRef.current?.contains(e.relatedTarget)) {
      setIsEditing(false)
    }
  }

  const IconVideo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="26" height="22" rx="3" />
      <polygon fill="currentColor" stroke="none" points="13,11 23,16 13,21" />
    </svg>
  )

  // View mode — icon + hint, click or keyboard to enter edit mode
  if (!isRecognized && !isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        id={'block-input-' + blockId}
        aria-label="Video — click to add video URL"
        className="jeeby-cms-video-empty"
        onClick={enterEditMode}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterEditMode() }
        }}
      >
        <div className="jeeby-cms-video-empty-area" aria-hidden="true">
          <IconVideo />
        </div>
        <p className="jeeby-cms-video-empty-hint">Video — click to add video URL</p>
      </div>
    )
  }

  // Edit mode (empty/unrecognized) — icon + URL input, blur exits
  if (!isRecognized) {
    return (
      <div ref={containerRef} className="jeeby-cms-video-empty" onBlur={handleContainerBlur}>
        <div className="jeeby-cms-video-empty-area" aria-hidden="true">
          <IconVideo />
        </div>
        <div className="jeeby-cms-video-empty-inputs">
          <label htmlFor={'block-input-' + blockId} className="jeeby-cms-field-label">
            Video URL
          </label>
          <input
            ref={urlInputRef}
            id={'block-input-' + blockId}
            type="url"
            value={rawUrl}
            aria-label="Video URL (YouTube, Vimeo, or Loom)"
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            className="jeeby-cms-video-url-input"
          />
          <p className="jeeby-cms-field-hint">YouTube, Vimeo, or Loom URLs are supported</p>
          {/* role="alert" announces error immediately to screen reader users (WCAG 4.1.3) */}
          {showError && (
            <p role="alert" className="jeeby-cms-inline-error">
              Unrecognised video URL
            </p>
          )}
        </div>
      </div>
    )
  }

  // Recognized URL — iframe preview always visible; URL input in block-aux as edit control
  return (
    <div>
      <div style={{ aspectRatio: '16/9', width: '100%' }}>
        <iframe
          title="Video preview"
          src={embedUrl}
          allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
          style={{ width: '100%', height: '100%', border: 0, borderRadius: '4px' }}
        />
      </div>

      {/* Aux editing controls — URL input, revealed on block hover/focus */}
      <div className="jeeby-cms-block-aux">
        <input
          id={'block-input-' + blockId}
          type="url"
          value={rawUrl}
          aria-label="Video URL (YouTube, Vimeo, or Loom)"
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          style={{ width: '100%', minHeight: '44px' }}
        />
        <p className="jeeby-cms-field-hint">YouTube, Vimeo, or Loom URLs are supported</p>
      </div>
    </div>
  )
}

export default VideoEditor
