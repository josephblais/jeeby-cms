"use client"

import { toEmbedUrl } from '../../blocks/Video.js'

// VideoEditor — URL input with iframe preview for recognized embed URLs.
// Props: { data: { url }, onChange, blockId }
//
// toEmbedUrl (from Video.js) returns the embed URL for YouTube/Vimeo/Loom,
// or the original URL unchanged for unrecognized platforms.
// We show an error when the URL is entered but is NOT recognized (embed URL unchanged).
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <input
          id={'block-input-' + blockId}
          type="url"
          value={rawUrl}
          aria-label="Video URL (YouTube, Vimeo, or Loom)"
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: '44px',
          }}
        />
        <p>
          YouTube, Vimeo, or Loom URLs are supported
        </p>
        {/* role="alert" announces error immediately to screen reader users (WCAG 4.1.3) */}
        {showError && (
          <p role="alert">
            Unrecognised video URL
          </p>
        )}
      </div>

      {/* iframe preview — only shown when URL is recognized embed platform */}
      {embedUrl && isRecognized && (
        <div style={{ aspectRatio: '16/9', width: '100%' }}>
          <iframe
            title="Video preview"
            src={embedUrl}
            allow="accelerometer; autoplay; encrypted-media"
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        </div>
      )}
    </div>
  )
}

export default VideoEditor
