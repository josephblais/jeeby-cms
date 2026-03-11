---
phase: 02-firebase-layer
plan: "02"
subsystem: database
tags: [firebase, react, context, hooks, firestore, auth, storage]

# Dependency graph
requires:
  - phase: 02-firebase-layer/02-01
    provides: src/firebase/init.test.js test stubs for Firebase init layer
provides:
  - src/firebase/init.js with initFirebase() and getFirebaseInstances() using getApps() multi-init guard
  - CMSProvider React context provider wrapping children with Firebase instances
  - useCMSFirebase() hook providing { app, db, auth, storage } to consumers
affects:
  - 02-firebase-layer/02-03 (Firestore helpers use db from context)
  - 02-firebase-layer/02-04 (Auth helpers use auth from context)
  - 02-firebase-layer/02-05 (Storage helpers use storage from context)
  - 03-front-end-block-system (CMSProvider is the top-level wrapper)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Firebase multi-init guard via getApps().length === 0 check"
    - "Module-level let refs (_app, _db, _auth, _storage) set once by initFirebase()"
    - "React context (createContext/useContext) for Firebase instance distribution"
    - "useMemo in CMSProvider to prevent Firebase re-initialization on re-renders"
    - "React.createElement instead of JSX (no JSX transform in plain JS TSUP setup)"

key-files:
  created:
    - src/firebase/init.js
    - src/firebase/init.test.js
  modified:
    - src/index.js
    - package.json

key-decisions:
  - "No setPersistence() call — Firebase defaults to LOCAL persistence on web (avoids firebase-js-sdk#9319 wipe-on-re-call pitfall)"
  - "React.createElement used instead of JSX in src/index.js — no JSX transform configured in TSUP for plain JS"
  - "useCMSFirebase is the internal context hook — useCMSContent (Phase 3) is the public API"
  - "initFirebase and getFirebaseInstances are NOT exported from src/index.js — internal only"
  - "node --experimental-test-module-mocks flag required for mock.module in Node 22"

patterns-established:
  - "Firebase init guard: getApps().length === 0 ? initializeApp(config) : getApp()"
  - "Context provider pattern: createContext(null) + Provider + guard hook (throws if ctx is null)"
  - "TDD flow: RED commit (test + skip) then GREEN commit (implementation + all pass)"

requirements-completed: [FIRE-01]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 2 Plan 02: Firebase Init and CMSProvider Summary

**Firebase client SDK initializer with getApps() multi-init guard, CMSContext provider, and useCMSFirebase hook exposing { app, db, auth, storage } to all descendants**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T01:11:13Z
- **Completed:** 2026-03-11T01:14:08Z
- **Tasks:** 2 (Task 1 TDD: 2 commits — RED + GREEN; Task 2: 1 commit)
- **Files modified:** 4

## Accomplishments
- Implemented `src/firebase/init.js` — idempotent Firebase initializer with getApps() guard, never calling initializeApp twice
- Upgraded `CMSProvider` from pass-through stub to real React context provider accepting `firebaseConfig` prop
- Added `useCMSFirebase()` hook that throws a descriptive error when called outside CMSProvider
- All 4 node:test TDD tests pass; npm run build exits 0; dist/index.mjs starts with "use client"

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: init.test.js + npm test script** - `406fa27` (test)
2. **Task 1 GREEN: src/firebase/init.js implementation** - `ba65fe1` (feat)
3. **Task 2: CMSProvider upgrade + useCMSFirebase** - `c3ff963` (feat)

_Note: Task 1 was TDD — RED commit (test stubs skip) then GREEN commit (all 4 tests pass)_

## Files Created/Modified
- `src/firebase/init.js` - Firebase initializer with getApps() guard, exports initFirebase and getFirebaseInstances
- `src/firebase/init.test.js` - TDD test file (4 tests using node:test + mock.module for firebase/* mocks)
- `src/index.js` - CMSProvider upgraded to real context provider; useCMSFirebase added; stubs preserved
- `package.json` - Added "test" script with --experimental-test-module-mocks flag

## Decisions Made
- No `setPersistence()` call — Firebase's default LOCAL persistence is correct for web; calling setPersistence can wipe state on re-call (firebase-js-sdk#9319)
- `React.createElement` instead of JSX — TSUP is configured for plain JS without JSX transform
- `useCMSFirebase` is an internal hook; the public content API (`useCMSContent`) is Phase 3
- `initFirebase` and `getFirebaseInstances` are NOT re-exported from `src/index.js` — consumers use the context hook

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added --experimental-test-module-mocks flag to enable mock.module**
- **Found during:** Task 1 (TDD RED phase - running tests)
- **Issue:** `mock.module` is not a function in Node 22.9.0 without the `--experimental-test-module-mocks` flag. The test file from plan 02-01 used `await mock.module(...)` which threw TypeError.
- **Fix:** Added `"test": "node --experimental-test-module-mocks --test 'src/**/*.test.js'"` to package.json scripts. Tests now run correctly.
- **Files modified:** package.json
- **Verification:** All 4 tests pass with the flag; plan verify command updated accordingly
- **Committed in:** `406fa27` (RED phase commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — Rule 1 bug fix)
**Impact on plan:** Essential for the test runner to function. No scope creep.

## Issues Encountered
- `mock.module` API in Node 22.9.0 requires `--experimental-test-module-mocks` flag (not documented prominently in Node 22 release notes). Added npm test script to encapsulate this requirement.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/firebase/init.js` is the foundation for plans 02-03 (Firestore), 02-04 (Auth), and 02-05 (Storage)
- All downstream helpers should call `getFirebaseInstances()` to receive `{ db, auth, storage }`
- CMSProvider is the top-level wrapper for all CMS consumers — plans 03+ can call `useCMSFirebase()` inside it

---
*Phase: 02-firebase-layer*
*Completed: 2026-03-11*
