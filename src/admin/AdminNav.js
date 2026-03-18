"use client"

export function AdminNav({ onSignOut }) {
  return (
    <header className="jeeby-cms-nav" role="banner" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '56px', padding: '0 24px', background: '#fff',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <span className="jeeby-cms-nav-brand" style={{
        fontSize: '20px', fontWeight: 600, lineHeight: 1.2
      }}>jeeby CMS</span>
      <nav aria-label="Admin navigation">
        <button
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onSignOut}
          style={{
            background: 'none', border: 'none', padding: '8px 16px',
            fontSize: '14px', color: '#374151', cursor: 'pointer',
            minHeight: '44px', borderRadius: '4px'
          }}
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
