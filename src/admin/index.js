"use client"
import { getAdminAuth } from '../firebase/admin.js'
import { useAuth } from '../index.js'
import { LoginPage } from './LoginPage.js'
import { AdminNav } from './AdminNav.js'

export function AdminPanel({ children }) {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="jeeby-cms-admin">
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
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F9FAFB',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <LoginPage />
      </div>
    )
  }

  return (
    <div className="jeeby-cms-admin" style={{
      minHeight: '100vh', background: '#F9FAFB',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
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

// Next.js middleware helper that protects /admin/* routes.
// Usage in consumer's middleware.js:
//   import { withCMSAuth } from 'jeeby-cms/admin'
//   export default withCMSAuth()
//   export const config = { matcher: ['/admin/:path*'] }
//
// Reads the '__session' cookie, verifies it as a Firebase ID token.
// Redirects to /admin/login if the token is missing or invalid.
export function withCMSAuth() {
  return async function middleware(request) {
    const { NextResponse } = await import('next/server')
    const sessionCookie = request.cookies.get('__session')?.value

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const adminAuth = getAdminAuth()
      await adminAuth.verifyIdToken(sessionCookie)
      return NextResponse.next()
    } catch {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
}
