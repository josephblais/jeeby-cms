---
phase: 5
slug: page-manager
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none — uses existing package.json `test` script |
| **Quick run command** | `node --test src/firebase/firestore.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | PAGE-01 | source inspection | `npm test` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | PAGE-01 | source inspection | `npm test` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | PAGE-06 | source inspection | `npm test` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 2 | PAGE-02 | source inspection | `npm test` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 2 | PAGE-05 | source inspection | `npm test` | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 2 | PAGE-03 | source inspection | `npm test` | ❌ W0 | ⬜ pending |
| 5-02-04 | 02 | 2 | PAGE-04 | source inspection | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/firebase/firestore.test.js` — extend existing file with stubs for `listPages` and `renamePage` (PAGE-01, PAGE-04)
- [ ] `src/admin/PageManager.test.js` — new test file with source inspection stubs (PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06)
- [ ] `src/admin/CreatePageModal.test.js` — source inspection stubs for modal accessibility contract (PAGE-02, PAGE-05)
- [ ] `src/admin/DeletePageModal.test.js` — source inspection stubs for delete modal accessibility contract (PAGE-03)

*Wave 0 stubs use `readFileSync` pattern (established in Phase 4) — no component mounting.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Debounced slug validation timing (300–500ms) | PAGE-05 | Timing behavior not verifiable via source inspection | Type slug in create modal, observe error appears ~300ms after stopping |
| Focus trap inside modals | PAGE-02/03 | Requires browser focus event testing | Tab through modal — focus must not leave dialog |
| Inline slug edit keyboard flow | PAGE-04 | Interactive keyboard behavior | Click slug cell, edit, press Enter (saves), press Escape (cancels) |
| Empty state renders when no pages exist | PAGE-01 | Requires live Firestore (empty collection) | View Page Manager with no pages in Firestore |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
