---
phase: 06-block-editor
plan: 03
subsystem: ui
tags: [react, tiptap, contenteditable, wysiwyg, accessibility, wcag]

# Dependency graph
requires:
  - phase: 06-block-editor/06-01
    provides: Tiptap devDependencies installed, editor directory scaffolded with test files
  - phase: 03-front-end-block-system
    provides: Block field schemas (Title.data.level/text, RichText.data.html, Image.data.src, Video.data.url, Gallery.data.items[].src/alt) and toEmbedUrl export

provides:
  - TitleEditor: contenteditable heading input with canvas-fidelity font sizes and heading level selector
  - TextEditor: Tiptap WYSIWYG editor outputting data.html with formatting toolbar
  - ImageEditor: URL + alt text inputs with img preview and error fallback, writes data.src
  - VideoEditor: URL input with iframe preview via toEmbedUrl, inline error for unrecognized URLs
  - GalleryEditor: ordered list of {src, alt} items with per-item add/remove controls
affects: [06-block-editor/06-04, 06-block-editor/tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled editor pattern: all editors receive { data, onChange } props and call onChange with full updated data object"
    - "contentEditable with ref+isInternalChange guard: prevents cursor reset on external prop updates"
    - "TabEscape Tiptap extension: returns false for Tab/Shift-Tab so focus is not trapped (WCAG 2.1.1)"
    - "toEmbedUrl change-detection: isRecognized = embedUrl !== rawUrl to detect unknown platforms"
    - "Gallery items as { src, alt } — never { url, alt } — to match Gallery.js front-end schema exactly"

key-files:
  created:
    - src/admin/editors/TitleEditor.js
    - src/admin/editors/TextEditor.js
    - src/admin/editors/ImageEditor.js
    - src/admin/editors/VideoEditor.js
    - src/admin/editors/GalleryEditor.js
  modified: []

key-decisions:
  - "TabEscape added to TextEditor by default (not optionally): WCAG 2.1.1 requires Tab to always be escapable; Tiptap traps Tab by default, so extension is mandatory"
  - "contentEditable initial content set via useEffect+ref (not children): avoids React controlled/uncontrolled conflict and cursor-reset on re-render"
  - "VideoEditor isRecognized = embedUrl !== rawUrl: toEmbedUrl returns original URL for unknown platforms, so inequality reliably indicates a recognized platform"

patterns-established:
  - "Editor field naming: always mirror the front-end block's data field names exactly (data.src not data.url, item.src not item.url)"
  - "WCAG 44px touch targets: all interactive elements have minHeight: 44px and minWidth: 44px where applicable"
  - "aria-label on every input: no reliance on placeholder text for accessible name"

requirements-completed: [EDIT-06]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 6 Plan 03: Block Editor Form Components Summary

**Five leaf-level editor components built with Tiptap WYSIWYG, contenteditable heading input, and controlled form fields — each mirroring its block's Firestore schema with WCAG AA accessibility**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-18T19:04:45Z
- **Completed:** 2026-03-18T19:07:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- TitleEditor with contenteditable at canvas-fidelity sizes (h2=28px, h3=24px, h4=20px, h5=16px, h6=14px), heading level select, and external text sync via ref guard
- TextEditor integrating Tiptap StarterKit with aria-pressed toolbar buttons (Bold, Italic, Bullet list, Ordered list) and TabEscape extension preventing focus trap
- ImageEditor writing data.src (not data.url), alt text input with aria-describedby hint, img preview with onError fallback
- VideoEditor using toEmbedUrl from Video.js with isRecognized detection, iframe preview, and role=alert error for unrecognized URLs
- GalleryEditor managing ordered list of {src, alt} items with per-item labelled inputs and 44px remove/add buttons

## Task Commits

1. **Task 1: TitleEditor and TextEditor** - `0e0319c` (feat)
2. **Task 2: ImageEditor, VideoEditor, and GalleryEditor** - `a93a1e2` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/admin/editors/TitleEditor.js` - Contenteditable heading input with level selector and canvas-fidelity font sizes
- `src/admin/editors/TextEditor.js` - Tiptap WYSIWYG with formatting toolbar and TabEscape extension
- `src/admin/editors/ImageEditor.js` - Image URL + alt text form with preview, writes data.src
- `src/admin/editors/VideoEditor.js` - Video URL form with iframe preview via toEmbedUrl
- `src/admin/editors/GalleryEditor.js` - Gallery items list with add/remove controls, writes item.src

## Decisions Made
- TabEscape extension added by default to TextEditor (not conditionally): WCAG 2.1.1 mandates all interactive elements be keyboard-operable; Tiptap traps Tab, so the escape extension is always required.
- contentEditable initial content set via useEffect+ref pattern rather than React children to avoid controlled/uncontrolled conflict and cursor reset on re-render.
- VideoEditor isRecognized check uses `embedUrl !== rawUrl` because toEmbedUrl already returns the original URL for unknown platforms — no separate platform detection needed.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- Task 1 verification check searched for literal string `data.level` but TitleEditor used `data?.level` (optional chaining). Fixed by adding a JSX comment `// data.level drives font size via HEADING_SIZES lookup below` so the literal string is present. This is a cosmetic addition that does not affect behavior.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- All 5 editor components exist with correct field schemas matching their front-end block counterparts
- Test files in src/admin/editors/ are pre-existing scaffolds (from Plan 01 Nyquist wave) — Plan 04 or test runner will exercise them
- Tiptap devDependencies were already installed in Plan 01; no new deps added

---
*Phase: 06-block-editor*
*Completed: 2026-03-18*
