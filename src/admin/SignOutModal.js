"use client"
import { ModalShell } from './ModalShell.js'

// Modal shown when the user tries to sign out with unpublished changes.
// Props:
//   pageName        — name of the page with unpublished changes
//   onPublish       — async fn: publish then sign out
//   onSignOutAnyway — fn: skip publish and sign out
//   onCancel        — fn: close modal, stay on page
//   publishing      — bool: publish-and-sign-out in progress
//   publishError    — bool: last publish attempt failed
// ACCESSIBILITY: WCAG 2.1.1 (keyboard), 2.4.3 (focus order), 4.1.3 (status messages)
export function SignOutModal({ pageName, onPublish, onSignOutAnyway, onCancel, publishing, publishError }) {
  return (
    <ModalShell
      role="alertdialog"
      labelId="signout-modal-heading"
      descId="signout-modal-body"
      onClose={onCancel}
      backdropStyle={{ zIndex: 300 }}
    >
      <h2 id="signout-modal-heading">Unpublished changes</h2>
      <p id="signout-modal-body">
        <strong>{pageName}</strong> has changes saved as a draft but not yet published.
        Publish now to make them live, or sign out and publish later.
      </p>
      {publishError && (
        <p role="alert" className="jeeby-cms-inline-error" style={{ marginTop: 8 }}>
          Publish failed. Sign out anyway or try again.
        </p>
      )}
      <div className="jeeby-cms-modal-actions">
        <button
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onSignOutAnyway}
          disabled={publishing}
        >
          Sign out anyway
        </button>
        <button
          type="button"
          data-autofocus
          className="jeeby-cms-btn-ghost"
          onClick={onCancel}
          disabled={publishing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={onPublish}
          aria-busy={publishing ? 'true' : undefined}
          disabled={publishing}
        >
          {publishing ? 'Publishing\u2026' : 'Publish and sign out'}
        </button>
      </div>
    </ModalShell>
  )
}
