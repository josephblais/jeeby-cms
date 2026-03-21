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

function IconPullQuote() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        {/* Left accent bar */}
        <rect x="0.5" y="2" width="2" height="10" rx="0.7" />
        {/* Quote text lines */}
        <rect x="4" y="3" width="9" height="2" rx="0.7" opacity="0.9" />
        <rect x="4" y="6.5" width="9" height="2" rx="0.7" opacity="0.7" />
        <rect x="4" y="10" width="6" height="2" rx="0.7" opacity="0.5" />
      </svg>
    </span>
  )
}

function IconBulletList() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="2.5" cy="3.5" r="1.2" />
        <rect x="5" y="2.5" width="9" height="2" rx="0.7" />
        <circle cx="2.5" cy="8" r="1.2" />
        <rect x="5" y="7" width="9" height="2" rx="0.7" />
        <circle cx="2.5" cy="12.5" r="1.2" />
        <rect x="5" y="11.5" width="9" height="2" rx="0.7" />
      </svg>
    </span>
  )
}

function IconOrderedList() {
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        {/* "1" — single vertical bar */}
        <rect x="2.5" y="1.5" width="1.5" height="4" rx="0.5" />
        <rect x="5" y="2.5" width="9" height="2" rx="0.7" />
        {/* "2" — two stacked bars */}
        <rect x="1.5" y="6.5" width="3.5" height="1.4" rx="0.4" />
        <rect x="1.5" y="8.5" width="3.5" height="1.4" rx="0.4" />
        <rect x="5" y="7" width="9" height="2" rx="0.7" />
        {/* "3" — three stacked bars */}
        <rect x="1.5" y="11.2" width="3.5" height="1.2" rx="0.4" />
        <rect x="1.5" y="12.6" width="3.5" height="1.2" rx="0.4" />
        <rect x="1.5" y="14" width="3.5" height="1.2" rx="0.4" />
        <rect x="5" y="11.5" width="9" height="2" rx="0.7" />
      </svg>
    </span>
  )
}

const BLOCK_TYPES = [
  { type: 'title',    colorKey: 'heading', label: 'Heading',       hint: 'title or subtitle',          icon: <IconHeading />,     initialData: undefined },
  { type: 'richtext', colorKey: 'text',    label: 'Text',          hint: 'paragraphs with formatting', icon: <IconText />,        initialData: undefined },
  { type: 'list',     colorKey: 'list',    label: 'Bullet List',   hint: 'points without ranking',     icon: <IconBulletList />,  initialData: { ordered: false, items: [''] } },
  { type: 'list',     colorKey: 'list',    label: 'Numbered List', hint: 'steps or ranked items',      icon: <IconOrderedList />, initialData: { ordered: true,  items: [''] } },
  { type: 'pullquote', colorKey: 'text',    label: 'Pull Quote',  hint: 'highlighted quote or callout',  icon: <IconPullQuote />,  initialData: { quote: '', attribution: '' } },
  { type: 'image',    colorKey: 'media',   label: 'Image',         hint: 'photo or graphic',           icon: <IconImage />,       initialData: undefined },
  { type: 'video',    colorKey: 'media',   label: 'Video',         hint: 'YouTube or Vimeo link',      icon: <IconVideo />,       initialData: undefined },
  { type: 'gallery',  colorKey: 'media',   label: 'Gallery',       hint: 'photo grid',                 icon: <IconGallery />,     initialData: undefined },
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
      const bt = BLOCK_TYPES[activeIndex]
      onSelect(bt.type, bt.initialData)
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
          key={bt.label}
          role="option"
          tabIndex={0}
          aria-selected={index === activeIndex}
          data-color-key={bt.colorKey}
          onClick={() => onSelect(bt.type, bt.initialData)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {bt.icon}
          <span className="jeeby-cms-block-type-info">
            <span className="jeeby-cms-block-type-label">{bt.label}</span>
            <span className="jeeby-cms-block-type-hint">{bt.hint}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
