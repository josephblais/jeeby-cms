"use client"
import { ModalShell } from './ModalShell.js'
import { useT, tf } from './useT.js'

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
  const t = useT()
  return (
    <ModalShell
      role="alertdialog"
      labelId="signout-modal-heading"
      descId="signout-modal-body"
      onClose={onCancel}
      backdropStyle={{ zIndex: 300 }}
    >
      <h2 id="signout-modal-heading">{t('unpublishedChanges')}</h2>
      <p id="signout-modal-body">{tf(t('signOutBody'), { pageName })}</p>
      {publishError && (
        <p role="alert" className="jeeby-cms-inline-error" style={{ marginTop: 8 }}>
          {t('publishFailedSignOut')}
        </p>
      )}
      <div className="jeeby-cms-modal-actions">
        <button
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onSignOutAnyway}
          disabled={publishing}
        >
          {t('signOutAnyway')}
        </button>
        <button
          type="button"
          data-autofocus
          className="jeeby-cms-btn-ghost"
          onClick={onCancel}
          disabled={publishing}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={onPublish}
          aria-busy={publishing ? 'true' : undefined}
          disabled={publishing}
        >
          {publishing ? t('publishing') : t('publishAndSignOut')}
        </button>
      </div>
    </ModalShell>
  )
}
