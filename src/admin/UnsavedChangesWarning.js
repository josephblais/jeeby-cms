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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300
    }}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-heading"
        aria-describedby="unsaved-body"
        style={{
          background: '#FFFFFF', borderRadius: '8px', padding: '32px',
          maxWidth: '420px', width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      >
        <h2 id="unsaved-heading" style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px', color: '#111827' }}>
          You have unsaved changes
        </h2>
        <p id="unsaved-body" style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px' }}>
          Your recent edits have not been saved yet. Do you want to leave without saving?
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onLeave}
            style={{
              minHeight: '44px', padding: '8px 24px', background: '#DC2626', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
            }}
          >Leave without saving</button>
          <button
            type="button"
            data-autofocus
            onClick={onStay}
            style={{
              minHeight: '44px', padding: '8px 24px', background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
            }}
          >Stay and save</button>
        </div>
      </div>
    </div>
  )
}
