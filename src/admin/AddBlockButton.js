"use client"
import { useState, useRef } from 'react'
import { BlockTypePicker } from './BlockTypePicker.js'

export function AddBlockButton({ onAdd, insertIndex }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)

  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
      {/* Horizontal divider line */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px' }} />

      <button
        ref={buttonRef}
        type="button"
        aria-label="Add block"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
          minHeight: '44px', minWidth: '44px', padding: 0,
          background: 'none', border: 'none', cursor: 'pointer'
        }}
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
