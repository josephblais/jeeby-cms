"use client"
import { useT } from './useT.js'

export function PublishToast() {
  const t = useT()
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jeeby-cms-publish-toast"
    >
      <span>{t('pagePublished')}</span>
    </div>
  )
}
