"use client"
export { PageEditor } from './PageEditor.js'
import { useAuth } from '../index.js'
import { LoginPage } from './LoginPage.js'
import { AdminNav } from './AdminNav.js'
import { PageManager } from './PageManager.js'

export function AdminPanel({ children, siteName }) {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="jeeby-cms-admin">
        <div className="jeeby-cms-loading" role="status" aria-label="Loading admin panel">
          <div className="jeeby-cms-spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="jeeby-cms-admin">
        <LoginPage siteName={siteName} />
      </div>
    )
  }

  return (
    <div className="jeeby-cms-admin">
      <a href="#main-content" className="jeeby-cms-skip-link">Skip to main content</a>
      <AdminNav onSignOut={signOut} siteName={siteName} />
      <main className="jeeby-cms-shell-content" id="main-content" role="main" tabIndex={-1}>
        {children ?? <PageManager />}
      </main>
    </div>
  )
}

