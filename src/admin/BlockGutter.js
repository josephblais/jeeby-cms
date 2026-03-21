"use client"

const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery', list: 'List' }
function displayName(type) { return DISPLAY_NAMES[type] || type }

export function BlockGutter({ block, onDelete, dragControls }) {
  return (
    <div className="jeeby-cms-block-gutter">
      {/*
        Drag handle — aria-hidden because keyboard reorder isn't implemented yet;
        keyboard users can delete and re-add blocks to change order.
      */}
      <button
        className="jeeby-cms-drag-handle"
        aria-label={'Drag to reorder ' + displayName(block.type) + ' block'}
        aria-hidden="true"
        onPointerDown={(e) => { e.preventDefault(); dragControls.start(e) }}
      >
        <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
          <circle cx="2" cy="2"  r="1.25" fill="currentColor" />
          <circle cx="8" cy="2"  r="1.25" fill="currentColor" />
          <circle cx="2" cy="7"  r="1.25" fill="currentColor" />
          <circle cx="8" cy="7"  r="1.25" fill="currentColor" />
          <circle cx="2" cy="12" r="1.25" fill="currentColor" />
          <circle cx="8" cy="12" r="1.25" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        className="jeeby-cms-block-delete-btn"
        aria-label={'Delete ' + displayName(block.type) + ' block'}
        onClick={() => onDelete(block)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
