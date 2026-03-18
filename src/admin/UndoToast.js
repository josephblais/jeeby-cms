"use client"

const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery' }

export function UndoToast({ blockType, onUndo }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jeeby-cms-undo-toast"
      style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '12px',
        zIndex: 200,
        background: '#1f2937', color: '#f9fafb',
      }}
    >
      <span>{(DISPLAY_NAMES[blockType] || blockType) + ' block deleted.'}</span>
      <button
        type="button"
        aria-label={'Undo delete ' + (DISPLAY_NAMES[blockType] || blockType) + ' block'}
        onClick={onUndo}
        style={{
          background: 'none', border: 'none',
          cursor: 'pointer', minHeight: '44px'
        }}
      >Undo delete</button>
    </div>
  )
}
