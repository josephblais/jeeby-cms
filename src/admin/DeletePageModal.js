"use client"
import { useState } from 'react'
import { useCMSFirebase } from '../index.js'
import { deletePage } from '../firebase/firestore.js'
import { ModalShell } from './ModalShell.js'

export function DeletePageModal({ page, onClose, onDeleted, triggerRef }) {
  const { db } = useCMSFirebase()
  const [deleting, setDeleting] = useState(false)

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

  return (
    <ModalShell open={!!page} labelId="delete-modal-heading" triggerRef={triggerRef} onClose={onClose}>
      <h2 id="delete-modal-heading">Delete page?</h2>
      <p>Delete {page?.slug}? This cannot be undone.</p>
      <div className="jeeby-cms-modal-actions">
        <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}>Keep Page</button>
        <button type="button" className="jeeby-cms-btn-destructive" onClick={handleDelete} disabled={deleting} aria-busy={deleting ? 'true' : undefined}
          style={{ cursor: deleting ? 'not-allowed' : 'pointer' }}>Delete Page</button>
      </div>
    </ModalShell>
  )
}
