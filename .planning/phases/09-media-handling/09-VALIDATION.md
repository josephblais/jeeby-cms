---
phase: 9
slug: media-handling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None — discovered via glob in npm test script |
| **Quick run command** | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/ImageEditor.test.js' 'src/admin/editors/GalleryEditor.test.js'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command above
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 0 | MEDIA-03, MEDIA-04 | unit (source) | quick run | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 0 | CSS | source check | quick run | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | MEDIA-04 | unit (source) | quick run | ❌ W0 | ⬜ pending |
| 9-02-02 | 02 | 1 | MEDIA-04 | unit (source) | quick run | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 2 | MEDIA-03 | unit (source) | quick run | ❌ W0 | ⬜ pending |
| 9-03-02 | 03 | 2 | MEDIA-03 | unit (source) | quick run | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/admin/editors/ImageEditor.test.js` — add stubs/tests for: upload button present, `uploadFile` import present, `useCMSFirebase` import present, progress state class present, `role=alert` on error
- [ ] `src/admin/editors/GalleryEditor.test.js` — add stubs/tests for: per-item upload button present, batch upload button present, `uploadFile` import present, `useCMSFirebase` import present
- [ ] `styles/cms.css` — add `.jeeby-cms-upload-progress`, `.jeeby-cms-upload-error-row`, `.jeeby-cms-image-url-row` classes (these are CSS, tested via source assertion)

*Existing infrastructure (`node:test` runner, `test-register.js`, source-text assertion pattern) covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload progress bar fills during upload | MEDIA-03, MEDIA-04 | Requires real Firebase Storage connection | In dev environment: select an image file; verify progress bar fills left-to-right |
| Upload failure shows inline error + Retry | MEDIA-03, MEDIA-04 | Requires network error simulation | Disconnect network mid-upload or use wrong Storage rules; verify error message and Retry button appear |
| Gallery batch upload (multiple files) appends items | MEDIA-03 | Requires real Storage | Select 3+ images via "Upload multiple"; verify all appear as gallery items |
| MEDIA-01: Video embed URL still works | MEDIA-01 | Existing behavior, no change | Paste YouTube URL; verify iframe renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
