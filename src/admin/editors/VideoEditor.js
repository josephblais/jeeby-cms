"use client"

import { toEmbedUrl } from '../../blocks/Video.js'

// VideoEditor — URL input with iframe preview for recognized embed URLs.
// Props: { data: { url }, onChange, blockId }
//
// toEmbedUrl (from Video.js) returns the embed URL for YouTube/Vimeo/Loom,
// or the original URL unchanged for unrecognized platforms.
// We show an error when the URL is entered but is NOT recognized (embed URL unchanged).
//
// Empty state: URL input always visible — block-aux pattern is wrong for a block with
// no visible content until a URL is set. Mirrors ImageEditor empty-state pattern.
//
// ACCESSIBILITY: WCAG 4.1.2 (iframe title, labelled input), 1.4.3 (error color not sole indicator),
//   role="alert" on error so screen readers announce it immediately (WCAG 4.1.3)
export function VideoEditor({ data, onChange, blockId }) {
  const rawUrl = data?.url ?? ''
  const embedUrl = rawUrl ? toEmbedUrl(rawUrl) : null

  // toEmbedUrl returns a modified URL for known platforms, original URL for unknown.
  // isRecognized is true when toEmbedUrl transformed the URL.
  const isRecognized = rawUrl && embedUrl !== rawUrl
  const showError = rawUrl.length > 0 && !isRecognized

  // Empty or unrecognized — URL input always visible so editors can discover the block.
  // Matches ImageEditor's empty-state pattern (no block-aux gating for primary input).
  if (!isRecognized) {
    return (
      <div className="jeeby-cms-video-empty">
        <div className="jeeby-cms-video-empty-area" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="26" height="22" rx="3" />
            <polygon fill="currentColor" stroke="none" points="13,11 23,16 13,21" />
          </svg>
        </div>
        <div className="jeeby-cms-video-empty-inputs">
          <label htmlFor={'block-input-' + blockId} className="jeeby-cms-field-label">
            Video URL
          </label>
          <input
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
