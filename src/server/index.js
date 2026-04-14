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

export async function getCMSContent(slug, { locale = 'en' } = {}) {
  // locale is accepted for API symmetry with useCMSContent and forward-compat
  // with future server-side resolution. Current implementation returns raw
  // published data — block components apply resolveLocale at render time.
  void locale
  const db = getAdminFirestore()
  const snap = await db.doc('pages/' + slug).get()
  // CRITICAL: Admin SDK snap.exists is a boolean PROPERTY, not a method.
  // snap.exists() would return a truthy function ref (always true) — do not add ().
  if (!snap.exists) return null
  const pageData = snap.data()
  // Return published sub-object only. Never expose draft to the front end.
  return pageData?.published ?? null
}

// Server-side getter: returns published content + entries for a Collection page.
// Fetches the collection page's own published blocks and all child entries in parallel.
//
//   import { getCollectionContent } from 'jeeby-cms/server'
//   export default async function BlogIndex() {
//     const { content, entries } = await getCollectionContent('blog')
//     return (
//       <>
//         {content?.blocks?.length > 0 && <CMSBlocks blocks={content.blocks} />}
//         <ul>{entries.map(p => <li key={p.slug}>{p.name}</li>)}</ul>
//       </>
//     )
//   }
//
// content: the published sub-object (same shape as getCMSContent), or null if page has no
//          published blocks or the collection page document does not exist.
// entries: array of all child pages with parentSlug === slug, ordered by updatedAt desc.
//          Empty array when no entries exist.
export async function getCollectionContent(slug) {
  const db = getAdminFirestore()
  const [contentSnap, entriesSnap] = await Promise.all([
    db.doc('pages/' + slug).get(),
    db.collection('pages').where('parentSlug', '==', slug).orderBy('updatedAt', 'desc').get(),
  ])
  const pageData = contentSnap.exists ? contentSnap.data() : null
  return {
    content: pageData?.published ?? null,
    entries: entriesSnap.docs.map(d => ({ slug: d.id, ...d.data() })),
  }
}

// Server-side getter: returns all Entry pages belonging to a parent collection slug.
// Intended for Next.js Server Components, e.g. app/blog/page.js:
//
//   import { getCollectionPages } from 'jeeby-cms/server'
//   export default async function BlogIndex() {
//     const posts = await getCollectionPages('blog')
//     return <ul>{posts.map(p => <li key={p.slug}>{p.name}</li>)}</ul>
//   }
//
// Uses the Admin SDK chained API (same pattern as getCMSContent above) — NOT the
// client SDK's modular `query/where/getDocs` API. The client-side equivalent
// lives in src/firebase/firestore.js and takes a `db` parameter; this version
// calls `getAdminFirestore()` internally for consistency with getCMSContent.
//
// Returns ALL entries regardless of draft/published status (per D-21 — same
// behavior as the client `listPages`). Pages without a parentSlug field are
// excluded automatically by the where clause.
//
// Requires a Firestore composite index on (parentSlug ASC, updatedAt DESC) —
// see firestore.indexes.json at the repo root.
export async function getCollectionPages(parentSlug) {
  const db = getAdminFirestore()
  const snap = await db
    .collection('pages')
    .where('parentSlug', '==', parentSlug)
    .orderBy('updatedAt', 'desc')
    .get()
  return snap.docs.map(d => ({ slug: d.id, ...d.data() }))
}
