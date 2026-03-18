"use client"
import { useState, useEffect, useRef } from 'react'

const BLOCK_TYPES = [
  { type: 'title', label: 'Title' },
  { type: 'richtext', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'gallery', label: 'Gallery' },
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
      style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', listStyle: 'none', padding: '4px 0', margin: '4px 0 0',
        minWidth: '160px'
      }}
    >
      {BLOCK_TYPES.map((bt, index) => (
        <li
          key={bt.type}
          role="option"
          tabIndex={0}
          aria-selected={index === activeIndex}
          onClick={() => onSelect(bt.type)}
          onMouseEnter={() => setActiveIndex(index)}
          style={{
            padding: '8px 16px', cursor: 'pointer', fontSize: '14px',
            background: index === activeIndex ? '#EFF6FF' : 'transparent',
            color: index === activeIndex ? '#2563EB' : '#111827'
          }}
        >
          {bt.label}
        </li>
      ))}
    </ul>
  )
}
