---
phase: 03-front-end-block-system
plan: "03"
subsystem: ui
tags: [react, wcag, accessibility, heading-levels, dompurify, sanitization, node-test]

# Dependency graph
requires:
  - phase: 03-front-end-block-system
    plan: "01"
    provides: JSX transform, test stub files for Title/Paragraph/RichText, react/react-dom devDeps

provides:
  - Title component with WCAG 1.3.1/2.4.6 heading level enforcement (h1→h2 fallback, h3 default)
  - Paragraph component with semantic <p> element (WCAG 1.3.1)
  - RichText component with isomorphic-dompurify sanitization preserving ARIA attributes (WCAG 1.1.1, 1.3.1, 4.1.1)
  - scripts/test-loader.js + scripts/test-register.js for JSX-capable Node.js test runner

affects: [03-front-end-block-system plan 05+, any consumer rendering text-based CMS blocks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "VALID_LEVELS = ['h2','h3','h4','h5','h6'] — h1 always falls back to h2 (reserved for page title)"
    - "Default heading level h3 for absent or unrecognized level values"
    - "DOMPurify ADD_ATTR includes aria-label, aria-describedby, aria-labelledby, role, tabindex"
    - "<div> wrapper for RichText (not <p>) — rich text can contain block-level elements"
    - "isomorphic-dompurify peer dep — no special SSR config needed, auto-detects environment"
    - "scripts/test-register.js added to enable JSX transform in Node.js test runner"

key-files:
  created:
    - src/blocks/Title.js
    - src/blocks/Paragraph.js
    - src/blocks/RichText.js
    - scripts/test-loader.js
    - scripts/test-register.js
  modified: []

key-decisions:
  - "h1 → h2 fallback (not h3) — h1 is reserved for the page title; the closest valid block heading is h2"
  - "h3 default for absent/unrecognized level — leaves room for h1 (page) and h2 (section) above block content"
  - "ADD_ATTR includes aria-label, aria-describedby, aria-labelledby, role, tabindex — DOMPurify strips these by default which would break accessible authored HTML"
  - "<div> not <p> for RichText wrapper — block-level elements inside <p> are invalid HTML"
  - "test-register.js added — Node.js test runner cannot parse JSX without a loader; scripts/ directory hosts test infrastructure"

patterns-established:
  - "Text block pattern: always use semantic HTML elements (h2-h6, p) — never div with role"
  - "Heading level clamping: h1→h2 explicit fallback, unknown→h3 default"
  - "RichText sanitization pattern: DOMPurify.sanitize(html, { ADD_ATTR: [...aria attrs...] })"

requirements-completed: [FRONT-05, FRONT-06, FRONT-07]

# Metrics
duration: ~12min
completed: 2026-03-11
---

# Phase 3 Plan 03: Text Block Components (Title, Paragraph, RichText) Summary

**Three text-based block components with full WCAG AA accessibility — heading level enforcement, semantic HTML, and DOMPurify sanitization preserving ARIA attributes**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-03-11
- **Tasks:** 2 of 2
- **Files created:** 5 (3 components + 2 test infrastructure)

## Accomplishments

- Title component: `VALID_LEVELS = ['h2'…'h6']` enforcement; `h1 → h2` fallback (reserved for page title); unknown levels → `h3` default; uses actual `<hN>` elements (never `<div role="heading">`) — WCAG 1.3.1, 2.4.6
- Paragraph component: wraps `data.text` in `<p>` — native semantics, no ARIA needed — WCAG 1.3.1
- RichText component: `DOMPurify.sanitize()` with `ADD_ATTR: ['aria-label', 'aria-describedby', 'aria-labelledby', 'role', 'tabindex']` preserves accessible authored HTML; `<div>` wrapper supports block-level content — WCAG 1.1.1, 1.3.1, 4.1.1
- `scripts/test-loader.js` + `scripts/test-register.js` — JSX-capable loader for Node.js built-in test runner
- All 15 tests pass (Title: 8, Paragraph: 4, RichText: 3), `npm run build` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Title Block + Paragraph Block** — `027a687` (feat)
2. **Task 2: RichText Block** — `38465ba` (feat)

## Files Created/Modified

- `src/blocks/Title.js` — Title component: VALID_LEVELS, h1→h2 fallback, h3 default, className prop
- `src/blocks/Paragraph.js` — Paragraph component: `<p>` wrapper, className prop, null-safe
- `src/blocks/RichText.js` — RichText component: DOMPurify sanitization, ARIA attr preservation, `<div>` wrapper
- `scripts/test-loader.js` — esbuild-based JSX loader for Node.js test runner
- `scripts/test-register.js` — `--import` hook that registers the JSX loader

## Decisions Made

- **`h1 → h2` fallback:** h1 is reserved for the page-level `<h1>` in the consumer's layout. A Title block with `level: 'h1'` is a content author mistake; clamping to h2 preserves heading hierarchy without silently producing an invalid document.
- **`h3` default for unknown levels:** Leaves room for h2 section headings above blocks. Default avoids the highest level in case the consumer already has an h2 in the surrounding layout.
- **`ADD_ATTR` includes all standard ARIA attributes:** Admin-authored rich text may include ARIA attributes on custom components or interactive elements. Stripping them silently breaks accessibility — DOMPurify's safe-by-default approach must be explicitly widened for ARIA.

## Deviations from Plan

None — all tasks completed as specified. The test runner infrastructure (test-loader.js, test-register.js) was anticipated by the plan's JSX transform setup in 03-01.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Title, Paragraph, and RichText are fully implemented and tested
- Plan 03-05 can import all three from `src/blocks/Title.js`, `src/blocks/Paragraph.js`, `src/blocks/RichText.js`
- JSX test runner infrastructure (`scripts/test-register.js`) is available for all future block component tests

## Self-Check: PASSED

- FOUND: src/blocks/Title.js
- FOUND: src/blocks/Paragraph.js
- FOUND: src/blocks/RichText.js
- Task commits: 027a687 (Task 1), 38465ba (Task 2)
- All 15 tests pass, exit code 0
- npm run build exits 0

---
*Phase: 03-front-end-block-system*
*Completed: 2026-03-11*
