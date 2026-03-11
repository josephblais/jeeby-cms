// src/admin/index.js — admin entry
// No "use client" at entry level. Admin components will self-mark in later phases.
import { getAdminAuth } from '../firebase/admin.js'

export function AdminPanel() {
  return null
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
