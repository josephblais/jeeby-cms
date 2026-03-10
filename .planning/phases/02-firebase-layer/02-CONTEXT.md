# Phase 2: Firebase Layer - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Encapsulate all Firebase interactions into composable helpers: Firebase client SDK initialisation, Firestore CRUD for pages with draft/published structure, Firebase Auth (email/password sign-in/sign-out), and Firebase Storage upload/delete. The rest of the package calls these helpers — no other file reaches Firebase directly after this phase.

</domain>

<decisions>
## Implementation Decisions

### Config API
- `CMSProvider` is the single public init point — consumers pass `firebaseConfig` as a prop: `<CMSProvider firebaseConfig={config}>`
- No `jeeby.config.js` file support for v1 — prop only
- Firebase Admin SDK credentials (for `withCMSAuth`) come from environment variables only: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- An internal `initCMS(config)` function may be used by helpers like `withCMSAuth` (not exposed as public API)
- `CMSProvider` wraps children and provides a Firebase context: `<CMSProvider firebaseConfig={config}>{children}</CMSProvider>`

### Error Handling
- Helpers throw on failure — callers use try/catch
- No internal logging — helpers are silent; callers control error reporting
- Firestore reads return `null` when the requested document doesn't exist (e.g. `getPage(slug)` returns `null` for missing pages)
- Raw Firebase error codes propagate — no custom `CMSError` wrapper classes for v1

### Auth Persistence
- Firebase Auth persistence fixed at `LOCAL` (survives browser refresh, consistent across tabs)
- Not configurable by the consumer — fixed for v1
- Post-login redirect handled internally by `AdminPanel` — no `onSignIn` callback needed
- `useAuth()` hook built in Phase 2 alongside `auth.js`: returns `{ user, signIn, signOut, loading }` — Phase 4 (Admin Auth) will consume it

### Upload Progress
- Upload helper signature: `uploadFile(file, path, onProgress)` — `onProgress(percent)` called during upload, returns `Promise<downloadURL>`
- Caller passes full Storage path — helpers don't auto-generate paths
- Returns public download URL string only (not `storageRef` or metadata)
- `deleteFile(storageRef)` included in Phase 2 alongside `uploadFile`

### Claude's Discretion
- Internal file structure (`firebase/init.js`, `firebase/auth.js`, etc.) — follow PLANNING.md structure
- Firebase context shape (what `CMSProvider` puts on context — app instance, db, auth, storage refs)
- Exact Firestore helper names and signatures beyond what requirements specify

</decisions>

<specifics>
## Specific Ideas

- Firestore data model is already defined: `/cms/pages/{pageId}` with `draft.blocks` and `published.blocks` arrays — helpers must match this shape exactly
- Multi-init guard: use `getApps()` before `initializeApp()` (already established pattern)
- `withCMSAuth` uses Firebase Admin SDK with env var credentials — this is optional for consumers who skip SSR auth

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.js` — `CMSProvider` stub (returns children): needs Firebase init + context provision
- `src/admin/index.js` — `withCMSAuth` stub (no-op middleware): needs Firebase Admin SDK integration
- `src/server/index.js` — `getCMSContent` stub: not touched in Phase 2 (Phase 3 implements it using Phase 2's Firestore helpers)

### Established Patterns
- Firebase is a peer dependency — import via `import { ... } from 'firebase/app'` etc., never bundle
- JavaScript only (no TypeScript for v1)
- "use client" is injected by TSUP banner on the index entry — source files don't include the directive
- Admin components will self-mark "use client" in later phases

### Integration Points
- `CMSProvider` sits at the root of the consumer's Next.js layout — all client components below can access Firebase context
- Phase 3 (Front-End Block System) will consume `firestore.js` helpers for `getCMSContent` and `useCMSContent`
- Phase 4 (Admin Auth) will consume `useAuth()` hook and `auth.js` functions
- Phase 9 (Media Handling) will consume `uploadFile` and `deleteFile` from `storage.js`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-firebase-layer*
*Context gathered: 2026-03-10*
