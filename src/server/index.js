// src/server/index.js — server entry
// INTENTIONALLY has no "use client" directive. This entry is safe to import in Next.js Server Components.
// useCMSContent (hook) lives in src/index.js because hooks require "use client".

import { getAdminFirestore } from '../firebase/admin.js'

export async function getCMSContent(slug) {
  const db = getAdminFirestore()
  const snap = await db.doc('content/pages/' + slug).get()
  // CRITICAL: Admin SDK snap.exists is a boolean PROPERTY, not a method.
  // snap.exists() would return a truthy function ref (always true) — do not add ().
  if (!snap.exists) return null
  const pageData = snap.data()
  // Return published sub-object only. Never expose draft to the front end.
  return pageData?.published ?? null
}
