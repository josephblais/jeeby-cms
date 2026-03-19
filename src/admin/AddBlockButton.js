"use client"
import { useState, useRef } from 'react'
import { BlockTypePicker } from './BlockTypePicker.js'

export function AddBlockButton({ onAdd, insertIndex }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)

  return (
    <div className="jeeby-cms-add-block-wrapper">
      {/* Horizontal divider line */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px' }} />

      <button
        ref={buttonRef}
        type="button"
        aria-label="Add block"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        className="jeeby-cms-add-block-btn"
      >+</button>

      {isOpen && (
        <BlockTypePicker
          onSelect={(type) => {
            onAdd(type)
            setIsOpen(false)
          }}
          onClose={() => {
            setIsOpen(false)
            buttonRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}
