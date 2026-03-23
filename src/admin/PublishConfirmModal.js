"use client"
import { ModalShell } from './ModalShell.js'

export function PublishConfirmModal({ open, pageName, onClose, onConfirm, triggerRef, publishing, publishError }) {
  return (
    <ModalShell open={open} labelId="publish-modal-heading" triggerRef={triggerRef} onClose={onClose}>
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
    </ModalShell>
  )
}
