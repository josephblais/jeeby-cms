"use client"
import { ModalShell } from './ModalShell.js'

export function UnsavedChangesWarning({ onLeave, onStay }) {
  return (
    <ModalShell
      role="alertdialog"
      labelId="unsaved-heading"
      descId="unsaved-body"
      onClose={onStay}
      backdropStyle={{ zIndex: 300 }}
    >
      <h2 id="unsaved-heading">You have unsaved changes</h2>
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
    </ModalShell>
  )
}
