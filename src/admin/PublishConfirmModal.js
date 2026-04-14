"use client"
import { ModalShell } from './ModalShell.js'
import { useT, tf } from './useT.js'

export function PublishConfirmModal({ open, pageName, onClose, onConfirm, triggerRef, publishing, publishError }) {
  const t = useT()
  return (
    <ModalShell open={open} labelId="publish-modal-heading" triggerRef={triggerRef} onClose={onClose}>
      <h2 id="publish-modal-heading">{tf(t('publishConfirmTitle'), { name: pageName })}</h2>
      <p>{t('publishConfirmBody')}</p>
      {publishError && (
        <p role="alert" className="jeeby-cms-inline-error">{t('publishFailedError')}</p>
      )}
      <div className="jeeby-cms-modal-actions">
        <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}>{t('cancel')}</button>
        <button type="button" className="jeeby-cms-btn-primary" onClick={onConfirm}
          disabled={publishing}
          aria-busy={publishing ? 'true' : undefined}
          style={{ cursor: publishing ? 'not-allowed' : 'pointer' }}>
          {publishing ? t('publishing') : t('publishNow')}
        </button>
      </div>
    </ModalShell>
  )
}
