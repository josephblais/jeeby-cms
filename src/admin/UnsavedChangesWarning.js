"use client"
import { ModalShell } from './ModalShell.js'
import { useT } from './useT.js'

export function UnsavedChangesWarning({ onLeave, onStay }) {
  const t = useT()
  return (
    <ModalShell
      role="alertdialog"
      labelId="unsaved-heading"
      descId="unsaved-body"
      onClose={onStay}
      backdropStyle={{ zIndex: 300 }}
    >
      <h2 id="unsaved-heading">{t('unsavedTitle')}</h2>
      <p id="unsaved-body">{t('unsavedBody')}</p>
      <div className="jeeby-cms-modal-actions">
        <button
          type="button"
          onClick={onLeave}
          className="jeeby-cms-btn-ghost"
        >{t('leaveWithoutSaving')}</button>
        <button
          type="button"
          data-autofocus
          onClick={onStay}
          className="jeeby-cms-btn-ghost"
        >{t('stayAndSave')}</button>
      </div>
    </ModalShell>
  )
}
