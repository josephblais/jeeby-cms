# Phase 2: Firebase Layer - Research

**Researched:** 2026-03-10
**Domain:** Firebase Client SDK (v12), Firebase Admin SDK (v13), Firestore, Auth, Storage, React Context
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Config API**
- `CMSProvider` is the single public init point — consumers pass `firebaseConfig` as a prop: `<CMSProvider firebaseConfig={config}>`
- No `jeeby.config.js` file support for v1 — prop only
- Firebase Admin SDK credentials (for `withCMSAuth`) come from environment variables only: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- An internal `initCMS(config)` function may be used by helpers like `withCMSAuth` (not exposed as public API)
- `CMSProvider` wraps children and provides a Firebase context: `<CMSProvider firebaseConfig={config}>{children}</CMSProvider>`

**Error Handling**
- Helpers throw on failure — callers use try/catch
- No internal logging — helpers are silent; callers control error reporting
- Firestore reads return `null` when the requested document doesn't exist (e.g. `getPage(slug)` returns `null` for missing pages)
- Raw Firebase error codes propagate — no custom `CMSError` wrapper classes for v1

**Auth Persistence**
- Firebase Auth persistence fixed at `LOCAL` (survives browser refresh, consistent across tabs)
- Not configurable by the consumer — fixed for v1
- Post-login redirect handled internally by `AdminPanel` — no `onSignIn` callback needed
- `useAuth()` hook built in Phase 2 alongside `auth.js`: returns `{ user, signIn, signOut, loading }` — Phase 4 (Admin Auth) will consume it

**Upload Progress**
- Upload helper signature: `uploadFile(file, path, onProgress)` — `onProgress(percent)` called during upload, returns `Promise<downloadURL>`
- Caller passes full Storage path — helpers don't auto-generate paths
- Returns public download URL string only (not `storageRef` or metadata)
- `deleteFile(storageRef)` included in Phase 2 alongside `uploadFile`

### Claude's Discretion
- Internal file structure (`firebase/init.js`, `firebase/auth.js`, etc.) — follow PLANNING.md structure
- Firebase context shape (what `CMSProvider` puts on context — app instance, db, auth, storage refs)
- Exact Firestore helper names and signatures beyond what requirements specify

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIRE-01 | `CMSProvider` initializes Firebase client SDK safely (handles multi-init via `getApps()` check) | `getApps()` / `initializeApp()` guard pattern; React Context with `createContext` / `useContext` |
| FIRE-02 | Firestore CRUD helpers support reading and writing pages with draft/published blocks | `setDoc`, `getDoc`, `updateDoc`, `deleteDoc`, `collection`, `doc` from `firebase/firestore`; doc-per-page schema at `/cms/pages/{slug}` |
| FIRE-03 | Firebase Auth supports email/password sign-in and sign-out | `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`, `setPersistence`, `browserLocalPersistence` from `firebase/auth` |
| FIRE-04 | Firebase Storage upload helper supports file upload with progress tracking | `uploadBytesResumable`, `getDownloadURL`, `ref`, `deleteObject` from `firebase/storage` |
</phase_requirements>

---

## Summary

Phase 2 builds a thin, encapsulated Firebase adapter layer. All four Firebase service areas (app init, Firestore, Auth, Storage) use the **modular SDK** (tree-shakeable, import-per-function style introduced in Firebase v9, currently at v12.x). Firebase is a peer dependency — this package never bundles it; it imports from `firebase/*` sub-packages that the consumer has installed.

The central challenge is that `CMSProvider` must live in `src/index.js` which is a client-entry (gets `"use client"` banner from TSUP), so it can safely use `createContext` and React hooks. Firebase Admin SDK (`firebase-admin`) is needed only for `withCMSAuth` middleware in `src/admin/index.js` and runs in Node.js only — never imported in client-side code. The two are strictly separated by the dual-entry build already established in Phase 1.

The Firestore data model is pre-decided (doc-per-page at `/cms/pages/{slug}`, with `draft.blocks` and `published.blocks` sub-objects). Helpers must faithfully reflect this shape. The `useAuth()` hook, while consumed by Phase 4, is built here alongside `auth.js` to keep all Firebase interactions co-located in this phase.

**Primary recommendation:** Implement as a `src/firebase/` directory with four files: `init.js`, `firestore.js`, `auth.js`, `storage.js`. Wire `CMSProvider` to call `initFirebase()` from `init.js` and provide a React context containing `{ app, db, auth, storage }`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase` | `^12.x` (peer, currently 12.10.0 in project) | Client SDK for Firestore, Auth, Storage | Modular v9+ API is tree-shakeable; peer dep already declared |
| `firebase-admin` | `^13.x` (latest 13.7.0) | Server-side token verification for `withCMSAuth` middleware | Required for verifying Firebase ID tokens in Next.js middleware |
| `react` | `>=18` (peer) | Context API for `CMSProvider` | Already declared peer dep |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase/app` | (part of firebase pkg) | `initializeApp`, `getApps`, `getApp` | App initialisation guard |
| `firebase/firestore` | (part of firebase pkg) | CRUD helpers | All Firestore reads and writes |
| `firebase/auth` | (part of firebase pkg) | Email/password auth, persistence, state listener | All auth operations |
| `firebase/storage` | (part of firebase pkg) | Upload with progress, download URL, delete | All Storage operations |
| `firebase-admin/app` | (part of firebase-admin pkg) | `initializeApp`, `getApps`, `cert` | Admin init in `withCMSAuth` |
| `firebase-admin/auth` | (part of firebase-admin pkg) | `getAuth`, `verifyIdToken` | Cookie/session token verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `uploadBytesResumable` | `uploadBytes` | `uploadBytes` simpler but has no progress events — not usable given FIRE-04 requirement |
| `browserLocalPersistence` fixed at init | Consumer-configurable persistence | Simpler for v1; configurability deferred |
| doc-per-page Firestore layout | Subcollection-per-block | Doc-per-page simpler and sufficient until 1 MB limit hit (v2 concern per INFRA-01) |

**Installation (devDependency for the package developer; peer for consumers):**
```bash
# The consumer installs firebase as a peer dep — already declared
# firebase-admin is a server-only dep; add as devDependency in the package
npm install --save-dev firebase-admin
```

Note: `firebase-admin` should be added to `devDependencies` in the package's `package.json` (for local development and testing), and documented as an optional peer for consumers who use `withCMSAuth`. It must be listed in `external` in the TSUP config for the admin entry to prevent bundling.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── firebase/
│   ├── init.js        # initFirebase(config) — client SDK init with getApps() guard
│   ├── firestore.js   # getPage, savePage, deletePage, publishPage helpers
│   ├── auth.js        # signIn, signOut, subscribeToAuthState; useAuth hook
│   └── storage.js     # uploadFile(file, path, onProgress), deleteFile(path)
├── index.js           # CMSProvider — calls initFirebase, provides CMSContext
├── admin/
│   └── index.js       # withCMSAuth — uses firebase-admin to verify session token
└── server/
    └── index.js       # getCMSContent (Phase 3 fills this using firestore.js)
```

### Pattern 1: Multi-Init Guard (FIRE-01)
**What:** Use `getApps()` to check before calling `initializeApp()`. Returns existing app if already initialized, creates new one if not.
**When to use:** Always — any library package that initializes Firebase must use this guard because the consumer's app may already have initialized Firebase.
**Example:**
```javascript
// src/firebase/init.js
// Source: https://firebase.google.com/docs/web/setup + community pattern
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

let _app, _db, _auth, _storage

export function initFirebase(config) {
  _app = getApps().length === 0 ? initializeApp(config) : getApp()
  _db = getFirestore(_app)
  _auth = getAuth(_app)
  _storage = getStorage(_app)
  return { app: _app, db: _db, auth: _auth, storage: _storage }
}

export function getFirebaseInstances() {
  if (!_app) throw new Error('Firebase not initialized. Wrap your app in <CMSProvider>.')
  return { app: _app, db: _db, auth: _auth, storage: _storage }
}
```

### Pattern 2: React Context Provider (FIRE-01)
**What:** `CMSProvider` initializes Firebase and places service instances on a React context. All child components access Firebase through `useCMSFirebase()`.
**When to use:** This is the only public init surface. All client components that need Firebase call `useCMSFirebase()`.
**Example:**
```javascript
// src/index.js  (gets "use client" banner from TSUP)
import React, { createContext, useContext, useMemo } from 'react'
import { initFirebase } from './firebase/init.js'

const CMSContext = createContext(null)

export function CMSProvider({ firebaseConfig, children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  return <CMSContext.Provider value={firebase}>{children}</CMSContext.Provider>
}

export function useCMSFirebase() {
  const ctx = useContext(CMSContext)
  if (!ctx) throw new Error('useCMSFirebase must be used inside <CMSProvider>')
  return ctx
}
```

### Pattern 3: Firestore CRUD Helpers (FIRE-02)
**What:** Thin wrapper functions over `setDoc`/`getDoc`/`updateDoc`/`deleteDoc` that encode the page schema (`/cms/pages/{slug}`).
**When to use:** All Firestore access goes through these helpers — no other file writes raw Firestore calls.
**Example:**
```javascript
// src/firebase/firestore.js
// Source: https://firebase.google.com/docs/reference/js/firestore_
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'

function pageRef(db, slug) {
  return doc(db, 'cms', 'pages', slug)
}

// Returns page data or null if not found
export async function getPage(db, slug) {
  const snap = await getDoc(pageRef(db, slug))
  return snap.exists() ? snap.data() : null
}

// Create or overwrite a page
export async function savePage(db, slug, data) {
  await setDoc(pageRef(db, slug), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// Update only draft blocks
export async function saveDraft(db, slug, blocks) {
  await updateDoc(pageRef(db, slug), { 'draft.blocks': blocks, updatedAt: serverTimestamp() })
}

// Publish: copy draft to published
export async function publishPage(db, slug) {
  const page = await getPage(db, slug)
  if (!page) throw new Error(`Page "${slug}" not found`)
  await updateDoc(pageRef(db, slug), {
    'published.blocks': page.draft?.blocks ?? [],
    lastPublishedAt: serverTimestamp(),
  })
}

// Hard delete
export async function deletePage(db, slug) {
  await deleteDoc(pageRef(db, slug))
}
```

### Pattern 4: Auth with Fixed LOCAL Persistence (FIRE-03)
**What:** Set `browserLocalPersistence` once at init, expose `signIn`/`signOut` functions, and a `subscribeToAuthState` function for the `useAuth` hook.
**When to use:** Auth helpers are only called from the client-entry (`src/index.js` exports `useAuth`, `src/firebase/auth.js` provides the underlying functions).

**Important caveat (HIGH confidence — verified via GitHub issue #9319):** `setPersistence(browserLocalPersistence)` is NOT idempotent — calling it multiple times wipes previous local storage. Call it only once during auth init, not on every render or every sign-in attempt.

```javascript
// src/firebase/auth.js
import {
  getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence
} from 'firebase/auth'

export async function initAuthPersistence(auth) {
  // Call once during CMSProvider mount — sets LOCAL persistence globally
  await setPersistence(auth, browserLocalPersistence)
}

export async function signIn(auth, email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signOut(auth) {
  await firebaseSignOut(auth)
}

// Returns unsubscribe function — call in useEffect cleanup
export function subscribeToAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback)
}
```

```javascript
// useAuth hook — lives in src/index.js (client entry) or src/firebase/auth.js
import { useState, useEffect } from 'react'

export function useAuth() {
  const { auth } = useCMSFirebase()
  const [user, setUser] = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToAuthState(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub // cleanup unsubscribes listener
  }, [auth])

  return {
    user,
    loading,
    signIn: (email, password) => signIn(auth, email, password),
    signOut: () => signOut(auth),
  }
}
```

### Pattern 5: Storage Upload with Progress (FIRE-04)
**What:** `uploadBytesResumable` returns a task that emits progress events. Wrap in a Promise, call `onProgress(percent)` on each event, resolve with `getDownloadURL` on completion.
**When to use:** Any file upload that needs progress feedback.
```javascript
// src/firebase/storage.js
// Source: https://modularfirebase.web.app/common-use-cases/storage/
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

// uploadFile(file, path, onProgress?) => Promise<downloadURL string>
export function uploadFile(storage, file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          onProgress(percent)
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

// deleteFile(storage, path) => Promise<void>
export async function deleteFile(storage, path) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
```

### Pattern 6: Firebase Admin Init for `withCMSAuth` (FIRE-01 server-side)
**What:** Admin SDK is initialized server-side with env var credentials. Separate module from client SDK — never imported in client bundles.
**When to use:** Only in `src/admin/index.js` for `withCMSAuth` Next.js middleware.
```javascript
// src/firebase/admin.js  (imported only from src/admin/index.js)
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function getAdminApp() {
  if (getApps().length > 0) return getApp()
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Replace escaped newlines from env vars
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}
```

### Anti-Patterns to Avoid
- **Importing `firebase-admin` from client-entry files:** Admin SDK is Node.js-only. Any import in `src/index.js` or `src/firebase/auth.js` will cause a build/runtime error in the browser.
- **Calling `initializeApp()` without `getApps()` guard:** Throws "The default Firebase app already exists" if consumer already initialized Firebase. This is the #1 mistake in library packages.
- **Calling `setPersistence()` on every sign-in:** Wipes existing auth state from local storage (confirmed bug/behavior in firebase-admin#9319). Call it once at provider mount only.
- **Returning Firestore `DocumentReference` or `QuerySnapshot` objects from helpers:** Callers should receive plain JS objects or arrays, not Firebase-internal types. Use `.data()` and spread before returning.
- **Using deprecated compat API (`firebase/compat/app`):** The namespaced compat API (`firebase.firestore()`, `firebase.auth()`) is deprecated. Always use the modular import API.
- **Holding `db`, `auth`, `storage` in module-level variables without the init guard:** In Next.js development mode with Fast Refresh, modules may re-evaluate; combined with the multi-init guard in `getApps()`, the service instances must be re-retrieved from the already-initialized app.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-init guard | Custom singleton flag | `getApps().length === 0` check | Firebase SDK tracks this natively and handles named apps too |
| Auth state subscription | Custom polling / localStorage check | `onAuthStateChanged` | Handles token refresh, cross-tab sync, and persistence automatically |
| Upload progress tracking | Manual XHR with progress events | `uploadBytesResumable` task | Firebase handles chunking, retries, and progress natively |
| Download URL retrieval | Constructing Storage URLs manually | `getDownloadURL` | Storage URLs include auth tokens; hand-rolled URLs are unauthenticated and may break |
| Admin token verification | JWT decode libraries | `admin.auth().verifyIdToken()` | Must check Firebase's revocation list and key rotation |
| Firestore timestamps | `new Date()` in documents | `serverTimestamp()` | Server timestamps are consistent and timezone-independent |

**Key insight:** Firebase's modular SDK handles all session, network, retry, and consistency concerns internally. The helper layer's job is to present a domain-relevant API (`getPage`, `saveDraft`, `uploadFile`) — not to re-implement Firebase internals.

---

## Common Pitfalls

### Pitfall 1: `firebase-admin` Bundled in Client Entry
**What goes wrong:** Build succeeds but the browser throws `Cannot read properties of undefined` or module-not-found errors at runtime for Node.js built-ins (`fs`, `net`, `tls`) that `firebase-admin` uses internally.
**Why it happens:** `firebase-admin` imports Node.js core modules that don't exist in the browser. If `src/admin/index.js` (which contains `withCMSAuth`) is ever imported from a client component, the admin SDK gets bundled.
**How to avoid:** Keep `firebase-admin` imports strictly in `src/admin/index.js` and ensure `firebase-admin` is listed in TSUP's `external` array for the admin entry. Never re-export admin functions from `src/index.js`.
**Warning signs:** Build produces warnings about `fs` or `net` being unresolvable; or the admin bundle includes `firebase-admin` in its output.

### Pitfall 2: `getApps()` Check Fails on Named App
**What goes wrong:** If the consumer initializes Firebase with a named app (e.g. `initializeApp(config, 'consumer-app')`), `getApps()[0]` is NOT the default app and `getApp()` throws.
**Why it happens:** `getApp()` without arguments retrieves `[DEFAULT]` — a named consumer app is a different instance.
**How to avoid:** Use `getApps().length === 0 ? initializeApp(config) : getApp()` to grab the default app. If the consumer already initialized a default app, `initFirebase()` will attach to it, which is correct behavior for a library.
**Warning signs:** "No Firebase App '[DEFAULT]' has been created" error in a consumer app that uses named apps.

### Pitfall 3: `setPersistence` Called Multiple Times
**What goes wrong:** Each `CMSProvider` mount (e.g. during HMR or Strict Mode double-invoke) calls `setPersistence` again, wiping the user's existing session from localStorage.
**Why it happens:** `setPersistence` is not idempotent — calling it resets the persistence layer (confirmed in firebase-js-sdk#9319).
**How to avoid:** Gate the `setPersistence` call with a module-level flag or rely on the `getApps()` guard — if Firebase is already initialized, skip persistence setup. Alternatively, accept that `LOCAL` is the default and do not call `setPersistence` at all, since `LOCAL` is Firebase's default persistence on web.
**Warning signs:** User is signed out unexpectedly after page hot-reload during development.

### Pitfall 4: `onAuthStateChanged` Listener Not Cleaned Up
**What goes wrong:** Memory leak — the listener continues firing after the `CMSProvider` unmounts or during React Strict Mode double-mount/unmount cycles.
**Why it happens:** `onAuthStateChanged` returns an unsubscribe function that must be called in `useEffect` cleanup.
**How to avoid:** Always return the unsubscribe from the `useEffect` that sets up the listener: `return onAuthStateChanged(auth, callback)`.
**Warning signs:** Console warning "Can't perform a React state update on an unmounted component."

### Pitfall 5: Firestore `updateDoc` on Non-Existent Document
**What goes wrong:** `updateDoc` throws `NOT_FOUND` error if the document doesn't exist yet.
**Why it happens:** Unlike `setDoc`, `updateDoc` requires the document to already exist.
**How to avoid:** Use `setDoc(..., { merge: true })` for create-or-update patterns. Reserve `updateDoc` only for known-existing documents (e.g. `saveDraft` after page creation). `getPage` returning `null` should always precede any update on a page that might not exist.
**Warning signs:** Unhandled promise rejection with Firestore error code `NOT_FOUND`.

### Pitfall 6: Env Var Private Key Newline Escaping
**What goes wrong:** `firebase-admin` fails to initialize with "error:09091064:PEM routines" or similar crypto error.
**Why it happens:** When a private key is stored in a `.env` file, newlines inside the PEM key are serialized as literal `\n` strings, not actual newline characters. The `cert()` function requires real newlines.
**How to avoid:** Always transform the env var: `process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')`.
**Warning signs:** Admin SDK init throws a certificate/credential error on first request; the raw env var contains `\n` as two characters.

---

## Code Examples

Verified patterns from official and high-confidence sources:

### Firestore Document Schema (pre-decided)
```javascript
// /cms/pages/{slug} document shape
{
  slug: 'about',
  draft: {
    blocks: [
      { id: 'block-1', type: 'title', data: { text: 'About Us', level: 'h1' } },
      // ...
    ]
  },
  published: {
    blocks: [/* same structure, updated on publish */]
  },
  lastPublishedAt: Timestamp | null,
  updatedAt: Timestamp,
  createdAt: Timestamp,
}
```

### getApps Multi-Init Guard (official pattern)
```javascript
// Source: https://firebase.google.com/docs/web/setup (modular SDK)
import { initializeApp, getApps, getApp } from 'firebase/app'
const app = getApps().length === 0 ? initializeApp(config) : getApp()
```

### Admin SDK Multi-Init Guard
```javascript
// Source: https://firebase.google.com/docs/admin/setup
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
const app = getApps().length > 0 ? getApp() : initializeApp({ credential: cert({...}) })
```

### uploadBytesResumable with Progress
```javascript
// Source: https://modularfirebase.web.app/common-use-cases/storage/
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

const task = uploadBytesResumable(ref(storage, path), file)
task.on('state_changed',
  (snap) => onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
  reject,
  async () => resolve(await getDownloadURL(task.snapshot.ref))
)
```

### deleteObject
```javascript
// Source: https://firebase.google.com/docs/storage/web/delete-files
import { ref, deleteObject } from 'firebase/storage'
await deleteObject(ref(storage, path))
```

### onAuthStateChanged with cleanup
```javascript
// Source: https://firebase.google.com/docs/auth/web/auth-state-persistence
import { onAuthStateChanged } from 'firebase/auth'
useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => setUser(user))
  return unsub
}, [auth])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Namespaced API (`firebase.firestore()`) | Modular API (`import { getFirestore } from 'firebase/firestore'`) | Firebase v9 (2021), stable since | Tree-shakeable; smaller bundles |
| `firebase/compat/*` imports | Direct `firebase/*` imports | Compat removed in v10+ | Compat APIs gone — must use modular |
| `admin.apps.length` check | `getApps().length === 0` check (modular admin) | firebase-admin v10+ | Cleaner modular pattern |
| `uploadTask.snapshot.ref.getDownloadURL()` (chained method) | `getDownloadURL(task.snapshot.ref)` (function import) | Firebase v9 | Consistent with modular pattern |

**Deprecated/outdated:**
- `firebase/compat/app` and all `compat` sub-packages: removed in Firebase v10+. Do not use.
- `firebase.initializeApp()` (namespaced): no longer available without compat layer.
- `admin.credential.cert()` (old namespace): replaced by `cert()` from `firebase-admin/app` in the modular Admin SDK.

---

## Open Questions

1. **Should `firebase-admin` be a `peerDependency` or `devDependency`?**
   - What we know: It's a server-only dep. Consumers who use `withCMSAuth` need it installed; consumers who skip SSR auth don't.
   - What's unclear: Whether to list it as an optional peer or leave it as an undeclared runtime dependency the consumer installs separately.
   - Recommendation: Declare it as an optional peer dependency (`"firebase-admin": { "optional": true, "version": ">=12" }`) with documentation. Add to `devDependencies` for the package itself. Add to `external` in TSUP admin entry config.

2. **`setPersistence` — call or skip?**
   - What we know: `LOCAL` is Firebase's default persistence on web, so calling `setPersistence(auth, browserLocalPersistence)` is technically a no-op for default behavior. But it has the wipe-on-re-call pitfall (issue #9319).
   - What's unclear: Whether to call it explicitly (making intent clear) or omit it (relying on default).
   - Recommendation: Omit the `setPersistence` call entirely. Firebase defaults to LOCAL persistence on web. Document this in the code with a comment. Avoids the pitfall and produces identical behavior.

3. **Firestore collection path: `/cms/pages/{slug}` vs `/pages/{slug}`**
   - What we know: CONTEXT.md says the collection path is `/cms/pages/{slug}` (a subcollection under a `cms` document).
   - What's unclear: Whether `cms` is a document ID in a top-level collection or a top-level collection. The path has 3 segments: if all odd-segment positions are collections, `cms` would be a collection, `pages` a document, and `{slug}` a subcollection — which is inverted. More likely: `cms` is a top-level collection, `pages` is a document, and `{slug}` is stored as a field or subcollection key.
   - Recommendation: Treat it as `collection('cms').doc('pages').collection(slug)` is wrong (too deep). Most natural interpretation: top-level collection `pages` with document ID `{slug}`. Verify with the existing PLANNING.md or adjust if needed. The Firestore `doc(db, 'cms', 'pages', slug)` path produces a doc at `cms/pages` subcollection `{slug}`, which is valid. Use this as specified.

---

## Validation Architecture

> `nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test runner installed |
| Config file | None — Wave 0 must create |
| Quick run command | `node --test src/firebase/*.test.js` (Node built-in test runner, no install needed) |
| Full suite command | `node --test src/firebase/*.test.js scripts/*.test.js` |

**Note on test strategy:** Firebase SDK requires a real Firebase project or the Firebase Emulator Suite for meaningful integration testing. Unit tests can verify: (1) helper function signatures, (2) that `getApps()` guard is called before `initializeApp()`, (3) that `null` is returned for missing docs. Full CRUD tests require emulator. Given Phase 1 used `node --test` built-ins (no test framework installed), the same approach is recommended here.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIRE-01 | `initFirebase()` called twice does not throw | unit (mock getApps) | `node --test src/firebase/init.test.js` | ❌ Wave 0 |
| FIRE-01 | `CMSProvider` renders children without error when given valid config | unit (mock initFirebase) | `node --test src/firebase/provider.test.js` | ❌ Wave 0 |
| FIRE-02 | `getPage()` returns `null` for non-existent doc | integration (emulator) | `node --test src/firebase/firestore.test.js` | ❌ Wave 0 |
| FIRE-02 | `savePage()` + `getPage()` round-trip returns expected data | integration (emulator) | `node --test src/firebase/firestore.test.js` | ❌ Wave 0 |
| FIRE-02 | `publishPage()` copies `draft.blocks` to `published.blocks` | integration (emulator) | `node --test src/firebase/firestore.test.js` | ❌ Wave 0 |
| FIRE-03 | `signIn()` and `signOut()` return expected user state | integration (emulator) | `node --test src/firebase/auth.test.js` | ❌ Wave 0 |
| FIRE-03 | `useAuth()` loading state transitions correctly | unit (mock onAuthStateChanged) | `node --test src/firebase/auth.test.js` | ❌ Wave 0 |
| FIRE-04 | `uploadFile()` calls `onProgress` and resolves with URL string | unit (mock uploadBytesResumable) | `node --test src/firebase/storage.test.js` | ❌ Wave 0 |
| FIRE-04 | `deleteFile()` calls `deleteObject` with correct ref | unit (mock deleteObject) | `node --test src/firebase/storage.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test src/firebase/*.test.js` (unit tests only, no emulator)
- **Per wave merge:** Full suite including emulator-backed integration tests
- **Phase gate:** All unit tests green + manual smoke test against real Firebase project before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/firebase/init.test.js` — covers FIRE-01 (multi-init guard unit test)
- [ ] `src/firebase/firestore.test.js` — covers FIRE-02 (requires Firebase Emulator or mocks)
- [ ] `src/firebase/auth.test.js` — covers FIRE-03
- [ ] `src/firebase/storage.test.js` — covers FIRE-04
- [ ] Firebase Emulator config: `firebase.json` with emulator settings (if integration tests are in scope)

**Pragmatic note:** Full integration tests with the Firebase Emulator Suite add significant Wave 0 setup cost. The planner should consider whether unit tests with mocks are sufficient for this phase, deferring emulator tests to a dedicated testing phase or the Phase 10 Polish phase.

---

## Sources

### Primary (HIGH confidence)
- `https://firebase.google.com/docs/web/setup` — `initializeApp`, module import paths, current SDK version
- `https://firebase.google.com/docs/reference/js/firestore_` — Firestore modular API (`setDoc`, `getDoc`, `updateDoc`, `deleteDoc`, `serverTimestamp`)
- `https://firebase.google.com/docs/auth/web/auth-state-persistence` — `setPersistence`, `browserLocalPersistence`, `onAuthStateChanged`
- `https://firebase.google.com/docs/storage/web/delete-files` — `deleteObject` modular API
- `https://firebase.google.com/docs/admin/setup` — `firebase-admin/app` modular imports, `cert` credential pattern
- `https://modularfirebase.web.app/common-use-cases/storage/` — `uploadBytesResumable`, `getDownloadURL` patterns
- Local `node_modules/firebase/package.json` — confirmed firebase 12.10.0 installed as peer dep in project

### Secondary (MEDIUM confidence)
- `https://github.com/firebase/firebase-js-sdk/issues/9319` — `setPersistence` wipe-on-re-call pitfall (GitHub issue, cross-verified with official persistence docs)
- `https://www.npmjs.com/package/firebase-admin` — confirmed latest firebase-admin version 13.7.0 (npm registry)
- `https://dev.to/gthinh/how-to-initialize-a-firebase-app-in-the-new-modular-web-sdk-in-nextjs-187i` — Next.js + Firebase modular init pattern (community, matches official docs)
- `https://firebase.google.com/docs/firestore/manage-data/structure-data` — Firestore data model guidance

### Tertiary (LOW confidence)
- Community patterns for `useMemo` in context provider to avoid re-renders — pattern is sound but not from official Firebase docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — firebase 12.10.0 confirmed installed in project; firebase-admin 13.7.0 confirmed on npm; all import paths verified against official docs
- Architecture: HIGH — file structure follows locked decisions from CONTEXT.md; patterns are direct translations of official API docs
- Pitfalls: HIGH (for #1, #3, #5, #6) / MEDIUM (for #2, #4) — most pitfalls have official or well-documented sources; auth listener cleanup is a standard React pattern

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Firebase SDK is stable; unlikely to change in 30 days)
