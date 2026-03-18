// src/server/index.js — server entry
// INTENTIONALLY has no "use client" directive. This entry is safe to import in Next.js Server Components.
// useCMSContent (hook) lives in src/index.js because hooks require "use client".

import { NextResponse } from 'next/server'
import { getAdminFirestore, getAdminAuth } from '../firebase/admin.js'

// Next.js middleware helper that protects /admin/* routes.
// Usage in consumer's proxy.js (Next.js 16+) or middleware.js:
//   import { withCMSAuth } from 'jeeby-cms/server'
//   export const runtime = 'nodejs'  // required — firebase-admin needs Node.js runtime
//   export const middleware = withCMSAuth()
//   export const config = { matcher: ['/admin/:path+'] }
//
// Reads the '__session' cookie, verifies it as a Firebase ID token.
// Redirects to /admin if the token is missing or invalid — AdminPanel renders the login form there.
export function withCMSAuth() {
  return async function middleware(request) {
    const sessionCookie = request.cookies.get('__session')?.value

    if (!sessionCookie) {
      const adminUrl = new URL('/admin', request.url)
      return NextResponse.redirect(adminUrl)
    }

    try {
      const adminAuth = getAdminAuth()
      await adminAuth.verifyIdToken(sessionCookie)
      return NextResponse.next()
    } catch {
      const adminUrl = new URL('/admin', request.url)
      return NextResponse.redirect(adminUrl)
    }
  }
}

export async function getCMSContent(slug) {
  const db = getAdminFirestore()
  const snap = await db.doc('pages/' + slug).get()
  // CRITICAL: Admin SDK snap.exists is a boolean PROPERTY, not a method.
  // snap.exists() would return a truthy function ref (always true) — do not add ().
  if (!snap.exists) return null
  const pageData = snap.data()
  // Return published sub-object only. Never expose draft to the front end.
  return pageData?.published ?? null
}
