// src/firebase/firestore.js
// All Firestore access for the pages/{slug} collection.
// No other file in this package makes direct Firestore calls.
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  collection, getDocs, query, orderBy, limit, startAfter,
} from 'firebase/firestore'

// Internal helper — not exported
function pageRef(db, slug) {
  return doc(db, 'pages', slug)
}

// Returns the page document data, or null if the document does not exist.
export async function getPage(db, slug) {
  const snap = await getDoc(pageRef(db, slug))
  return snap.exists() ? snap.data() : null
}

// Create or merge a page document. Adds updatedAt timestamp.
export async function savePage(db, slug, data) {
  await setDoc(
    pageRef(db, slug),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// Update only the draft.blocks field on an existing page.
// Throws Firestore NOT_FOUND if the page does not exist.
export async function saveDraft(db, slug, blocks) {
  await updateDoc(pageRef(db, slug), {
    'draft.blocks': blocks,
    hasDraftChanges: true,
    updatedAt: serverTimestamp(),
  })
}

// Publish: copy draft.blocks to published.blocks and record lastPublishedAt.
export async function publishPage(db, slug) {
  const page = await getPage(db, slug)
  if (!page) throw new Error(`Page "${slug}" not found`)
  await updateDoc(pageRef(db, slug), {
    'published.blocks': page.draft?.blocks ?? [],
    lastPublishedAt: serverTimestamp(),
    hasDraftChanges: false,
  })
}

// Permanently delete a page document.
export async function deletePage(db, slug) {
  await deleteDoc(pageRef(db, slug))
}

// Returns an array of all page objects from the pages collection.
// No orderBy — avoids silently excluding documents missing updatedAt field.
export async function listPages(db) {
  const col = collection(db, 'pages')
  const snap = await getDocs(col)
  return snap.docs.map(d => ({ slug: d.id, ...d.data() }))
}

// Returns one page of results ordered by updatedAt desc, plus a cursor for the
// next page and a hasMore flag. Fetches pageSize+1 docs to detect overflow.
// cursor: Firestore DocumentSnapshot returned as nextCursor from a previous call.
export async function listPagesPaginated(db, { pageSize = 20, cursor = null } = {}) {
  const col = collection(db, 'pages')
  const constraints = cursor
    ? [orderBy('updatedAt', 'desc'), startAfter(cursor), limit(pageSize + 1)]
    : [orderBy('updatedAt', 'desc'), limit(pageSize + 1)]
  const snap = await getDocs(query(col, ...constraints))
  const hasMore = snap.docs.length > pageSize
  const pageDocs = snap.docs.slice(0, pageSize)
  return {
    pages: pageDocs.map(d => ({ slug: d.id, ...d.data() })),
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

// Rename a page by reading the old doc, writing under new slug, then deleting old.
// Non-atomic by design (v1 accepted tradeoff). Throws if old page not found.
export async function renamePage(db, oldSlug, newSlug) {
  const data = await getPage(db, oldSlug)
  if (!data) throw new Error(`Page "${oldSlug}" not found`)
  await savePage(db, newSlug, { ...data, slug: newSlug })
  await deletePage(db, oldSlug)
}

// Validate a slug against a Next.js dynamic segment template pattern.
// [slug] → single path segment (no slashes), [...path] → catch-all (any chars).
// Returns true when pattern is falsy (no template = any slug valid).
export function validateSlug(pattern, slug) {
  if (!pattern) return true
  const regexStr = pattern
    .replace(/\[\.\.\.[\w]+\]/g, '.*')
    .replace(/\[[\w]+\]/g, '[^/]+')
    .replace(/\//g, '\\/')
  return new RegExp('^' + regexStr + '$').test(slug)
}
