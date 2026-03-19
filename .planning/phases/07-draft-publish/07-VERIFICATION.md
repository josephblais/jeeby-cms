---
phase: 07-draft-publish
verified: 2026-03-19T02:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 7: Draft / Publish Verification Report

**Phase Goal:** The live site always serves published content, and admins have explicit control over when changes go live.
**Verified:** 2026-03-19
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                  | Status     | Evidence                                                                                |
| --- | -------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| 1   | saveDraft() writes hasDraftChanges: true to Firestore on every save                   | VERIFIED   | firestore.js line 33: `hasDraftChanges: true` in updateDoc payload; test ok 232 passes |
| 2   | publishPage() writes hasDraftChanges: false to Firestore on publish                   | VERIFIED   | firestore.js line 45: `hasDraftChanges: false` in updateDoc payload; test ok 233 passes |
| 3   | getCMSContent returns only published sub-object (not draft)                            | VERIFIED   | server/index.js line 45: `return pageData?.published ?? null`; test ok 253 passes       |
| 4   | useCMSContent returns only published sub-object (not draft)                            | VERIFIED   | src/index.js line 77: `snap.data()?.published ?? null`; test ok 249 passes              |
| 5   | EditorHeader displays last published date and unpublished changes indicator            | VERIFIED   | EditorHeader.js: jeeby-cms-publish-controls, Last published, Unpublished changes; tests 66-72 pass |
| 6   | Clicking Publish opens a confirmation modal with Cancel and Publish now buttons        | VERIFIED   | PublishConfirmModal.js: role="dialog", Cancel button, "Publish now" button; tests 112-124 pass |
| 7   | Confirming publish copies draft to published and updates the header                    | VERIFIED   | PageEditor.js: handlePublish calls publishPage(), re-reads getPage(), sets lastPublishedAt and hasDraftChanges=false |
| 8   | A success toast appears after publish and auto-dismisses after 3 seconds               | VERIFIED   | PublishToast.js: role="status" "Page published successfully."; PageEditor.js: setTimeout 3000ms; tests 125-133 pass |

**Score:** 8/8 truths verified

---

### Required Artifacts

#### Plan 01 Artifacts

| Artifact                               | Provides                                      | Status   | Details                                             |
| -------------------------------------- | --------------------------------------------- | -------- | --------------------------------------------------- |
| `src/firebase/firestore.js`            | hasDraftChanges field in saveDraft/publishPage | VERIFIED | Contains `hasDraftChanges: true` and `: false`; wired via updateDoc |
| `src/admin/PublishConfirmModal.test.js` | Wave 0 test scaffold for PublishConfirmModal   | VERIFIED | 13 tests; contains `role="dialog"` and "Publish now"; now green |
| `src/admin/PublishToast.test.js`       | Wave 0 test scaffold for PublishToast          | VERIFIED | 9 tests; contains `role="status"`; now green        |

#### Plan 02 Artifacts

| Artifact                          | Provides                                     | Status   | Details                                                           |
| --------------------------------- | -------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `src/admin/EditorHeader.js`       | Publish controls in header right slot        | VERIFIED | Contains `jeeby-cms-publish-controls`, `Last published:`, `Unpublished changes`, `Publish` button, `formatDate` helper |
| `src/admin/PublishConfirmModal.js` | Publish confirmation modal with focus trap   | VERIFIED | Contains `role="dialog"`, `aria-modal="true"`, focus trap (Escape + Tab), `role="alert"` error state, `triggerRef` |
| `src/admin/PublishToast.js`       | Success toast for publish action             | VERIFIED | Contains `role="status"`, `aria-live="polite"`, "Page published successfully.", `jeeby-cms-publish-toast` |
| `src/admin/PageEditor.js`         | Publish state management and wiring          | VERIFIED | Contains `handlePublish`, `showPublishModal`, `lastPublishedAt`, `hasDraftChanges`, `openPublishModal` |

---

### Key Link Verification

| From                          | To                              | Via                                           | Status   | Evidence                                                        |
| ----------------------------- | ------------------------------- | --------------------------------------------- | -------- | --------------------------------------------------------------- |
| `src/firebase/firestore.js`   | `firebase/firestore`            | updateDoc call in saveDraft                   | WIRED    | Line 31-36: updateDoc with `hasDraftChanges: true`              |
| `src/firebase/firestore.js`   | `firebase/firestore`            | updateDoc call in publishPage                 | WIRED    | Line 42-47: updateDoc with `hasDraftChanges: false`             |
| `src/admin/PageEditor.js`     | `src/firebase/firestore.js`     | publishPage import and handlePublish call     | WIRED    | Line 4: `import { ..., publishPage }` from firestore.js; line 165: `await publishPage(db, slug)` |
| `src/admin/PageEditor.js`     | `src/admin/EditorHeader.js`     | lastPublishedAt, hasDraftChanges, onPublish props | WIRED | Lines 222-226 in JSX: `lastPublishedAt={lastPublishedAt}`, `hasDraftChanges={hasDraftChanges}`, `onPublish={openPublishModal}` |
| `src/admin/PageEditor.js`     | `src/admin/PublishConfirmModal.js` | showPublishModal state controls modal         | WIRED    | Lines 249-258: `{showPublishModal && <PublishConfirmModal open={showPublishModal} ...>}` |
| `src/admin/EditorHeader.js`   | `src/admin/PageEditor.js`       | onPublish callback triggers modal open        | WIRED    | EditorHeader.js line 107: Publish button `onClick={onPublish}`; PageEditor passes `onPublish={openPublishModal}` |
| `src/admin/PageEditor.js`     | `src/admin/PublishToast.js`     | showPublishToast state, 3s auto-dismiss       | WIRED    | Line 260: `{showPublishToast && <PublishToast />}`; lines 65-69: useEffect with 3000ms setTimeout |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                 | Status    | Evidence                                                                   |
| ----------- | ----------- | --------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| PUB-01      | 07-01, 07-02 | PublishBar shows last published date and unsaved indicator                  | SATISFIED | EditorHeader.js: `Last published: {formatDate(lastPublishedAt)}` + `Unpublished changes` indicator; tests 66-72 pass |
| PUB-02      | 07-01, 07-02 | Admin can publish a page (copies draft to published, updates lastPublishedAt) | SATISFIED | publishPage() in firestore.js copies `draft.blocks` to `published.blocks` and writes `lastPublishedAt`; PageEditor wires handlePublish end-to-end; tests pass |
| PUB-03      | 07-01        | Front-end always reads from published.blocks; live site unaffected until publish | SATISFIED | getCMSContent returns `pageData?.published ?? null` (server/index.js:45); useCMSContent sets data to `snap.data()?.published ?? null` (src/index.js:77); tests ok 249 and ok 253 pass |

Note: REQUIREMENTS.md status table shows PUB-03 as "Pending" but the implementation and tests confirm it is satisfied. The requirements table was not updated after Plan 01 completed. All three requirement IDs claimed in the PLAN frontmatter are implemented and tested.

---

### Anti-Patterns Found

No blockers or warnings found.

| File                              | Pattern Checked                                | Result   |
| --------------------------------- | ---------------------------------------------- | -------- |
| `src/admin/PublishConfirmModal.js` | Placeholder return, empty handlers             | Clean    |
| `src/admin/PublishToast.js`       | Placeholder return, static stub                | Clean    |
| `src/admin/EditorHeader.js`       | TODO/FIXME, stub implementations               | Clean    |
| `src/admin/PageEditor.js`         | Disconnected state, missing wiring             | Clean    |
| `src/firebase/firestore.js`       | hasDraftChanges missing from updateDoc payloads | Clean    |

Pre-existing failures in the test suite (not introduced by Phase 7):
- `not ok 52 - DeletePageModal confirm button uses destructive style`
- `not ok 226 - listPages uses collection(db, cms, pages) path`

Both confirmed present before Phase 7 began (documented in 07-02-SUMMARY.md).

---

### Human Verification Required

#### 1. Publish Modal Focus Trap — Live Browser Test

**Test:** Open the admin editor for any page, click the Publish button, then use Tab and Shift-Tab to cycle through interactive elements in the modal.
**Expected:** Focus cycles only within Cancel and Publish now buttons; focus does not escape to the page behind the backdrop.
**Why human:** Focus trap behavior requires a real browser with a live DOM. The source-inspection tests confirm the pattern is written correctly (Tab handler, querySelectorAll selector), but only a browser can verify runtime behavior.

#### 2. Focus Return After Modal Close

**Test:** Click Publish to open the modal, then click Cancel or press Escape. Observe where keyboard focus lands.
**Expected:** Focus returns to the Publish button in EditorHeader (the trigger element).
**Why human:** The triggerRef pattern is wired in code, but DOM focus return requires browser runtime verification.

#### 3. Toast Auto-Dismiss Timing

**Test:** Publish a page and observe the success toast. Do not interact with the page after publish.
**Expected:** The "Page published successfully." toast appears immediately after publish completes, then disappears on its own after approximately 3 seconds.
**Why human:** setTimeout behavior across re-renders and the visual presentation of the toast require browser observation.

#### 4. Publish Button Disabled During Auto-Save

**Test:** Edit a block to trigger auto-save (1-second debounce). While the "Saving..." status is visible, click the Publish button.
**Expected:** The Publish button is disabled (click does nothing, cursor shows not-allowed) while auto-save is in flight.
**Why human:** Requires timing-sensitive interaction in a live browser environment.

#### 5. "Last published: Never" Initial State

**Test:** Create a new page that has never been published. Open its editor.
**Expected:** EditorHeader shows "Last published: Never".
**Why human:** Requires a real Firestore connection to confirm `lastPublishedAt` is null/undefined on a new page and that `formatDate(null)` renders "Never" in the UI.

---

## Gaps Summary

No gaps. All must-haves from both Plan 01 and Plan 02 are verified against the actual codebase.

- All 8 observable truths verified with code evidence and passing tests.
- All 7 required artifacts exist, are substantive, and are wired.
- All 7 key links confirmed through source inspection.
- All 3 requirement IDs (PUB-01, PUB-02, PUB-03) are satisfied.
- Zero blocker anti-patterns found.
- 2 pre-existing test failures are unchanged from before Phase 7.
- 5 items flagged for human verification (visual/interactive behavior in live browser).

---

_Verified: 2026-03-19_
_Verifier: Claude (gsd-verifier)_
