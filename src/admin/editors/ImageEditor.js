"use client"

import { useState } from 'react'

// ImageEditor — URL + alt text inputs with image preview.
// Props: { data: { src, alt, caption }, onChange, blockId }
//
// CRITICAL: writes data.src (NOT data.url) — matches Image.js front-end field schema.
// See RESEARCH.md Pitfall 4.
//
// Empty state: URL input is always visible — block-aux pattern is wrong for primary
// content inputs that editors must discover. Once an image is loaded, the URL and
// alt text inputs move into block-aux as secondary edit controls.
//
// ACCESSIBILITY: WCAG 1.1.1 (alt text input + hint), 4.1.2 (labelled inputs),
//   1.4.3 (UI component contrast), 2.5.3 (visible label matches accessible name)
export function ImageEditor({ data, onChange, blockId }) {
  // imgError tracks broken image URLs — onError fires when src fails to load
  const [imgError, setImgError] = useState(false)

  const hasImage = data?.src && !imgError

  // Empty state — URL input always visible, no block-aux gating
  if (!hasImage) {
    return (
      <div className="jeeby-cms-image-empty">
        <div className="jeeby-cms-image-empty-area" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="26" height="22" rx="3" />
            <circle cx="11" cy="13" r="2.5" />
            <path d="M3 22 l7-7 5 5 4-4 10 9" />
          </svg>
        </div>
        <div className="jeeby-cms-image-empty-inputs">
          <label htmlFor={'block-input-' + blockId} className="jeeby-cms-field-label">
            Image URL
          </label>
          <input
            id={'block-input-' + blockId}
            type="url"
            value={data?.src ?? ''}
            aria-label="Image URL"
            placeholder="https://example.com/image.jpg"
            onChange={(e) => { setImgError(false); onChange({ ...data, src: e.target.value }) }}
            className="jeeby-cms-image-url-input"
          />
          {data?.src && imgError && (
            <p role="alert" className="jeeby-cms-inline-error" style={{ marginTop: 4 }}>
              Image not found — check the URL is correct and publicly accessible.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Loaded state — preview always visible; URL + alt text in block-aux as edit controls
  return (
    <div>
      <figure style={{ margin: 0 }}>
        <img
          src={data.src}
          alt={data?.alt ?? ''}
          onError={() => setImgError(true)}
          style={{ maxWidth: '100%', maxHeight: '360px', display: 'block', borderRadius: '4px' }}
        />
      </figure>

      <div className="jeeby-cms-block-aux">
        <input
          id={'block-input-' + blockId}
          type="url"
          value={data?.src ?? ''}
          aria-label="Image URL"
          placeholder="https://example.com/image.jpg"
          onChange={(e) => { setImgError(false); onChange({ ...data, src: e.target.value }) }}
          style={{ width: '100%', minHeight: '44px' }}
        />
        <input
          type="text"
          value={data?.alt ?? ''}
          aria-label="Alt text"
          aria-describedby={'alt-hint-' + blockId}
          placeholder="Describe the image for screen readers"
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
          style={{ width: '100%', minHeight: '44px', marginTop: '4px' }}
        />
        <p id={'alt-hint-' + blockId} className="jeeby-cms-field-hint">
          Alt text describes the image for screen readers
        </p>
      </div>
    </div>
  )
}

export default ImageEditor
