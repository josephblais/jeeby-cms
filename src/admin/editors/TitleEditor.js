"use client"

import { useRef, useEffect } from 'react'

// Canvas fidelity font sizes (WYSIWYG content sizes, not UI chrome).
// Matches UI-SPEC heading sizes so admin sees exactly what front end renders.
const HEADING_SIZES = { h2: '28px', h3: '24px', h4: '20px', h5: '16px', h6: '14px' }

const LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6']

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Heading level selector — WCAG 4.1.2: native <select> provides role, name, state natively */}
      <select
        value={data?.level ?? 'h2'}
        aria-label="Heading level"
        onChange={(e) => onChange({ ...data, level: e.target.value })}
        // data.level drives font size via HEADING_SIZES lookup below
        style={{ width: 'fit-content' }}
      >
        {LEVELS.map(l => (
          <option key={l} value={l}>{l.toUpperCase()}</option>
        ))}
      </select>

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
    </div>
  )
}

export default TitleEditor
