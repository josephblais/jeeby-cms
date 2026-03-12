---
phase: 03-front-end-block-system
plan: "02"
subsystem: api
tags: [firebase, firebase-admin, firestore, react, hooks, onSnapshot]

# Dependency graph
requires:
  - phase: 03-01
    provides: JSX transform enabled via loader config, test stubs for server/index and src/index
  - phase: 02-firebase-layer
    provides: initFirebase, useCMSFirebase, Firestore path convention (cms/pages/{slug})

provides:
  - getCMSContent(slug) — async server function returning published Firestore page data or null
  - getAdminFirestore() — Admin SDK Firestore instance helper
  - useCMSContent(slug) — React hook with real-time onSnapshot, returns { data, loading, error }
  - CMSProvider using JSX syntax (React.createElement replaced)

affects:
  - 03-front-end-block-system
  - 05-page-manager
  - 04-admin-auth

# Tech tracking
tech-stack:
  added: [firebase-admin/firestore (getFirestore), firebase/firestore (doc, onSnapshot)]
  patterns:
    - Admin SDK snap.exists is boolean property (not method) — Admin SDK pitfall documented inline
    - Client SDK snap.exists() is a method with parentheses
    - Published-only data exposure pattern: snap.data()?.published ?? null
    - useEffect cleanup via returned unsubscribe from onSnapshot

key-files:
  created: []
  modified:
    - src/firebase/admin.js
    - src/server/index.js
    - src/index.js

key-decisions:
  - "Admin SDK snap.exists is a boolean property — calling snap.exists() returns a truthy function ref (always true); must use if (!snap.exists)"
  - "getCMSContent returns published sub-object only — never exposes draft data to front end"
  - "useCMSContent returns unsubscribe directly from useEffect for automatic Firestore listener cleanup"
  - "CMSProvider converted to JSX syntax — React.createElement removed now that TSUP JSX loader is configured"

patterns-established:
  - "Published-only pattern: all public data access reads from .published sub-object, never .draft"
  - "Admin/client SDK guard: code comments document the exists property vs method distinction"

requirements-completed: [FRONT-01, FRONT-02]

# Metrics
duration: 12min
completed: 2026-03-11
---

# Phase 03 Plan 02: Data-Fetching Primitives Summary

**getCMSContent (Admin SDK, server) and useCMSContent (onSnapshot, client) implemented with published-only data exposure and JSX-converted CMSProvider**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-11T06:10:00Z
- **Completed:** 2026-03-11T06:22:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Implemented getCMSContent(slug) using firebase-admin/firestore — returns published sub-object or null; Admin SDK snap.exists pitfall guarded with inline comment
- Implemented useCMSContent(slug) with real-time onSnapshot listener returning { data, loading, error }; useEffect returns unsubscribe for automatic cleanup
- Converted CMSProvider from React.createElement to JSX syntax, removed default React import
- Added getAdminFirestore() helper to src/firebase/admin.js alongside existing getAdminAuth()

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getAdminFirestore + Implement getCMSContent** - `098dfae` (feat)
2. **Task 2: Implement useCMSContent Hook + Convert CMSProvider to JSX** - `221badd` (feat)

**Plan metadata:** `ad565c0` (docs: complete plan)

## Files Created/Modified

- `src/firebase/admin.js` - Added getFirestore import and getAdminFirestore() export
- `src/server/index.js` - Full getCMSContent implementation replacing stub; uses Admin SDK db.doc().get() with snap.exists property guard
- `src/index.js` - useCMSContent hook with onSnapshot; CMSProvider converted to JSX; default React import removed; firebase/firestore imports added

## Decisions Made

- Admin SDK `snap.exists` is a boolean property — `snap.exists()` is always truthy (returns function ref). Documented inline.
- Client SDK `snap.exists()` is a method — opposite convention from Admin SDK. Both cases commented in code.
- useCMSContent returns the unsubscribe function directly from useEffect (not wrapped in a closure) — simpler and equivalent.
- CMSProvider JSX conversion deferred to this plan because the TSUP JSX loader (`loader: { '.js': 'jsx' }`) was required first (done in Plan 01).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - test stubs from Plan 01 correctly anticipated the implementation shape. All 6 tests pass (3 server, 3 client).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- getCMSContent ready for use in Next.js Server Components
- useCMSContent ready for use in Client Components (requires CMSProvider wrapping)
- Both functions access published data only — correct security boundary established
- Blocks and Block stubs retained in src/index.js for Plan 05 implementation

---
*Phase: 03-front-end-block-system*
*Completed: 2026-03-11*
