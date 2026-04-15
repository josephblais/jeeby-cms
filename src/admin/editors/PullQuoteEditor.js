"use client"
import { useState, useRef } from 'react'
import { useT } from '../useT.js'

// PullQuoteEditor — edits data.quote (string) and data.attribution (string).
// View mode renders a styled blockquote preview; clicking enters edit mode.
//
// ACCESSIBILITY:
//   WCAG 4.1.2 — visible <label> elements with htmlFor/id wiring on both fields.
//   WCAG 2.1.1 — Enter/Space activate view mode; Escape exits edit mode.
//   WCAG 1.3.1 — semantic <figure>/<blockquote>/<figcaption> in view mode preview.
//   WCAG 1.1.1 — decorative opening quote mark is a CSS ::before pseudo-element
//                (invisible to the accessibility tree — no aria-hidden needed).
export function PullQuoteEditor({ data, onChange, blockId }) {
  const t = useT()
  const [isEditing, setIsEditing] = useState(false)
  const quote = data?.quote ?? ''
  const attribution = data?.attribution ?? ''
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const textareaRef = useRef(null)

  function update(patch) {
    onChange({ quote, attribution, ...patch })
  }

  function enterEditMode() {
    setIsEditing(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function exitEditMode() {
    setIsEditing(false)
    requestAnimationFrame(() => viewRef.current?.focus())
  }

  function handleContainerBlur(e) {
    // Only exit if focus leaves the entire container
    if (!(e.relatedTarget instanceof Node) || !containerRef.current?.contains(e.relatedTarget)) {
      setIsEditing(false)
    }
  }

  function handleTextareaKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      exitEditMode()
    }
    // Tab moves naturally to the attribution input — do not trap
  }

  function handleAttributionKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      exitEditMode()
    }
  }

  // View mode — rendered preview, click or keyboard to enter edit mode
  if (!isEditing) {
    return (
      <div
        ref={viewRef}
        role="button"
        tabIndex={0}
        id={'block-input-' + blockId}
        aria-label={t('pullquoteClickToEdit')}
        className="jeeby-cms-pullquote-view"
        onClick={enterEditMode}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            enterEditMode()
          }
        }}
      >
        {quote ? (
          <figure className="jeeby-cms-pullquote-figure">
            <blockquote className="jeeby-cms-pullquote-blockquote">
              <p>{quote}</p>
            </blockquote>
            {attribution && (
              <figcaption className="jeeby-cms-pullquote-figcaption">{attribution}</figcaption>
            )}
          </figure>
        ) : (
          <p className="jeeby-cms-pullquote-empty-hint">{t('pullquoteEmptyHint')}</p>
        )}
      </div>
    )
  }

  // Edit mode — two labelled fields, blur outside container exits
  return (
    <div ref={containerRef} className="jeeby-cms-pullquote-editor" onBlur={handleContainerBlur}>
      <label htmlFor={'block-input-' + blockId} className="jeeby-cms-field-label">{t('pullquoteLabel')}</label>
      <textarea
        ref={textareaRef}
        id={'block-input-' + blockId}
        value={quote}
        onChange={e => update({ quote: e.target.value })}
        onKeyDown={handleTextareaKeyDown}
        placeholder={t('pullquotePlaceholder')}
        className="jeeby-cms-pullquote-textarea"
        rows={3}
      />
      <label htmlFor={'pullquote-attr-' + blockId} className="jeeby-cms-field-label jeeby-cms-pullquote-attr-label">{t('pullquoteAttrLabel')}</label>
      <input
        type="text"
        id={'pullquote-attr-' + blockId}
        value={attribution}
        onChange={e => update({ attribution: e.target.value })}
        onKeyDown={handleAttributionKeyDown}
        placeholder={t('pullquoteAttrPlaceholder')}
        className="jeeby-cms-pullquote-attr-input"
      />
    </div>
  )
}

export default PullQuoteEditor
