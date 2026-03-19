"use client"
import { useState, useEffect, useRef } from 'react'

function IconText() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="1" y="1" width="12" height="3" rx="0.7" />
        <rect x="5.5" y="4" width="3" height="9" rx="0.7" />
      </svg>
    </span>
  )
}

function IconHeading() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="1" y="1" width="3" height="12" rx="0.7" />
        <rect x="10" y="1" width="3" height="12" rx="0.7" />
        <rect x="4" y="5.5" width="6" height="3" rx="0.7" />
      </svg>
    </span>
  )
}

function IconImage() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="2" width="12" height="10" rx="1.5" />
        <circle cx="4.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
        <polyline points="1,11 4,7.5 7,10 9.5,7.5 13,11" />
      </svg>
    </span>
  )
}

function IconVideo() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="2.5" width="9" height="9" rx="1.5" />
        <polygon points="10,5 13,7 10,9" fill="currentColor" stroke="none" />
        <polygon points="5,4.5 9.5,7 5,9.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

function IconGallery() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
        <rect x="7.5" y="1" width="5.5" height="5.5" rx="1" />
        <rect x="1" y="7.5" width="5.5" height="5.5" rx="1" />
        <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" />
      </svg>
    </span>
  )
}

const BLOCK_TYPES = [
  { type: 'title',    label: 'Heading', icon: <IconHeading /> },
  { type: 'richtext', label: 'Text',    icon: <IconText /> },
  { type: 'image',    label: 'Image',   icon: <IconImage /> },
  { type: 'video',    label: 'Video',   icon: <IconVideo /> },
  { type: 'gallery',  label: 'Gallery', icon: <IconGallery /> },
]

export function BlockTypePicker({ onSelect, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef(null)

  // Focus first option on mount
  useEffect(() => {
    const firstOption = listRef.current?.querySelector('[role="option"]')
    firstOption?.focus()
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (listRef.current && !listRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (activeIndex + 1) % BLOCK_TYPES.length
      setActiveIndex(next)
      listRef.current?.querySelectorAll('[role="option"]')[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (activeIndex - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length
      setActiveIndex(prev)
      listRef.current?.querySelectorAll('[role="option"]')[prev]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(BLOCK_TYPES[activeIndex].type)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <ul
      ref={listRef}
      role="listbox"
      aria-label="Choose block type"
      onKeyDown={handleKeyDown}
      className="jeeby-cms-block-type-picker"
    >
      {BLOCK_TYPES.map((bt, index) => (
        <li
          key={bt.type}
          role="option"
          tabIndex={0}
          aria-selected={index === activeIndex}
          onClick={() => onSelect(bt.type)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {bt.icon}
          <span>{bt.label}</span>
        </li>
      ))}
    </ul>
  )
}
