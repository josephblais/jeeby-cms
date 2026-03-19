"use client"

const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery' }

export function UndoToast({ blockType, onUndo }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jeeby-cms-undo-toast"
    >
      <span>{(DISPLAY_NAMES[blockType] || blockType) + ' block deleted.'}</span>
      <button
        type="button"
        aria-label={'Undo delete ' + (DISPLAY_NAMES[blockType] || blockType) + ' block'}
        onClick={onUndo}
        className="jeeby-cms-btn-ghost"
      >Undo delete</button>
    </div>
  )
}
