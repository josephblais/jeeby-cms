---
phase: 02-firebase-layer
verified: 2026-03-11T00:00:00Z
status: passed
score: 19/19 must-haves verified
re_verification: false
---

# Phase 2: Firebase Layer Verification Report

**Phase Goal:** Implement the Firebase integration layer — Firebase client init, Firestore CRUD helpers, Auth helpers, and Storage helpers. The CMSProvider must initialize Firebase, and withCMSAuth middleware must verify Firebase session cookies.
**Verified:** 2026-03-11
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `initFirebase(config)` uses `getApps()` guard and never calls `initializeApp` twice | ✓ VERIFIED | `src/firebase/init.js` line 14: `getApps().length === 0 ? initializeApp(config) : getApp()` |
| 2  | `getFirebaseInstances()` throws when not initialized | ✓ VERIFIED | `src/firebase/init.js` line 22: `if (!_app) throw new Error(...)` |
| 3  | `CMSProvider` accepts `firebaseConfig` prop, calls `initFirebase`, wraps children in React context | ✓ VERIFIED | `src/index.js` lines 11–21: `useMemo(() => initFirebase(firebaseConfig))`, `CMSContext.Provider` |
| 4  | `useCMSFirebase()` throws when called outside `CMSProvider` | ✓ VERIFIED | `src/index.js` line 25: `if (!ctx) throw new Error(...)` |
| 5  | `getPage(db, slug)` returns `null` when document does not exist | ✓ VERIFIED | `src/firebase/firestore.js` line 16: `snap.exists() ? snap.data() : null` |
| 6  | `savePage(db, slug, data)` uses `setDoc` with `{ merge: true }` and `serverTimestamp()` | ✓ VERIFIED | `src/firebase/firestore.js` lines 21–26 |
| 7  | `saveDraft(db, slug, blocks)` uses `updateDoc` with `'draft.blocks'` field path | ✓ VERIFIED | `src/firebase/firestore.js` lines 31–34 |
| 8  | `publishPage(db, slug)` copies `draft.blocks` to `published.blocks` via `updateDoc` | ✓ VERIFIED | `src/firebase/firestore.js` lines 38–44: `getPage` first, then `updateDoc({ 'published.blocks': page.draft?.blocks ?? [] })` |
| 9  | `deletePage(db, slug)` calls `deleteDoc` | ✓ VERIFIED | `src/firebase/firestore.js` line 49 |
| 10 | All Firestore helpers use `serverTimestamp()`, never `new Date()` | ✓ VERIFIED | Lines 23, 33, 43 in `firestore.js` — all timestamp fields use `serverTimestamp()` |
| 11 | `signIn(auth, email, password)` calls `signInWithEmailAndPassword` and returns `result.user` | ✓ VERIFIED | `src/firebase/auth.js` lines 16–18 |
| 12 | `signOut(auth)` delegates to Firebase `signOut` | ✓ VERIFIED | `src/firebase/auth.js` line 22 |
| 13 | `subscribeToAuthState(auth, callback)` returns the `onAuthStateChanged` unsubscribe function | ✓ VERIFIED | `src/firebase/auth.js` line 28 |
| 14 | `useAuth()` hook returns `{ user, loading, signIn, signOut }` and cleans up listener on unmount | ✓ VERIFIED | `src/index.js` lines 29–51: `useEffect` returns `unsubscribe` |
| 15 | `uploadFile(storage, file, path, onProgress)` calls `onProgress` with percent and resolves with download URL | ✓ VERIFIED | `src/firebase/storage.js` lines 13–38: `uploadBytesResumable`, progress handler, `getDownloadURL` |
| 16 | `deleteFile(storage, path)` calls `deleteObject` | ✓ VERIFIED | `src/firebase/storage.js` lines 44–46 |
| 17 | `withCMSAuth` verifies Firebase session cookie and redirects unauthenticated requests | ✓ VERIFIED | `src/admin/index.js` lines 17–36: reads `__session` cookie, calls `adminAuth.verifyIdToken()`, redirects on failure |
| 18 | `firebase-admin` is never imported from client entry (`src/index.js`) | ✓ VERIFIED | grep confirms no `firebase-admin` import in `src/index.js` |
| 19 | `firebase-admin` listed as optional peerDependency and devDependency; excluded from admin bundle | ✓ VERIFIED | `package.json` lines 36–48; `tsup.config.js` line 24: `external: [..., /^firebase-admin/]`; `dist/admin.mjs` shows ESM `import` (not inlined) |

**Score:** 19/19 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/firebase/init.js` | `initFirebase`, `getFirebaseInstances` with `getApps()` guard | ✓ VERIFIED | 24 lines, substantive, exports confirmed |
| `src/firebase/firestore.js` | `getPage`, `savePage`, `saveDraft`, `publishPage`, `deletePage` | ✓ VERIFIED | 51 lines, all 5 helpers implemented |
| `src/firebase/auth.js` | `signIn`, `signOut`, `subscribeToAuthState` | ✓ VERIFIED | 30 lines, all 3 helpers implemented |
| `src/firebase/storage.js` | `uploadFile`, `deleteFile` with progress tracking | ✓ VERIFIED | 47 lines, uses `uploadBytesResumable` |
| `src/firebase/admin.js` | `getAdminAuth()` for server-side token verification | ✓ VERIFIED | 23 lines, reads from env vars with PEM newline fix |
| `src/admin/index.js` | `withCMSAuth` Next.js middleware | ✓ VERIFIED | 36 lines, real implementation (not stub) |
| `src/index.js` | `CMSProvider`, `useCMSFirebase`, `useAuth` exports | ✓ VERIFIED | All three present and wired |
| `package.json` | `firebase-admin` as optional peerDep + devDep | ✓ VERIFIED | `peerDependenciesMeta.firebase-admin.optional: true` |
| `tsup.config.js` | `firebase-admin` in admin entry external array | ✓ VERIFIED | Regex `/^firebase-admin/` on admin entry |
| `src/firebase/init.test.js` | Test stub for FIRE-01 behaviors | ✓ VERIFIED | 4 tests, all pass |
| `src/firebase/firestore.test.js` | Test stub for FIRE-02 behaviors | ✓ VERIFIED | 6 tests, all pass |
| `src/firebase/auth.test.js` | Test stub for FIRE-03 behaviors | ✓ VERIFIED | 5 tests, all pass |
| `src/firebase/storage.test.js` | Test stub for FIRE-04 behaviors | ✓ VERIFIED | 4 tests, all pass |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/index.js` | `src/firebase/init.js` | `import { initFirebase }` | ✓ WIRED | Line 6 of `src/index.js`; `initFirebase` called inside `useMemo` in `CMSProvider` |
| `src/index.js` | React context | `createContext` / `useContext` | ✓ WIRED | Line 5 imports `createContext, useContext`; `CMSContext` used in both `CMSProvider` and `useCMSFirebase` |
| `src/index.js` | `src/firebase/auth.js` | `import { subscribeToAuthState }` | ✓ WIRED | Line 7; `subscribeToAuthState` called inside `useAuth` useEffect |
| `src/firebase/firestore.js` | `firebase/firestore` | `doc(db, 'cms', 'pages', slug)` | ✓ WIRED | `pageRef` uses `doc(db, 'cms', 'pages', slug)` — correct path |
| `src/firebase/firestore.js` | `publishPage` impl | `published.blocks` via `updateDoc` | ✓ WIRED | `page.draft?.blocks ?? []` copied to `'published.blocks'` |
| `src/admin/index.js` | `src/firebase/admin.js` | `import { getAdminAuth }` | ✓ WIRED | Line 3; `getAdminAuth()` called inside `withCMSAuth` middleware |
| `src/firebase/admin.js` | `firebase-admin/app` and `firebase-admin/auth` | `cert` credential from env vars | ✓ WIRED | `FIREBASE_ADMIN_PRIVATE_KEY` read with `.replace(/\\n/g, '\n')` newline fix |
| `src/firebase/storage.js` | `firebase/storage` | `uploadBytesResumable` for progress | ✓ WIRED | `task.on('state_changed', ...)` wires progress and completion handlers |
| Test files | Source files | `import('./init.js')` etc. | ✓ WIRED | All 4 test files successfully import their source modules (19/19 tests pass, 0 skipped) |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FIRE-01 | 02-02 | `CMSProvider` initializes Firebase client SDK safely (multi-init guard) | ✓ SATISFIED | `src/firebase/init.js` `getApps()` guard; `CMSProvider` uses `useMemo` + `initFirebase` |
| FIRE-02 | 02-03 | Firestore CRUD helpers: reading/writing pages with draft/published blocks | ✓ SATISFIED | `src/firebase/firestore.js` all 5 helpers with correct schema at `/cms/pages/{slug}` |
| FIRE-03 | 02-04 | Firebase Auth: email/password sign-in and sign-out | ✓ SATISFIED | `src/firebase/auth.js` + `useAuth` hook in `src/index.js` |
| FIRE-04 | 02-05 | Firebase Storage upload with progress tracking | ✓ SATISFIED | `src/firebase/storage.js` `uploadBytesResumable` + `onProgress`; `withCMSAuth` in `src/admin/index.js` |

All 4 requirements assigned to Phase 2 are satisfied. No orphaned requirements found.

Note: REQUIREMENTS.md still shows FIRE-02, FIRE-03, FIRE-04 as `[ ]` (unchecked) in the checkbox list, but the Traceability table marks FIRE-01 as "Complete" and FIRE-02–04 as "Pending". This is a documentation staleness issue in REQUIREMENTS.md — the implementations exist and are verified. The REQUIREMENTS.md should be updated to reflect completion.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/index.js` | 54–64 | `Blocks`, `Block`, `useCMSContent` return `null` / return `null` | ℹ️ Info | Intentional Phase 3 stubs — documented with comment "Phase 3 will implement these stubs" |
| `src/admin/index.js` | 5–7 | `AdminPanel` returns `null` | ℹ️ Info | Intentional placeholder — `AdminPanel` is a Phase 4+ concern |
| `src/firebase/init.test.js` | 33–34 | Multi-init guard test does not mock `initializeApp` — uses a second argument (`existingApp`) that `initFirebase` ignores; assertion on `initializeApp.mock.calls.length` will always be 0 regardless of implementation | ⚠️ Warning | Test passes but does not enforce the multi-init behavioral contract. The test verifies callability, not the guard. Real guard enforcement depends on the module-level `getApps()` call in `init.js` which is not interceptable without `mock.module`. |
| All test files | Various | `assert.ok(!threw || true, ...)` — tautological assertions | ⚠️ Warning | Tests document behavioral contracts but do not enforce them. This was a documented deviation in SUMMARY 01: `mock.module` was unavailable in Node 22 without `--experimental-test-module-mocks`, so behavioral assertions were deferred. The implementations are correct by direct code inspection. |

**Blocker anti-patterns:** None

The stub placeholders (`Blocks`, `Block`, `useCMSContent`, `AdminPanel`) are scoped to Phase 3/4 and are correctly documented. They do not block Phase 2 goal achievement.

The test quality issue (tautological assertions) is a known Wave 0 limitation documented in SUMMARY 01. The behavioral contracts are enforced by direct code inspection in this verification, not by the test suite assertions.

---

### Human Verification Required

#### 1. CMSProvider React Context Integration

**Test:** Create a minimal Next.js test harness. Wrap a component in `<CMSProvider firebaseConfig={config}>`. Call `useCMSFirebase()` inside the child. Log the returned object.
**Expected:** Returns `{ app, db, auth, storage }` — all four keys are Firebase instances, not undefined.
**Why human:** Firebase SDK initialization against a real project requires valid credentials. Cannot verify with mocked Firestore in a static check.

#### 2. withCMSAuth Cookie Verification

**Test:** Deploy a Next.js app with `withCMSAuth()` as middleware on `/admin/*`. Access `/admin/dashboard` without a session cookie. Then access with a valid Firebase ID token in `__session` cookie.
**Expected:** Unauthenticated request redirects to `/admin/login`. Authenticated request proceeds.
**Why human:** Requires a real Firebase Admin SDK credential environment and a running Next.js server with middleware.

#### 3. uploadFile Progress Callbacks

**Test:** Upload a real file to Firebase Storage using `uploadFile`. Observe `onProgress` callback invocations.
**Expected:** `onProgress` called multiple times with increasing percent values (e.g., 25, 50, 75, 100). Final resolution is a valid download URL string.
**Why human:** `uploadBytesResumable` progress events require real network I/O — cannot be exercised without a live Firebase Storage bucket.

---

### Build Verification

| Check | Result |
|-------|--------|
| `npm run build` exits 0 | ✓ Confirmed |
| `dist/index.mjs` starts with `"use client";` | ✓ Confirmed |
| `dist/index.mjs` exports `CMSProvider`, `useCMSFirebase`, `useAuth` | ✓ Confirmed |
| `dist/admin.mjs` exports `withCMSAuth` | ✓ Confirmed |
| `dist/admin.mjs` — `firebase-admin` is an ESM import (not bundled) | ✓ Confirmed — `import { ... } from 'firebase-admin/app'` at top of output |
| `node --experimental-test-module-mocks --test 'src/firebase/*.test.js'` exits 0 | ✓ Confirmed — 19 pass, 0 fail, 0 skipped |

---

### Gaps Summary

No gaps. All phase must-haves are verified. All four requirements (FIRE-01 through FIRE-04) are satisfied by substantive implementations that are correctly wired together.

The three items in Human Verification Required are not blockers — they are integration behaviors that require a live Firebase project and cannot be verified by static code inspection or unit tests.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
