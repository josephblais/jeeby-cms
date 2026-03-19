"use client"
import { useEffect, useRef } from 'react'

export function PublishConfirmModal({ open, pageName, onClose, onConfirm, triggerRef, publishing, publishError }) {
  const dialogRef = useRef(null)

  // Focus management: focus Cancel button on open, return focus on close
  useEffect(() => {
    if (open) {
      // Focus first focusable (Cancel button is rendered first in DOM order)
      const focusable = dialogRef.current?.querySelector(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable) focusable.focus()
    } else {
      triggerRef?.current?.focus()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key !== 'Tab') return
    const focusable = dialogRef.current.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus()
    }
  }

  if (!open) return null
  return (
    <div className="jeeby-cms-modal-backdrop">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="publish-modal-heading"
        className="jeeby-cms-modal-card" onKeyDown={handleKeyDown}>
        <h2 id="publish-modal-heading">Publish &lsquo;{pageName}&rsquo;?</h2>
        <p>This will replace the current live version with your latest draft. Visitors will see the new content immediately.</p>
        {publishError && (
          <p role="alert" className="jeeby-cms-inline-error">Failed to publish. Please try again.</p>
        )}
        <div className="jeeby-cms-modal-actions">
          <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="jeeby-cms-btn-primary" onClick={onConfirm}
            disabled={publishing}
            aria-busy={publishing ? 'true' : undefined}
            style={{ cursor: publishing ? 'not-allowed' : 'pointer' }}>
            {publishing ? 'Publishing\u2026' : 'Publish now'}
          </button>
        </div>
      </div>
    </div>
  )
}
