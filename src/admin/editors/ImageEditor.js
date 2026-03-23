"use client"

import { useState, useRef, useEffect } from 'react'

// ImageEditor — URL + alt text inputs with image preview.
// Props: { data: { src, alt, caption }, onChange, blockId }
//
// CRITICAL: writes data.src (NOT data.url) — matches Image.js front-end field schema.
// See RESEARCH.md Pitfall 4.
//
// States:
//   view mode (empty)  — icon + hint, click/Enter to edit. Shown when src is empty and at rest.
//   edit mode (empty)  — icon + URL/alt inputs. Auto-entered for new empty blocks; entered on click.
//   view mode (loaded) — image preview only, click/Enter to edit.
//   edit mode (loaded) — image preview above URL + alt fields, blur exits.
//
// Alt text is always reachable in edit states (never hidden behind block-aux)
// to prevent editors from publishing images without alt text (WCAG 1.1.1 failure).
//
// ACCESSIBILITY: WCAG 1.1.1 (alt text always reachable), 4.1.2 (visible labels + htmlFor),
//   1.4.3 (UI component contrast), 2.5.3 (visible label matches accessible name),
//   2.4.11 (focus appearance), 4.1.3 (status messages via role=alert)
export function ImageEditor({ data, onChange, blockId }) {
  const [imgError, setImgError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef(null)
  const urlInputRef = useRef(null)
  const viewButtonRef = useRef(null)

  const hasImage = data?.src && !imgError

  // If the loaded image errors, enter edit mode so the user can fix the URL.
  useEffect(() => {
    if (imgError) setIsEditing(true)
  }, [imgError])

  // Focus the URL input whenever edit mode opens (reliable across React renders).
  useEffect(() => {
    if (isEditing) urlInputRef.current?.focus()
  }, [isEditing])

  const urlInputId = 'block-input-' + blockId
  const altInputId = 'image-alt-' + blockId
  const altHintId  = 'alt-hint-' + blockId

  function enterEditMode() {
    setIsEditing(true)
  }

  function handleContainerBlur(e) {
    if (!(e.relatedTarget instanceof Node) || !containerRef.current?.contains(e.relatedTarget)) {
      setIsEditing(false)
      // Return focus to the view-mode button so it isn't skipped in tab order.
      requestAnimationFrame(() => viewButtonRef.current?.focus())
    }
  }

  const IconImage = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="26" height="22" rx="3" />
      <circle cx="11" cy="13" r="2.5" />
      <path d="M3 22 l7-7 5 5 4-4 10 9" />
    </svg>
  )

  // View mode — icon + hint, click or keyboard to enter edit mode
  if (!hasImage && !isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        id={urlInputId}
        aria-label="Image — click to add image URL"
        className="jeeby-cms-image-empty"
        onClick={enterEditMode}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterEditMode() }
        }}
      >
        <div className="jeeby-cms-image-empty-area" aria-hidden="true">
          <IconImage />
        </div>
        <p className="jeeby-cms-image-empty-hint">Image — click to add image URL</p>
      </div>
    )
  }

  // Edit mode (empty) — icon + URL/alt inputs, blur exits
  if (!hasImage) {
    return (
      <div ref={containerRef} className="jeeby-cms-image-empty" onBlur={handleContainerBlur}>
        <div className="jeeby-cms-image-empty-area" aria-hidden="true">
          <IconImage />
        </div>
        <div className="jeeby-cms-image-empty-inputs">
          <label htmlFor={urlInputId} className="jeeby-cms-field-label">Image URL</label>
          <input
            ref={urlInputRef}
            id={urlInputId}
            type="url"
            value={data?.src ?? ''}
            placeholder="https://example.com/image.jpg"
            onChange={(e) => { setImgError(false); onChange({ ...data, src: e.target.value }) }}
          />
          {data?.src && imgError && (
            <p role="alert" className="jeeby-cms-inline-error">
              Image not found — check the URL is correct and publicly accessible.
            </p>
          )}
          <label htmlFor={altInputId} className="jeeby-cms-field-label jeeby-cms-image-alt-label">Alt text</label>
          <input
            id={altInputId}
            type="text"
            value={data?.alt ?? ''}
            aria-describedby={altHintId}
            placeholder="Describe the image for screen readers"
            onChange={(e) => onChange({ ...data, alt: e.target.value })}
          />
          <p id={altHintId} className="jeeby-cms-field-hint">
            Leave blank only if the image is purely decorative.
          </p>
        </div>
      </div>
    )
  }

  // Loaded view mode — image only, click or keyboard to enter edit mode
  if (!isEditing) {
    return (
      <div
        ref={viewButtonRef}
        role="button"
        tabIndex={0}
        aria-label={data?.alt ? `Edit image: ${data.alt}` : 'Image block — click to edit'}
        aria-expanded={false}
        className="jeeby-cms-image-editor jeeby-cms-image-editor--view"
        onClick={enterEditMode}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterEditMode() }
        }}
      >
        <figure className="jeeby-cms-image-figure">
          <img
            src={data.src}
            alt={data?.alt ?? ''}
            onError={() => setImgError(true)}
            className="jeeby-cms-image-preview"
          />
        </figure>
      </div>
    )
  }

  // Loaded edit mode — image + inputs, blur exits
  return (
    <div ref={containerRef} className="jeeby-cms-image-editor" onBlur={handleContainerBlur}>
      <figure className="jeeby-cms-image-figure">
        <img
          src={data.src}
          alt={data?.alt ?? ''}
          onError={() => setImgError(true)}
          className="jeeby-cms-image-preview"
        />
      </figure>

      <div className="jeeby-cms-image-fields">
        <label htmlFor={urlInputId} className="jeeby-cms-field-label">Image URL</label>
        <input
          ref={urlInputRef}
          id={urlInputId}
          type="url"
          value={data?.src ?? ''}
          placeholder="https://example.com/image.jpg"
          onChange={(e) => { setImgError(false); onChange({ ...data, src: e.target.value }) }}
        />
        {imgError && (
          <p role="alert" className="jeeby-cms-inline-error">
            Image not found — check the URL is correct and publicly accessible.
          </p>
        )}
        <label htmlFor={altInputId} className="jeeby-cms-field-label jeeby-cms-image-alt-label">Alt text</label>
        <input
          id={altInputId}
          type="text"
          value={data?.alt ?? ''}
          aria-describedby={altHintId}
          placeholder="Describe the image for screen readers"
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
        />
        <p id={altHintId} className="jeeby-cms-field-hint">
          Leave blank only if the image is purely decorative.
        </p>
      </div>
    </div>
  )
}

export default ImageEditor
