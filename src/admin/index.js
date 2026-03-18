"use client"
import { useAuth } from '../index.js'
import { LoginPage } from './LoginPage.js'
import { AdminNav } from './AdminNav.js'

export function AdminPanel({ children }) {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="jeeby-cms-admin" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div className="jeeby-cms-loading" role="status" aria-label="Loading admin panel">
          <div className="jeeby-cms-spinner" aria-hidden="true" style={{
            display: 'inline-block', width: '32px', height: '32px',
            border: '3px solid #2563EB', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'jeeby-spin 0.75s linear infinite'
          }} />
        </div>
        <style>{`@keyframes jeeby-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="jeeby-cms-admin" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <LoginPage />
      </div>
    )
  }

  return (
    <div className="jeeby-cms-admin" style={{ minHeight: '100vh' }}>
      <a href="#main-content" className="jeeby-cms-skip-link" style={{
        position: 'absolute', left: '-9999px', top: '0',
        padding: '8px 16px', background: '#2563EB', color: '#fff',
        zIndex: 1000, fontSize: '14px'
      }}>Skip to main content</a>
      <AdminNav onSignOut={signOut} />
      <main className="jeeby-cms-shell-content" id="main-content" role="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}

