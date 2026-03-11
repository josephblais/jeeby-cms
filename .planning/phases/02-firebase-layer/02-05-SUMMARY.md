---
phase: "02"
plan: "05"
subsystem: firebase-storage-admin
tags: [firebase, storage, firebase-admin, middleware, server-side]
dependency_graph:
  requires: [02-02]
  provides: [FIRE-04, storage-helpers, firebase-admin-init, withCMSAuth-middleware]
  affects: [src/firebase/storage.js, src/firebase/admin.js, src/admin/index.js, package.json, tsup.config.js]
tech_stack:
  added: [firebase-admin]
  patterns: [uploadBytesResumable-progress-tracking, firebase-admin-singleton, Next.js-middleware-pattern]
key_files:
  created:
    - src/firebase/storage.js
    - src/firebase/admin.js
  modified:
    - src/admin/index.js
    - package.json
    - tsup.config.js
decisions:
  - "withCMSAuth uses dynamic import('next/server') to avoid bundling next as static dep at module level"
  - "firebase-admin listed as optional peerDependency — only required in server environments"
  - "Admin SDK singleton via getApps().length check prevents re-initialization on hot reload"
  - "FIREBASE_ADMIN_PRIVATE_KEY .replace(/\\\\n/g, '\\n') fixes PEM newlines serialized as literal \\n in env vars"
metrics:
  completed_date: "2026-03-10"
  tasks: 2
  files: 5
---

# Phase 02 Plan 05: Firebase Storage and Admin SDK Summary

**One-liner:** Firebase Storage upload/delete helpers with progress callbacks, Firebase Admin SDK singleton init, and real Next.js `withCMSAuth` middleware using session cookie verification.

## Tasks Completed

| Task | Name | Files |
|------|------|-------|
| 1 | Implement src/firebase/storage.js | src/firebase/storage.js (created) |
| 2 | Firebase Admin init and withCMSAuth middleware | src/firebase/admin.js (created), src/admin/index.js (updated), package.json (updated), tsup.config.js (updated) |

## What Was Built

### src/firebase/storage.js
Implements two Firebase Storage helper functions:
- `uploadFile(storage, file, path, onProgress?)` — uses `uploadBytesResumable` for progress tracking, calls `onProgress` with `Math.round(bytesTransferred / totalBytes * 100)`, resolves with `getDownloadURL` result
- `deleteFile(storage, path)` — creates ref and calls `deleteObject`, returns the Promise

Both functions accept `storage` as first argument (from `useCMSFirebase()` context hook), no internal `getFirebaseInstances()` calls.

### src/firebase/admin.js
Firebase Admin SDK singleton initializer for server-side use. Uses `getApps().length > 0` guard to prevent re-init on Next.js hot reload. Reads credentials from environment variables (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`). Applies `.replace(/\\n/g, '\\n')` to the private key to restore PEM newlines serialized as literal `\\n` in env vars.

Exports `getAdminAuth()` which returns a Firebase Admin Auth instance.

### src/admin/index.js (upgraded)
Replaced placeholder `withCMSAuth` with real Next.js middleware factory. The returned middleware:
1. Reads the `__session` cookie from the request
2. Redirects to `/admin/login` if cookie is missing
3. Verifies the cookie value as a Firebase ID token via `adminAuth.verifyIdToken()`
4. Redirects to `/admin/login` on verification failure
5. Calls `NextResponse.next()` on success

Uses dynamic `import('next/server')` to avoid top-level static import of Next.js.

### package.json
- Added `firebase-admin: >=12` to `peerDependencies`
- Added `peerDependenciesMeta.firebase-admin.optional: true` (consumers only need it server-side)
- Added `firebase-admin: >=12` to `devDependencies`

### tsup.config.js
- Added `'firebase-admin'` to the admin entry `external` array, preventing it from being bundled into `dist/admin.mjs` / `dist/admin.js`

## Verification Steps

The following verification commands should be run after committing:

```bash
# Run storage tests
node --experimental-test-module-mocks --test src/firebase/storage.test.js

# Run full firebase test suite (regression check)
node --experimental-test-module-mocks --test 'src/firebase/*.test.js'

# Build
npm run build

# Confirm firebase-admin NOT bundled in admin output
grep "firebase-admin" dist/admin.mjs

# Confirm withCMSAuth present in admin output
grep "withCMSAuth" dist/admin.mjs

# Confirm private key newline fix
grep "FIREBASE_ADMIN_PRIVATE_KEY" src/firebase/admin.js
```

Note: `npm install` must be run first to install `firebase-admin` devDependency before build will succeed.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

### Files Created/Modified

- src/firebase/storage.js — CREATED
- src/firebase/admin.js — CREATED
- src/admin/index.js — MODIFIED (withCMSAuth upgraded)
- package.json — MODIFIED (firebase-admin added to peerDeps + devDeps)
- tsup.config.js — MODIFIED (firebase-admin added to admin entry external)

### Note on Verification

Bash tool access was not available during execution. The following steps must be performed manually or by the next agent with Bash access:
1. `npm install` to install `firebase-admin` devDependency
2. `node --test src/firebase/storage.test.js` to verify storage tests pass
3. `npm run build` to verify build succeeds and firebase-admin is not bundled
4. Git commits for each task
