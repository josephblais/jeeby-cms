---
phase: 7
slug: draft-publish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none — run via npm test script |
| **Quick run command** | `npm test -- --test-name-pattern "EditorHeader|PublishConfirm|PublishToast|PageEditor|firestore"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --test-name-pattern "EditorHeader|PublishConfirm|PublishToast|PageEditor|firestore"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| firestore-saveDraft-flag | 01 | 0 | PUB-02 | source inspection | `npm test -- --test-name-pattern "firestore"` | ✅ firestore.test.js | ⬜ pending |
| firestore-publishPage-flag | 01 | 0 | PUB-02 | source inspection | `npm test -- --test-name-pattern "firestore"` | ✅ firestore.test.js | ⬜ pending |
| EditorHeader-publish-props | 01 | 0 | PUB-01 | source inspection | `npm test -- --test-name-pattern "EditorHeader"` | ✅ EditorHeader.test.js | ⬜ pending |
| PublishConfirmModal-new | 01 | 0 | PUB-02 | source inspection | `npm test -- --test-name-pattern "PublishConfirmModal"` | ❌ Wave 0 | ⬜ pending |
| PublishToast-new | 01 | 0 | PUB-01 | source inspection | `npm test -- --test-name-pattern "PublishToast"` | ❌ Wave 0 | ⬜ pending |
| PageEditor-publish-wiring | 01 | 0 | PUB-02 | source inspection | `npm test -- --test-name-pattern "PageEditor"` | ✅ PageEditor.test.js | ⬜ pending |
| PUB-03-getCMSContent | 01 | 0 | PUB-03 | source inspection | `npm test -- --test-name-pattern "getCMSContent\|published"` | ✅ src/server/index.test.js | ⬜ pending |
| PUB-03-useCMSContent | 01 | 0 | PUB-03 | source inspection | `npm test -- --test-name-pattern "useCMSContent\|published"` | ✅ src/index.test.js | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/admin/PublishConfirmModal.test.js` — role="dialog", aria-modal, focus management, Escape close, error state, aria-labelledby, "Publish now" button, "Cancel" button, "use client" directive
- [ ] `src/admin/PublishToast.test.js` — role="status", aria-live="polite", aria-atomic="true", position fixed, "Page published successfully." text, "use client" directive
- [ ] New assertions in `src/admin/EditorHeader.test.js` — hasDraftChanges prop, lastPublishedAt prop, onPublish prop, "Unpublished changes" text, "Last published:" text, "Publish" button
- [ ] New assertions in `src/admin/PageEditor.test.js` — publishPage import, showPublishModal state, handlePublish wiring
- [ ] New assertions in `src/firebase/firestore.test.js` — `hasDraftChanges: true` in saveDraft source, `hasDraftChanges: false` in publishPage source
- [ ] PUB-03 assertion in `src/server/index.test.js` — `?.published` in getCMSContent source
- [ ] PUB-03 assertion in `src/index.test.js` — `?.published` in useCMSContent source

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Publish button disabled while saving | PUB-02 | UI state — not testable via source inspection | Open editor, type in a block, immediately click Publish — button should be disabled while "Saving..." is shown |
| hasDraftChanges clears after publish | PUB-02 | Requires live Firestore | Publish a page, reload editor — "Unpublished changes" text should disappear |
| lastPublishedAt refreshes after publish | PUB-01 | Requires live Firestore (serverTimestamp sentinel) | Publish a page — header date should update to today's date |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
