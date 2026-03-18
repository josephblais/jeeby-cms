"use client"
import { useState, useEffect, useRef } from 'react'
import { useCMSFirebase } from '../index.js'
import { deletePage } from '../firebase/firestore.js'

export function DeletePageModal({ page, onClose, onDeleted, triggerRef }) {
  const { db } = useCMSFirebase()
  const [deleting, setDeleting] = useState(false)
  const dialogRef = useRef(null)

  const open = !!page

  // Focus management: focus first button on open, return focus on close
  useEffect(() => {
    if (open) {
      const firstFocusable = dialogRef.current?.querySelector(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (firstFocusable) firstFocusable.focus()
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

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePage(db, page.slug)
      onDeleted()
      onClose()
    } catch (err) {
      // Error is surfaced via the live region in PageManager
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  if (!page) return null
  return (
    <div className="jeeby-cms-modal-backdrop" style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="delete-modal-heading"
        className="jeeby-cms-modal-card" onKeyDown={handleKeyDown}
        style={{ maxWidth: '480px', width: '100%' }}>
        <h2 id="delete-modal-heading">Delete page?</h2>
        <p>Delete {page.slug}? This cannot be undone.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}
            style={{ minHeight: '44px', background: 'none', border: 'none', cursor: 'pointer' }}>Keep Page</button>
          <button type="button" className="jeeby-cms-btn-destructive" onClick={handleDelete} disabled={deleting} aria-busy={deleting ? 'true' : undefined}
            style={{ minHeight: '44px', cursor: deleting ? 'not-allowed' : 'pointer' }}>Delete Page</button>
        </div>
      </div>
    </div>
  )
}
