"use client"
import { useT } from './useT.js'

export function AdminNav({ onSignOut, siteName }) {
  const t = useT()
  return (
    <header className="jeeby-cms-nav" role="banner">
      <span className="jeeby-cms-nav-brand">{siteName ? `${siteName} Admin` : 'Admin'}</span>
      <nav aria-label={t('adminNavLabel')}>
        <button
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onSignOut}
        >
          {t('signOut')}
        </button>
      </nav>
    </header>
  )
}
