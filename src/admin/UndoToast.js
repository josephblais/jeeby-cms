"use client"
import { useT, tf, BLOCK_DISPLAY_KEYS } from './useT.js'

export function UndoToast({ blockType, onUndo }) {
  const t = useT()
  const name = t(BLOCK_DISPLAY_KEYS[blockType]) || blockType
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jeeby-cms-undo-toast"
    >
      <span>{tf(t('blockDeleted'), { blockType: name })}</span>
      <button
        type="button"
        aria-label={tf(t('undoDeleteAriaLabel'), { blockType: name })}
        onClick={onUndo}
        className="jeeby-cms-btn-ghost"
      >{t('undoDelete')}</button>
    </div>
  )
}
