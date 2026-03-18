"use client"

import { useState } from 'react'

// ImageEditor — URL + alt text inputs with image preview.
// Props: { data: { src, alt, caption }, onChange, blockId }
//
// CRITICAL: writes data.src (NOT data.url) — matches Image.js front-end field schema.
// See RESEARCH.md Pitfall 4.
//
// ACCESSIBILITY: WCAG 1.1.1 (alt text input + hint), 4.1.2 (labelled inputs),
//   1.4.3 (UI component contrast), 2.5.3 (visible label matches accessible name)
export function ImageEditor({ data, onChange, blockId }) {
  // imgError tracks broken image URLs — onError fires when src fails to load
  const [imgError, setImgError] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Image URL — type="url" triggers appropriate virtual keyboard on mobile */}
      <input
        id={'block-input-' + blockId}
        type="url"
        value={data?.src ?? ''}
        aria-label="Image URL"
        placeholder="https://example.com/image.jpg"
        onChange={(e) => { setImgError(false); onChange({ ...data, src: e.target.value }) }}
        style={{
          width: '100%', padding: '8px 12px', fontSize: '14px',
          border: '1px solid #E5E7EB', borderRadius: '4px', boxSizing: 'border-box',
          minHeight: '44px',
        }}
      />

      {/* Alt text — linked to descriptive hint via aria-describedby (WCAG 1.3.1) */}
      <div>
        <input
          type="text"
          value={data?.alt ?? ''}
          aria-label="Alt text"
          aria-describedby={'alt-hint-' + blockId}
          placeholder="Describe the image for screen readers"
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
          style={{
            width: '100%', padding: '8px 12px', fontSize: '14px',
            border: '1px solid #E5E7EB', borderRadius: '4px', boxSizing: 'border-box',
            minHeight: '44px',
          }}
        />
        <p id={'alt-hint-' + blockId} style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
          Describe the image for screen readers
        </p>
      </div>

      {/* Image preview — uses <figure> for semantic grouping (WCAG 1.3.1) */}
      {data?.src && !imgError && (
        <figure style={{ margin: '8px 0 0' }}>
          <img
            src={data.src}
            alt={data?.alt ?? ''}
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '4px', display: 'block' }}
          />
        </figure>
      )}

      {/* Error fallback — shown when image URL resolves but image fails to load */}
      {data?.src && imgError && (
        <div style={{
          background: '#F3F4F6', padding: '24px', borderRadius: '4px',
          textAlign: 'center', color: '#6B7280', fontSize: '14px',
        }}>
          Image not found. Check that the URL is correct and publicly accessible.
        </div>
      )}
    </div>
  )
}

export default ImageEditor
