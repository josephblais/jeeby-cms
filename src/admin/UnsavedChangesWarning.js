"use client"
import { useEffect, useRef } from 'react'

export function UnsavedChangesWarning({ onLeave, onStay }) {
  const dialogRef = useRef(null)

  // Focus "Stay and save" button on mount
  useEffect(() => {
    const stayBtn = dialogRef.current?.querySelector('[data-autofocus]')
    stayBtn?.focus()
  }, [])

  // Escape to close (stay)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onStay()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onStay])

  // Focus trap
  useEffect(() => {
    function handleTab(e) {
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [])

  return (
    <div
      className="jeeby-cms-modal-backdrop"
      style={{ zIndex: 300 }}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-heading"
        aria-describedby="unsaved-body"
        className="jeeby-cms-modal-card"
      >
        <h2 id="unsaved-heading">
          You have unsaved changes
        </h2>
        <p id="unsaved-body">
          Your recent edits have not been saved yet. Do you want to leave without saving?
        </p>
        <div className="jeeby-cms-modal-actions">
          <button
            type="button"
            onClick={onLeave}
            className="jeeby-cms-btn-ghost"
          >Leave without saving</button>
          <button
            type="button"
            data-autofocus
            onClick={onStay}
            className="jeeby-cms-btn-ghost"
          >Stay and save</button>
        </div>
      </div>
    </div>
  )
}
