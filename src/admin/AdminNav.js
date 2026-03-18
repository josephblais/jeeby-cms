"use client"

export function AdminNav({ onSignOut }) {
  return (
    <header className="jeeby-cms-nav" role="banner" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '56px'
    }}>
      <span className="jeeby-cms-nav-brand">jeeby CMS</span>
      <nav aria-label="Admin navigation">
        <button
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onSignOut}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', minHeight: '44px'
          }}
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
