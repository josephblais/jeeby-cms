"use client"
import { useRef, useState } from 'react'

// SVG icons — match the ones used in TextEditor.
function IconBulletList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="3.5" r="1.2" />
      <rect x="5" y="2.5" width="9" height="2" rx="0.7" />
      <circle cx="2.5" cy="8" r="1.2" />
      <rect x="5" y="7" width="9" height="2" rx="0.7" />
      <circle cx="2.5" cy="12.5" r="1.2" />
      <rect x="5" y="11.5" width="9" height="2" rx="0.7" />
    </svg>
  )
}

function IconOrderedList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="1.5" width="1.5" height="4" rx="0.5" />
      <rect x="5" y="2.5" width="9" height="2" rx="0.7" />
      <rect x="1.5" y="6.5" width="3.5" height="1.4" rx="0.4" />
      <rect x="1.5" y="8.5" width="3.5" height="1.4" rx="0.4" />
      <rect x="5" y="7" width="9" height="2" rx="0.7" />
      <rect x="1.5" y="11.2" width="3.5" height="1.2" rx="0.4" />
      <rect x="1.5" y="12.6" width="3.5" height="1.2" rx="0.4" />
      <rect x="1.5" y="14" width="3.5" height="1.2" rx="0.4" />
      <rect x="5" y="11.5" width="9" height="2" rx="0.7" />
    </svg>
  )
}

// ListEditor — edits data.items (string[]) and data.ordered (boolean).
// In view mode renders a plain <ul>/<ol>; clicking switches to edit mode.
// Enter in an item adds a new item below and focuses it.
// Backspace on an empty item removes it and focuses the one above.
// ACCESSIBILITY: WCAG 4.1.2 (Name, Role, Value) — each input and button has an aria-label.
// The type toggle uses aria-pressed to communicate the active state.
export function ListEditor({ data, onChange, blockId }) {
  const items = data?.items?.length ? data.items : ['']
  const [isEditing, setIsEditing] = useState(false)
  const ordered = data?.ordered ?? false
  const inputRefs = useRef([])
  const containerRef = useRef(null)

  function update(patch) {
    onChange({ items, ordered, ...patch })
  }

  function updateItem(index, value) {
    const next = items.slice()
    next[index] = value
    update({ items: next })
  }

  function addItem(afterIndex) {
    const next = items.slice()
    next.splice(afterIndex + 1, 0, '')
    update({ items: next })
    requestAnimationFrame(() => inputRefs.current[afterIndex + 1]?.focus())
  }

  function removeItem(index) {
    if (items.length === 1) {
      // Clear rather than remove — always keep at least one row
      update({ items: [''] })
      return
    }
    const next = items.slice()
    next.splice(index, 1)
    update({ items: next })
    requestAnimationFrame(() => inputRefs.current[Math.max(0, index - 1)]?.focus())
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem(index)
    } else if (e.key === 'Backspace' && items[index] === '') {
      e.preventDefault()
      removeItem(index)
    }
  }

  function handleContainerBlur(e) {
    // Only exit edit mode if focus is leaving the entire container
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsEditing(false)
    }
  }

  // View mode — plain rendered list, click to edit
  if (!isEditing) {
    const Tag = ordered ? 'ol' : 'ul'
    const visibleItems = items.filter(i => i.trim() !== '')
    return (
      <div
        ref={containerRef}
        className="jeeby-cms-list-view"
        onClick={() => { setIsEditing(true); requestAnimationFrame(() => inputRefs.current[0]?.focus()) }}
        role="button"
        tabIndex={0}
        id={'block-input-' + blockId}
        aria-label="List block — click to edit"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsEditing(true); requestAnimationFrame(() => inputRefs.current[0]?.focus()) } }}
      >
        {visibleItems.length > 0 ? (
          <Tag className="jeeby-cms-list-preview">
            {visibleItems.map((item, i) => <li key={i}>{item}</li>)}
          </Tag>
        ) : (
          <p className="jeeby-cms-list-empty-hint">Empty list — click to add items</p>
        )}
      </div>
    )
  }

  // Edit mode — inputs with keyboard navigation
  return (
    <div ref={containerRef} onBlur={handleContainerBlur}>
      {/* List items */}
      <div className="jeeby-cms-list-items">
        {items.map((item, index) => (
          <div key={index} className="jeeby-cms-list-item-row">
            <span className="jeeby-cms-list-item-marker" aria-hidden="true">
              {ordered ? `${index + 1}.` : '•'}
            </span>
            <input
              ref={el => { inputRefs.current[index] = el }}
              id={index === 0 ? 'block-input-' + blockId : undefined}
              type="text"
              value={item}
              aria-label={`Item ${index + 1}`}
              onChange={e => updateItem(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              className="jeeby-cms-list-item-input"
              placeholder="List item"
            />
            <button
              type="button"
              aria-label={`Remove item ${index + 1}`}
              onClick={() => removeItem(index)}
              disabled={items.length === 1 && items[0] === ''}
              className="jeeby-cms-btn-ghost jeeby-cms-list-item-remove"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="jeeby-cms-btn-ghost jeeby-cms-list-add-btn"
        onClick={() => addItem(items.length - 1)}
      >+ Add item</button>

      {/* List type toggle — aux control, revealed on block hover/focus */}
      <div className="jeeby-cms-block-aux">
        <div role="group" aria-label="List type" className="jeeby-cms-toolbar">
          <button
            type="button"
            aria-label="Bulleted list"
            title="Bulleted list"
            aria-pressed={!ordered}
            className="jeeby-cms-toolbar-btn"
            onClick={() => update({ ordered: false })}
          ><IconBulletList /></button>
          <button
            type="button"
            aria-label="Numbered list"
            title="Numbered list"
            aria-pressed={ordered}
            className="jeeby-cms-toolbar-btn"
            onClick={() => update({ ordered: true })}
          ><IconOrderedList /></button>
        </div>
      </div>
    </div>
  )
}

export default ListEditor
