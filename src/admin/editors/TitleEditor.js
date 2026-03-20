"use client"

import { useState, useRef, useEffect } from 'react'

// Admin preview sizes — rough approximations only.
// The Title block renders unstyled <h2>/<h3> etc. on the front end; actual size
// is controlled entirely by the consumer's CSS and will differ from these values.
const HEADING_SIZES = { h2: '28px', h3: '24px', h4: '20px', h5: '16px', h6: '14px' }

const LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6']

const LEVEL_LABELS = { h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4', h5: 'Heading 5', h6: 'Heading 6' }

function HeadingLevelIcon({ level }) {
  const num = level.slice(1)
  return (
    <span className="jeeby-cms-block-icon" aria-hidden="true">
      <span className="jeeby-cms-heading-icon-h">H</span>
      <span className="jeeby-cms-heading-icon-n">{num}</span>
    </span>
  )
}

function HeadingLevelPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [hoverIndex, setHoverIndex] = useState(LEVELS.indexOf(value))
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  function computeDropdownStyle() {
    if (!triggerRef.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    return { top: rect.bottom + 4, left: rect.left }
  }

  function openPicker() {
    setDropdownStyle(computeDropdownStyle())
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    // Close on scroll — fixed dropdown stays put while content moves
    const scrollEl = triggerRef.current?.closest('.jeeby-cms-admin')
    function handleScroll() { setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    scrollEl?.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      scrollEl?.removeEventListener('scroll', handleScroll)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      const idx = LEVELS.indexOf(value)
      setHoverIndex(idx)
      listRef.current?.querySelectorAll('[role="option"]')[idx]?.focus()
    }
  }, [open, value])

  function handleTriggerKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openPicker()
    }
  }

  function handleListKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (hoverIndex + 1) % LEVELS.length
      setHoverIndex(next)
      listRef.current?.querySelectorAll('[role="option"]')[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (hoverIndex - 1 + LEVELS.length) % LEVELS.length
      setHoverIndex(prev)
      listRef.current?.querySelectorAll('[role="option"]')[prev]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(LEVELS[hoverIndex])
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div ref={wrapperRef} className="jeeby-cms-heading-picker-wrapper">
      <button
        ref={triggerRef}
        type="button"
        className="jeeby-cms-heading-picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Heading level: ${LEVEL_LABELS[value]}`}
        onClick={() => open ? setOpen(false) : openPicker()}
        onKeyDown={handleTriggerKeyDown}
      >
        <HeadingLevelIcon level={value} />
        <span className="jeeby-cms-heading-picker-chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="jeeby-cms-heading-picker-dropdown-wrap" style={dropdownStyle}>
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Choose heading level"
            onKeyDown={handleListKeyDown}
            className="jeeby-cms-block-type-picker jeeby-cms-heading-picker-dropdown"
          >
            {LEVELS.map((l, i) => (
              <li
                key={l}
                role="option"
                tabIndex={0}
                aria-selected={l === value}
                onMouseEnter={() => setHoverIndex(i)}
                onClick={() => { onChange(l); setOpen(false); triggerRef.current?.focus() }}
              >
                <HeadingLevelIcon level={l} />
                <span>{LEVEL_LABELS[l]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// TitleEditor — controlled contenteditable for single-line heading text.
// Props: { data: { level, text }, onChange, blockId }
// ACCESSIBILITY: WCAG 1.3.1 (role="textbox"), 4.1.2 (aria-label, aria-multiline),
//   2.1.1 (keyboard — Enter blocked to enforce single-line)
export function TitleEditor({ data, onChange, blockId }) {
  const divRef = useRef(null)
  // Track whether the last text change came from user typing (internal) vs external prop update.
  // Without this guard, re-setting textContent during typing clobbers the cursor position.
  const isInternalChange = useRef(false)

  function handleInput(e) {
    isInternalChange.current = true
    onChange({ ...data, text: e.currentTarget.textContent })
  }

  // Sync external data.text changes into the DOM (e.g. undo, programmatic update).
  // Skip when the change originated from the user typing to avoid cursor reset.
  useEffect(() => {
    if (!isInternalChange.current && divRef.current && data?.text !== undefined) {
      if (divRef.current.textContent !== data.text) {
        divRef.current.textContent = data.text
      }
    }
    isInternalChange.current = false
  }, [data?.text]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Contenteditable text input — WCAG 4.1.2: explicit role/aria attributes required */}
      <div
        ref={divRef}
        id={'block-input-' + blockId}
        role="textbox"
        contentEditable
        aria-label="Title text"
        aria-multiline="false"
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
        style={{
          fontSize: HEADING_SIZES[data?.level ?? 'h2'],
          minHeight: '44px',
        }}
        data-placeholder="Enter title..."
      />

      {/* Heading level picker — aux control, revealed on block hover/focus */}
      <div className="jeeby-cms-block-aux">
        <HeadingLevelPicker
          value={data?.level ?? 'h2'}
          onChange={(level) => onChange({ ...data, level })}
        />
      </div>
    </div>
  )
}

export default TitleEditor
