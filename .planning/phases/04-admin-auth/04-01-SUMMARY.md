---
phase: 04-admin-auth
plan: 01
subsystem: auth
tags: [firebase, react, cookies, useAuth, session]

# Dependency graph
requires:
  - phase: 02-firebase-layer
    provides: subscribeToAuthState, Firebase auth instance via useCMSFirebase
  - phase: 04-admin-auth
    provides: withCMSAuth middleware reading __session cookie (src/admin/index.js)
provides:
  - useAuth hook writes __session ID token cookie on sign-in
  - useAuth hook clears __session cookie (max-age=0) on sign-out
  - Tests for useAuth/CMSProvider export shapes and cookie write logic
affects: [05-page-manager, 06-block-editor, withCMSAuth middleware consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - async onAuthStateChanged callback: await getIdToken() before setUser/setLoading
    - SSR-safe Secure flag guard via typeof document !== 'undefined'
    - Source inspection tests for cookie contract verification

key-files:
  created: []
  modified:
    - src/index.js
    - src/index.test.js

key-decisions:
  - "Cookie written before setUser/setLoading to ensure it exists before React re-render"
  - "Secure flag conditioned on document.location.protocol === 'https:' — cheap SSR safety"
  - "Source inspection for cookie tests: avoids fragile Firebase/React/document.cookie mock chain"

patterns-established:
  - "Cookie lifecycle in onAuthStateChanged: async callback, await token, write/clear, then update state"
  - "Source inspection test pattern: readFileSync + assert.ok(src.includes()) for contract verification"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 4 Plan 01: __session Cookie Lifecycle in useAuth Summary

**useAuth hook writes Firebase ID token to __session cookie on sign-in and clears it with max-age=0 on sign-out, bridging client auth state to withCMSAuth server middleware**

## Performance

- Duration: 8 min
- Started: 2026-03-18T01:22:41Z
- Completed: 2026-03-18T01:30:44Z
- Tasks: 2
- Files modified: 2

## Accomplishments
- useAuth onAuthStateChanged callback is now async: awaits getIdToken() then writes __session cookie before calling setUser/setLoading
- Sign-out path clears __session cookie with max-age=0 so withCMSAuth middleware sees no token
- 3 new tests added to src/index.test.js (useAuth shape, CMSProvider shape, cookie source inspection); all 6 tests pass

## Task Commits

Each task was committed atomically:

1. Task 1: Add __session cookie lifecycle to useAuth hook - `c365f74` (feat)
2. Task 2: Add useAuth export shape and cookie behavior tests - `564d3c4` (test)

## Files Created/Modified
- `src/index.js` - Added async cookie write/clear to subscribeToAuthState callback in useAuth
- `src/index.test.js` - Added readFileSync import and 3 new tests for useAuth/CMSProvider export shapes and cookie logic

## Decisions Made
- Cookie is written before setUser/setLoading to guarantee it exists before any React re-render downstream reads it
- Secure flag uses typeof document guard for SSR safety even though useAuth is client-only (cheap defensive coding)
- Cookie behavior verified via source inspection rather than mocking Firebase/React/document.cookie — avoids a fragile multi-layer mock chain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- useAuth now writes __session on every auth state change; withCMSAuth middleware can verify server-side requests
- Plan 04-02 (LoginPage component) can proceed — signIn/signOut return values from useAuth are unchanged
- No blockers

---
*Phase: 04-admin-auth*
*Completed: 2026-03-18*
