"use client"

export function AdminNav({ onSignOut, siteName }) {
  return (
    <header className="jeeby-cms-nav" role="banner">
      <span className="jeeby-cms-nav-brand">{siteName ? `${siteName} Admin` : 'Admin'}</span>
      <nav aria-label="Admin navigation">
        <button
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
