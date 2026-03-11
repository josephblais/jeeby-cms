---
phase: "02"
plan: "03"
subsystem: firebase-firestore
tags: [firebase, firestore, crud, pages]
dependency_graph:
  requires: [02-02]
  provides: [FIRE-02, firestore-helpers]
  affects: [src/firebase/firestore.js]
tech_stack:
  patterns: [doc-per-page-schema, setDoc-merge, serverTimestamp]
key_files:
  created:
    - src/firebase/firestore.js
decisions:
  - "savePage uses setDoc with { merge: true } for create-or-update pattern"
  - "publishPage calls getPage first, throws Error if page not found"
  - "All timestamps use serverTimestamp() — never new Date()"
  - "pageRef internal helper keeps doc() calls DRY"
metrics:
  completed_date: "2026-03-11"
  tasks: 1
  files: 1
---

# Phase 02 Plan 03: Firestore CRUD Helpers Summary

**One-liner:** `src/firebase/firestore.js` — the single place in the codebase that makes raw Firestore calls, implementing all CRUD operations for the `/cms/pages/{slug}` schema.

## Tasks Completed

| Task | Name | Files |
|------|------|-------|
| 1 | Implement Firestore CRUD helpers | src/firebase/firestore.js (created) |

## What Was Built

### src/firebase/firestore.js

Five exported helper functions:

- `getPage(db, slug)` — `getDoc` on `doc(db, 'cms', 'pages', slug)`. Returns `snap.data()` if exists, `null` otherwise.
- `savePage(db, slug, data)` — `setDoc` with `{ merge: true }` + `updatedAt: serverTimestamp()`. Create-or-merge.
- `saveDraft(db, slug, blocks)` — `updateDoc` with `{ 'draft.blocks': blocks, updatedAt: serverTimestamp() }`. Page must exist.
- `publishPage(db, slug)` — calls `getPage` first, throws `Error('Page "${slug}" not found')` if null, then `updateDoc` with `{ 'published.blocks': page.draft?.blocks ?? [], lastPublishedAt: serverTimestamp() }`.
- `deletePage(db, slug)` — `deleteDoc` on page ref.

All 6 tests pass (`node --test src/firebase/firestore.test.js`).

## Deviations from Plan

None — implementation matches plan spec exactly.

## Self-Check: PASSED

- [x] src/firebase/firestore.js created with all 5 exports
- [x] All 6 tests pass
- [x] serverTimestamp() used for all timestamps
- [x] published.blocks pattern confirmed
- [x] Task committed atomically
