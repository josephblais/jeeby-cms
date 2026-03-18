"use client"

const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery' }

export function UndoToast({ blockType, onUndo }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: '#1F2937', color: '#F9FAFB', borderRadius: '6px', padding: '8px 16px',
        fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px',
        zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}
    >
      <span>{(DISPLAY_NAMES[blockType] || blockType) + ' block deleted.'}</span>
      <button
        type="button"
        aria-label={'Undo delete ' + (DISPLAY_NAMES[blockType] || blockType) + ' block'}
        onClick={onUndo}
        style={{
          color: '#93C5FD', fontWeight: 600, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: '14px', minHeight: '44px', padding: '4px 8px'
        }}
      >Undo delete</button>
    </div>
  )
}
