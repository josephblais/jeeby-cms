"use client"
import { useRef } from 'react'

// ListEditor — edits data.items (string[]) and data.ordered (boolean).
// Enter in an item adds a new item below and focuses it.
// Backspace on an empty item removes it and focuses the one above.
// ACCESSIBILITY: WCAG 4.1.2 (Name, Role, Value) — each input and button has an aria-label.
// The type toggle uses aria-pressed to communicate the active state.
export function ListEditor({ data, onChange, blockId }) {
  const items = data?.items?.length ? data.items : ['']
  const ordered = data?.ordered ?? false
  const inputRefs = useRef([])

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

  return (
    <div>
      {/* List type toggle */}
      <div role="group" aria-label="List type" className="jeeby-cms-toolbar">
        <button
          type="button"
          aria-pressed={!ordered}
          className="jeeby-cms-toolbar-btn"
          onClick={() => update({ ordered: false })}
        >Bulleted</button>
        <button
          type="button"
          aria-pressed={ordered}
          className="jeeby-cms-toolbar-btn"
          onClick={() => update({ ordered: true })}
        >Numbered</button>
      </div>

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
            >×</button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="jeeby-cms-btn-ghost jeeby-cms-list-add-btn"
        onClick={() => addItem(items.length - 1)}
      >+ Add item</button>
    </div>
  )
}

export default ListEditor
