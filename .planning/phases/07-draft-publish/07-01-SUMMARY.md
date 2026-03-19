---
phase: 07-draft-publish
plan: 01
subsystem: database
tags: [firestore, testing, wave-0, publish, draft]

# Dependency graph
requires:
  - phase: 06-block-editor
    provides: saveDraft and publishPage functions in firestore.js, EditorHeader and PageEditor components
provides:
  - hasDraftChanges boolean field written in saveDraft (true) and publishPage (false)
  - Wave 0 test scaffolds for PublishConfirmModal and PublishToast (intentional red)
  - Phase 7 test extensions on EditorHeader.test.js and PageEditor.test.js (intentional red)
  - PUB-03 contract verified: getCMSContent and useCMSContent return published-only data
affects: [07-02-plan, EditorHeader, PageEditor, PublishConfirmModal, PublishToast]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Wave 0 Nyquist scaffolding: test files written before source files exist, skipping gracefully via try/catch + skip flag
    - Source inspection via readFileSync: verify contract without multi-layer mock chain

key-files:
  created:
    - src/admin/PublishConfirmModal.test.js
    - src/admin/PublishToast.test.js
  modified:
    - src/firebase/firestore.js
    - src/firebase/firestore.test.js
    - src/admin/EditorHeader.test.js
    - src/admin/PageEditor.test.js
    - src/index.test.js
    - src/server/index.test.js

key-decisions:
  - "hasDraftChanges field written as boolean (not derived) so EditorHeader can read it directly from Firestore without calculating diff"
  - "Wave 0 test scaffolds use try/catch around readFileSync so they fail the existence test only, skipping all others when source file is absent"
  - "PUB-03 verified via source inspection of existing getCMSContent/useCMSContent — both already return published sub-object only"

patterns-established:
  - "Wave 0 guard pattern: let src = null; try { src = readFileSync(...) } catch { src = null } — tests skip gracefully until Plan 02 creates components"

requirements-completed: [PUB-01, PUB-02, PUB-03]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 7 Plan 01: Draft / Publish — Data Layer and Test Scaffolding Summary

Firestore helpers extended with hasDraftChanges boolean tracking; PUB-03 contract confirmed via source inspection; Wave 0 test scaffolds for PublishConfirmModal, PublishToast, EditorHeader Phase 7 controls, and PageEditor publish wiring created in intentional red state for Plan 02.

## Performance

- Duration: 4 min
- Started: 2026-03-19T00:29:52Z
- Completed: 2026-03-19T00:34:20Z
- Tasks: 2
- Files modified: 6 modified, 2 created

## Accomplishments
- saveDraft now writes hasDraftChanges: true to Firestore on every auto-save
- publishPage now writes hasDraftChanges: false to Firestore on publish
- PUB-03 verified: both getCMSContent (server) and useCMSContent (client) confirmed to return published sub-object only via source inspection
- 2 Wave 0 test scaffolds created (PublishConfirmModal, PublishToast) — 13 + 9 assertions ready to go green in Plan 02
- 7 Phase 7 assertions added to EditorHeader.test.js and 7 to PageEditor.test.js (Wave 0 red)

## Task Commits

Each task was committed atomically:

1. Task 1: Extend Firestore helpers with hasDraftChanges + scaffold Wave 0 tests for new components - `f565028` (feat)
2. Task 2: Add PUB-03 contract tests + EditorHeader and PageEditor test extensions - `9cb30b7` (feat)

Plan metadata: (docs commit — see below)

## Files Created/Modified
- `src/firebase/firestore.js` - saveDraft writes hasDraftChanges: true, publishPage writes hasDraftChanges: false
- `src/firebase/firestore.test.js` - two source-inspection tests for hasDraftChanges (green)
- `src/admin/PublishConfirmModal.test.js` - Wave 0 scaffold, 13 assertions (intentional red — component not yet created)
- `src/admin/PublishToast.test.js` - Wave 0 scaffold, 9 assertions (intentional red — component not yet created)
- `src/server/index.test.js` - PUB-03 contract test for getCMSContent (green)
- `src/index.test.js` - PUB-03 contract test for useCMSContent (green)
- `src/admin/EditorHeader.test.js` - 7 Phase 7 Wave 0 assertions for publish controls (intentional red)
- `src/admin/PageEditor.test.js` - 7 Phase 7 Wave 0 assertions for publish wiring (intentional red)

## Decisions Made
- hasDraftChanges written as an explicit boolean field on the Firestore document (not derived at read time) so EditorHeader can receive it directly as a prop from PageEditor without computing a diff
- PUB-03 verified by source inspection rather than runtime mock — both functions already return published sub-object only (confirmed in Phase 3/6 decisions)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can now implement PublishConfirmModal, PublishToast, and extend EditorHeader and PageEditor against the Wave 0 test scaffolds
- Firestore data layer is ready: hasDraftChanges field will be written correctly on all save and publish operations
- All green tests passing; intentional red tests provide clear targets for Plan 02 implementation

---
*Phase: 07-draft-publish*
*Completed: 2026-03-19*
