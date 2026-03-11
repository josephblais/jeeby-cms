---
phase: 03-front-end-block-system
plan: "05"
subsystem: ui
tags: [react, blocks, registry, component-system]

# Dependency graph
requires:
  - phase: 03-front-end-block-system
    provides: Title, Paragraph, RichText, Image, Video, Gallery block components (Plans 03 and 04)
  - phase: 02-firebase-layer
    provides: getCMSContent/useCMSContent returning { blocks: [...], ... } shape

provides:
  - BLOCK_REGISTRY mapping type strings to React block components
  - Block wrapper component with jeeby-cms-block class, id passthrough, className merge
  - Blocks renderer that maps block data arrays to registered components with silent skip for unknown types
  - src/index.js re-exports real Blocks and Block (stubs replaced)
  - Full test suite: 64 tests passing with 0 skips

affects: [phase-4-admin-auth, phase-5-page-manager, phase-6-block-editor, phase-8-css-theming]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BLOCK_REGISTRY object: maps lowercase type strings to React components; Phase 6 must use these exact strings"
    - "Block wrapper: jeeby-cms-block CSS class applied to every block div — Phase 8 CSS targets this class"
    - "components prop on Blocks: { ...BLOCK_REGISTRY, ...components } merge enables custom block registration without API change"
    - "createElement (not JSX) in all src/blocks/*.js files — enables direct Node.js test runner import without JSX transform"
    - "mock.module for isomorphic-dompurify in index.test.js — resolves transitive CJS/ESM conflict from html-encoding-sniffer"

key-files:
  created:
    - src/blocks/index.js
  modified:
    - src/index.js
    - src/blocks/Title.js
    - src/blocks/Paragraph.js
    - src/blocks/RichText.js
    - src/blocks/index.test.js

key-decisions:
  - "Block wrapper (jeeby-cms-block class) delivers structure only in Phase 3 — CSS custom property values (--jeeby-cms-max-width, --jeeby-cms-block-spacing) deferred to Phase 8"
  - "components prop merges custom registry at render time — enables extensibility without breaking API"
  - "createElement (not JSX) in block files — Title.js, Paragraph.js, RichText.js converted from JSX to createElement to match Image.js/Video.js/Gallery.js pattern"
  - "isomorphic-dompurify mock added to index.test.js — required because static import of RichText.js triggers transitive CJS/ESM conflict"

patterns-established:
  - "Block type strings are lowercase: 'title', 'paragraph', 'richtext', 'image', 'video', 'gallery' — Phase 6 must use exact same strings"
  - "All src/blocks/*.js files use createElement not JSX — allows Node.js test runner to import without JSX transform"

requirements-completed: [FRONT-03, FRONT-04]

# Metrics
duration: 25min
completed: 2026-03-11
---

# Phase 3 Plan 05: Block System Assembly Summary

**BLOCK_REGISTRY wired through Blocks/Block renderer with 64-test full suite passing — jeeby-cms now renders all 6 block types from Firestore data**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-11T06:30:00Z
- **Completed:** 2026-03-11T06:55:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `src/blocks/index.js` with BLOCK_REGISTRY, Block wrapper, and Blocks renderer
- Block wrapper applies `jeeby-cms-block` class with id and className passthrough (Phase 8 CSS hook)
- Blocks renderer silently skips unknown block types; accepts `components` prop for custom block registration
- Replaced null stubs in `src/index.js` with real re-exports from `./blocks/index.js`
- Full suite of 64 tests passes with 0 skips — all block component tests now run (no silent skips)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/blocks/index.js** - `07d6291` (feat)
2. **Task 2: Wire src/index.js stubs to real exports** - `132c01e` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD tasks: RED state was confirmed (tests skipped due to missing index.js), then GREEN after implementation._

## Files Created/Modified

- `src/blocks/index.js` - BLOCK_REGISTRY, Block wrapper, Blocks renderer
- `src/index.js` - Null stubs replaced with `export { Blocks, Block } from './blocks/index.js'`
- `src/blocks/Title.js` - Converted from JSX to createElement (Node.js test runner compatibility)
- `src/blocks/Paragraph.js` - Converted from JSX to createElement (Node.js test runner compatibility)
- `src/blocks/RichText.js` - Converted from JSX to createElement (Node.js test runner compatibility)
- `src/blocks/index.test.js` - Added isomorphic-dompurify mock to resolve transitive CJS/ESM conflict

## Decisions Made

- Block wrapper class `jeeby-cms-block` is the Phase 8 CSS targeting hook — Phase 3 delivers structure only, no CSS custom property values
- `components` prop uses `{ ...BLOCK_REGISTRY, ...components }` spread — custom types override built-ins cleanly
- All block files use `createElement` (not JSX) — eliminates need for JSX transform in Node.js test runner, consistent with Image.js, Video.js, Gallery.js pattern established in Plan 04

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Converted JSX to createElement in Title.js, Paragraph.js, RichText.js**
- **Found during:** Task 1 (Create src/blocks/index.js)
- **Issue:** `src/blocks/index.js` statically imports `Title.js`, `Paragraph.js`, `RichText.js` which used JSX syntax. Node.js test runner throws `SyntaxError: Unexpected token '<'` when importing these files, causing all `index.test.js` tests to silently skip (try/catch pattern)
- **Fix:** Converted all three files from JSX return statements to `React.createElement()` calls, consistent with the established pattern in `Image.js`, `Video.js`, `Gallery.js` (documented in STATE.md: "React.createElement in block files (not JSX)")
- **Files modified:** src/blocks/Title.js, src/blocks/Paragraph.js, src/blocks/RichText.js
- **Verification:** 64 tests pass with 0 skips; individual Title/Paragraph tests now run instead of skipping
- **Committed in:** `07d6291` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added isomorphic-dompurify mock to index.test.js**
- **Found during:** Task 1 — after fixing JSX, import still failed due to RichText.js → isomorphic-dompurify → html-encoding-sniffer → @exodus/bytes CJS/ESM conflict
- **Issue:** `index.js` statically imports `RichText.js` → `isomorphic-dompurify`, which has a transitive dependency chain causing `ERR_REQUIRE_ESM` in Node 22. Without the mock, all `index.test.js` tests silently skip
- **Fix:** Added `mock.module('isomorphic-dompurify', ...)` to `index.test.js` before the import, identical to the approach already used in `RichText.test.js`
- **Files modified:** src/blocks/index.test.js
- **Verification:** All 6 Blocks/Block tests run and pass (no skips)
- **Committed in:** `07d6291` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 - Bug, 1 Rule 2 - Missing Critical)
**Impact on plan:** Both auto-fixes required for test suite to actually execute. Without them, all index tests silently skipped — the plan's success criteria ("all tests pass") would have been falsely met via skips.

## Issues Encountered

- Transitive CJS/ESM conflict in isomorphic-dompurify's jsdom dependency chain (html-encoding-sniffer@6 uses require() on @exodus/bytes pure-ESM module in Node 22) — resolved with mock.module per established pattern in RichText.test.js

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Block system fully assembled. Consumers can `import { Blocks, Block } from 'jeeby-cms'` and render CMS content
- `BLOCK_REGISTRY` type string convention documented in code — Phase 6 (Block Editor) must use exact lowercase strings
- `jeeby-cms-block` CSS class is the Phase 8 hook — no CSS defined in Phase 3
- Phase 4 (Admin Auth) can begin independently — no block system dependencies

---
*Phase: 03-front-end-block-system*
*Completed: 2026-03-11*
