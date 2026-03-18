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
| **Framework** | Node built-in assert (source-inspection pattern) |
| **Config file** | none — tests are standalone scripts |
| **Quick run command** | `node tests/test-block-editor.js` |
| **Full suite command** | `node tests/test-page-editor.js && node tests/test-block-toolbar.js && node tests/test-block-card.js && node tests/test-title-editor.js && node tests/test-richtext-editor.js && node tests/test-image-editor.js && node tests/test-video-editor.js && node tests/test-gallery-editor.js && node tests/test-auto-save.js && node tests/test-delete-undo.js && node tests/test-block-editor.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node tests/test-block-editor.js`
- **After every plan wave:** Run full suite command above
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | EDIT-01 | source-inspect | `node tests/test-page-editor.js` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 0 | EDIT-02 | source-inspect | `node tests/test-block-toolbar.js` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 0 | EDIT-03 | source-inspect | `node tests/test-block-card.js` | ❌ W0 | ⬜ pending |
| 6-01-04 | 01 | 0 | EDIT-04 | source-inspect | `node tests/test-auto-save.js` | ❌ W0 | ⬜ pending |
| 6-01-05 | 01 | 0 | EDIT-05 | source-inspect | `node tests/test-delete-undo.js` | ❌ W0 | ⬜ pending |
| 6-01-06 | 01 | 0 | EDIT-06 | source-inspect | `node tests/test-title-editor.js` | ❌ W0 | ⬜ pending |
| 6-01-07 | 01 | 0 | EDIT-06 | source-inspect | `node tests/test-richtext-editor.js` | ❌ W0 | ⬜ pending |
| 6-01-08 | 01 | 0 | EDIT-06 | source-inspect | `node tests/test-image-editor.js` | ❌ W0 | ⬜ pending |
| 6-01-09 | 01 | 0 | EDIT-06 | source-inspect | `node tests/test-video-editor.js` | ❌ W0 | ⬜ pending |
| 6-01-10 | 01 | 0 | EDIT-06 | source-inspect | `node tests/test-gallery-editor.js` | ❌ W0 | ⬜ pending |
| 6-01-11 | 01 | 0 | EDIT-03 | source-inspect | `node tests/test-block-editor.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test-page-editor.js` — stubs for EDIT-01 (PageEditor renders canvas from Firestore)
- [ ] `tests/test-block-toolbar.js` — stubs for EDIT-02 (add block via BlockToolbar)
- [ ] `tests/test-block-card.js` — stubs for EDIT-03 (drag handle, delete button on hover)
- [ ] `tests/test-auto-save.js` — stubs for EDIT-04 (auto-save debounce ≤1s)
- [ ] `tests/test-delete-undo.js` — stubs for EDIT-05 (delete + 5s undo window)
- [ ] `tests/test-title-editor.js` — stubs for EDIT-06 (TitleEditor fields: content + level)
- [ ] `tests/test-richtext-editor.js` — stubs for EDIT-06 (RichTextEditor uses Tiptap, outputs data.html)
- [ ] `tests/test-image-editor.js` — stubs for EDIT-06 (ImageEditor writes data.src + data.alt)
- [ ] `tests/test-video-editor.js` — stubs for EDIT-06 (VideoEditor writes data.embedUrl)
- [ ] `tests/test-gallery-editor.js` — stubs for EDIT-06 (GalleryEditor items have src + alt)
- [ ] `tests/test-block-editor.js` — integration stub for reorder persistence (EDIT-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop reorder visual feedback | EDIT-03 | Framer Motion animation requires browser | Open editor, drag block, verify smooth animation and position update |
| Tiptap Tab key behavior | EDIT-06 | Runtime browser quirk in StarterKit 3.x | Open RichText editor, press Tab, verify focus doesn't escape the editor |
| Undo toast visibility / timing | EDIT-05 | UI feedback requires visual inspection | Delete a block, verify undo prompt appears, click Undo within 5s, verify block restored |
| Auto-save status indicator | EDIT-04 | Timing/visual feedback | Edit a block field, verify "Saving…" → "Saved" transition within ~1s |
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
