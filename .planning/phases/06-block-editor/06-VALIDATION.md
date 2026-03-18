---
phase: 6
slug: block-editor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in test runner + assert (source-inspection pattern) |
| **Config file** | `scripts/test-register.js` (import hook) |
| **Quick run command** | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/PageEditor.test.js'` |
| **Full suite command** | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/PageEditor.test.js' 'src/admin/BlockCanvas.test.js' 'src/admin/AddBlockButton.test.js' 'src/admin/BlockTypePicker.test.js' 'src/admin/EditorHeader.test.js' 'src/admin/UndoToast.test.js' 'src/admin/editors/TitleEditor.test.js' 'src/admin/editors/TextEditor.test.js' 'src/admin/editors/ImageEditor.test.js' 'src/admin/editors/VideoEditor.test.js' 'src/admin/editors/GalleryEditor.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command (PageEditor test)
- **After every plan wave:** Run full suite command above
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | EDIT-01 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/PageEditor.test.js'` | W0 | pending |
| 6-01-02 | 01 | 0 | EDIT-02 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/AddBlockButton.test.js'` | W0 | pending |
| 6-01-03 | 01 | 0 | EDIT-03 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/BlockCanvas.test.js'` | W0 | pending |
| 6-01-04 | 01 | 0 | EDIT-04 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/PageEditor.test.js'` | W0 | pending |
| 6-01-05 | 01 | 0 | EDIT-05 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/UndoToast.test.js'` | W0 | pending |
| 6-01-06 | 01 | 0 | EDIT-06 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/TitleEditor.test.js'` | W0 | pending |
| 6-01-07 | 01 | 0 | EDIT-06 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/TextEditor.test.js'` | W0 | pending |
| 6-01-08 | 01 | 0 | EDIT-06 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/ImageEditor.test.js'` | W0 | pending |
| 6-01-09 | 01 | 0 | EDIT-06 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/VideoEditor.test.js'` | W0 | pending |
| 6-01-10 | 01 | 0 | EDIT-06 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/GalleryEditor.test.js'` | W0 | pending |
| 6-01-11 | 01 | 0 | EDIT-03 | source-inspect | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/EditorHeader.test.js'` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/admin/PageEditor.test.js` — stubs for EDIT-01 (PageEditor renders canvas from Firestore)
- [ ] `src/admin/AddBlockButton.test.js` — stubs for EDIT-02 (add block via AddBlockButton)
- [ ] `src/admin/BlockCanvas.test.js` — stubs for EDIT-03 (drag handle, delete button on hover)
- [ ] `src/admin/EditorHeader.test.js` — stubs for EDIT-03 (editor header with save status)
- [ ] `src/admin/UndoToast.test.js` — stubs for EDIT-05 (delete + 5s undo window)
- [ ] `src/admin/editors/TitleEditor.test.js` — stubs for EDIT-06 (TitleEditor fields: content + level)
- [ ] `src/admin/editors/TextEditor.test.js` — stubs for EDIT-06 (TextEditor uses Tiptap, outputs data.html)
- [ ] `src/admin/editors/ImageEditor.test.js` — stubs for EDIT-06 (ImageEditor writes data.src + data.alt)
- [ ] `src/admin/editors/VideoEditor.test.js` — stubs for EDIT-06 (VideoEditor uses toEmbedUrl)
- [ ] `src/admin/editors/GalleryEditor.test.js` — stubs for EDIT-06 (GalleryEditor items have src + alt)
- [ ] `src/admin/BlockTypePicker.test.js` — stubs for EDIT-02 (block type picker listbox)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop reorder visual feedback | EDIT-03 | Framer Motion animation requires browser | Open editor, drag block, verify smooth animation and position update |
| Tiptap Tab key behavior | EDIT-06 | Runtime browser quirk in StarterKit 3.x | Open RichText editor, press Tab, verify focus doesn't escape the editor |
| Undo toast visibility / timing | EDIT-05 | UI feedback requires visual inspection | Delete a block, verify undo prompt appears, click Undo within 5s, verify block restored |
| Auto-save status indicator | EDIT-04 | Timing/visual feedback | Edit a block field, verify "Saving..." -> "Saved" transition within ~1s |
| Image preview after URL entry | EDIT-06 | Requires URL fetch in browser | Enter an image URL, verify thumbnail renders on canvas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
