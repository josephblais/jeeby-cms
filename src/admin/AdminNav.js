"use client"

export function AdminNav({ onSignOut }) {
  return (
    <header className="jeeby-cms-nav" role="banner">
      <span className="jeeby-cms-nav-brand">jeeby CMS</span>
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
