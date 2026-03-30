"use client"
export { PageEditor } from './PageEditor.js'
export { MediaLibraryModal } from './MediaLibraryModal.js'
import { useState, useRef, useMemo } from 'react'
import { useAuth } from '../index.js'
import { LoginPage } from './LoginPage.js'
import { AdminNav } from './AdminNav.js'
import { PageManager } from './PageManager.js'
import { SignOutGuardContext } from './SignOutGuardContext.js'
import { SignOutModal } from './SignOutModal.js'

export function AdminPanel({ children, siteName }) {
  const { user, loading, signOut } = useAuth()
  const guardRef = useRef(null)
  const [signOutModal, setSignOutModal] = useState(null) // null | { pageName }
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState(false)

  const guardContext = useMemo(() => ({
    setGuard: (guard) => { guardRef.current = guard },
    clearGuard: () => { guardRef.current = null },
  }), [])

  async function handleSignOutRequest() {
    const guard = guardRef.current
    if (guard?.hasPending()) {
      setPublishError(false)
      setSignOutModal({ pageName: guard.pageName })
      return
    }
    await signOut()
    window.location.replace('/admin')
  }

  async function handlePublishAndSignOut() {
    const guard = guardRef.current
    setPublishing(true)
    setPublishError(false)
    try {
      await guard?.onPublish()
      setSignOutModal(null)
      await signOut()
      window.location.replace('/admin')
    } catch {
      setPublishing(false)
      setPublishError(true)
    }
  }

  async function handleSignOutAnyway() {
    setSignOutModal(null)
    await signOut()
    window.location.replace('/admin')
  }

  if (loading) {
    return (
      <div className="jeeby-cms-admin">
        <header className="jeeby-cms-nav" role="banner">
          <span className="jeeby-cms-nav-brand">{siteName ? `${siteName} Admin` : 'Admin'}</span>
        </header>
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
    <SignOutGuardContext.Provider value={guardContext}>
      <div className="jeeby-cms-admin">
        <a href="#main-content" className="jeeby-cms-skip-link">Skip to main content</a>
        <AdminNav onSignOut={handleSignOutRequest} siteName={siteName} />
        <main className="jeeby-cms-shell-content" id="main-content" role="main" tabIndex={-1}>
          {children ?? <PageManager />}
        </main>
        {signOutModal && (
          <SignOutModal
            pageName={signOutModal.pageName}
            onPublish={handlePublishAndSignOut}
            onSignOutAnyway={handleSignOutAnyway}
            onCancel={() => { setSignOutModal(null); setPublishing(false); setPublishError(false) }}
            publishing={publishing}
            publishError={publishError}
          />
        )}
      </div>
    </SignOutGuardContext.Provider>
  )
}

