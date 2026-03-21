"use client"
import { useState, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BlockTypePicker } from './BlockTypePicker.js'

export function AddBlockButton({ onAdd, insertIndex }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  const showUI = isHovered || isOpen

  function handleMouseLeave(e) {
    // Stay visible when focus moves to a descendant (e.g. the picker listbox)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsHovered(false)
    }
  }

  return (
    <div
      className="jeeby-cms-add-block-seam"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Invisible hover zone — spans the full gap between blocks for easy discovery */}
      <div className="jeeby-cms-add-block-hover-zone" aria-hidden="true" />

      {/* Button + animated insertion bar */}
      <div className="jeeby-cms-add-block-ui">
        <button
          ref={buttonRef}
          type="button"
          aria-label="Add block"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => setIsOpen(v => !v)}
          className="jeeby-cms-add-block-btn"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Insertion indicator: pill that animates in from the button */}
        <motion.div
          className="jeeby-cms-add-block-bar"
          aria-hidden="true"
          initial={false}
          animate={{ width: showUI ? 96 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Picker rendered outside the transform stacking context so z-index is
          relative to the page, not the UI container's transformed context */}
      {isOpen && (
        <BlockTypePicker
          onSelect={(type, initialData) => {
            onAdd(type, initialData)
            setIsOpen(false)
            setIsHovered(false)
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
