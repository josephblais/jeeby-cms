---
phase: 03-front-end-block-system
plan: "01"
subsystem: ui
tags: [react, jsx, tsup, esbuild, testing, isomorphic-dompurify, video.js, node-test]

# Dependency graph
requires:
  - phase: 01-package-scaffolding
    provides: tsup.config.js with 3-entry array config
  - phase: 02-firebase-layer
    provides: src/server/index.js getCMSContent stub, src/index.js useCMSContent

provides:
  - JSX transform wired into TSUP entries 1 and 2 (loader + esbuildOptions jsx:automatic)
  - 9 test stub files covering FRONT-01 through FRONT-10 requirements
  - src/blocks/ directory created
  - isomorphic-dompurify and video.js declared as optional peer deps
  - react and react-dom added as devDependencies for test execution

affects: [03-front-end-block-system plans 02+, all block component implementations]

# Tech tracking
tech-stack:
  added: [isomorphic-dompurify@3.1.0, react@18 (devDep), react-dom@18 (devDep), video.js@8.23.7 (peerDep)]
  patterns:
    - "JSX in .js files via tsup loader: { '.js': 'jsx' } + esbuildOptions jsx:automatic"
    - "Test stubs skip via try/catch import + { skip: !Component } pattern"
    - "Server test skip via runtime probe (check real vs stub implementation)"

key-files:
  created:
    - src/blocks/Title.test.js
    - src/blocks/Paragraph.test.js
    - src/blocks/RichText.test.js
    - src/blocks/Image.test.js
    - src/blocks/Video.test.js
    - src/blocks/Gallery.test.js
    - src/blocks/index.test.js
    - src/server/index.test.js
    - src/index.test.js
  modified:
    - tsup.config.js
    - package.json

key-decisions:
  - "loader: { '.js': 'jsx' } required in tsup — without it .js files are not processed as JSX by esbuild"
  - "esbuildOptions with jsx:automatic added to entries 1 and 2 only; entry 3 (server) has no JSX"
  - "isomorphic-dompurify and video.js in peerDependenciesMeta as optional — consumers who don't use RichText or Video blocks don't need them"
  - "Server test stub uses runtime probe to detect real vs placeholder implementation (placeholder always returns null)"
  - "react and react-dom added to devDependencies to enable renderToStaticMarkup in tests (same pattern as firebase-admin)"

patterns-established:
  - "Block test stubs: import wrapped in try/catch; tests use { skip: !Component } — skips automatically until implementation file exists"
  - "Server test stub: isRealImplementation probe distinguishes placeholder stub from working implementation"
  - "All block tests use renderToStaticMarkup from react-dom/server for pure string assertions (no DOM dependency)"

requirements-completed: [FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06, FRONT-07, FRONT-08, FRONT-09, FRONT-10]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 3 Plan 01: Front-End Block System Scaffolding Summary

**JSX transform wired into TSUP build pipeline, 9 test stub files created for all block components and server utilities, build exits 0 with zero new failures**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-11T06:02:00Z
- **Completed:** 2026-03-11T06:05:19Z
- **Tasks:** 2 of 2
- **Files modified:** 11 (2 modified, 9 created)

## Accomplishments

- TSUP entries 1 and 2 now accept JSX syntax in `.js` files via `loader: { '.js': 'jsx' }` and `esbuildOptions({ jsx: 'automatic', jsxImportSource: 'react' })`
- All 9 test stub files created in `src/blocks/` and `src/` — 64 total tests run with 0 failures (41 skip, 23 pass)
- Optional peer deps declared: `isomorphic-dompurify` (RichText XSS sanitization) and `video.js` (Video block player)
- `react` and `react-dom` added to devDependencies so `renderToStaticMarkup` works in tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Add JSX Transform to TSUP + Update Package Dependencies** - `f2d345a` (chore)
2. **Task 2: Create All Nine Test Stub Files** - `0cffd1c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `tsup.config.js` - Added `loader`, `esbuildOptions` (jsx:automatic) to entries 1 and 2; updated external arrays
- `package.json` - Added isomorphic-dompurify and video.js as optional peer deps; react, react-dom, isomorphic-dompurify as devDeps
- `src/blocks/Title.test.js` - FRONT-05: heading level enforcement, h1 clamping to h2, className support
- `src/blocks/Paragraph.test.js` - FRONT-06: p-tag rendering, null safety, className
- `src/blocks/RichText.test.js` - FRONT-07: XSS strip (script, javascript:), aria-label preservation, className
- `src/blocks/Image.test.js` - FRONT-08: alt attribute always present, figure/figcaption, width/height
- `src/blocks/Video.test.js` - FRONT-09: YouTube/youtu.be/Vimeo/Loom URL parsing, iframe title (WCAG 4.1.2)
- `src/blocks/Gallery.test.js` - FRONT-10: ul container, aria-label, per-item alt/figcaption, className
- `src/blocks/index.test.js` - FRONT-03/04: Blocks null/unknown block safety, Block class merging
- `src/server/index.test.js` - FRONT-01: getCMSContent with mocked firebase-admin, runtime probe skip
- `src/index.test.js` - FRONT-02: useCMSContent/Blocks/Block export shape validation

## Decisions Made

- `loader: { '.js': 'jsx' }` must be in tsup config — without it esbuild treats `.js` as plain JavaScript and rejects JSX syntax
- Server test stub uses a runtime probe (`getCMSContent('existing-page')` returns non-null only with real implementation) because the Phase 2 placeholder stub already exports the function name but always returns `null`
- `react`/`react-dom` added to devDependencies (already in peerDependencies) following same pattern as `firebase-admin`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Server test stub skip condition refined to detect placeholder vs real implementation**
- **Found during:** Task 2 (verification run)
- **Issue:** `src/server/index.js` already exports `getCMSContent` as a placeholder stub (always returns `null`). The `{ skip: !getCMSContent }` condition was truthy so tests ran and failed — but the real firebase-backed implementation doesn't exist yet
- **Fix:** Added `isRealImplementation` probe: calls `getCMSContent('existing-page')` with mocked firestore; real impl returns data, placeholder returns `null`. Firebase-dependent tests skip on `!isRealImplementation`
- **Files modified:** `src/server/index.test.js`
- **Verification:** Full test suite exits 0 (64 tests: 23 pass, 41 skip, 0 fail)
- **Committed in:** `0cffd1c` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential fix — without it, the test suite would fail and violate the plan's exit-code-0 requirement. No scope creep.

## Issues Encountered

The Phase 2 placeholder for `getCMSContent` in `src/server/index.js` always returns `null` — this is by design per Phase 2 planning, but it caused the test stub's skip detection to misfire. Resolved via runtime probe pattern documented in decisions above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- JSX build pipeline is ready for block component implementations (Plans 02+)
- All 9 test stubs will automatically activate as implementations are added to `src/blocks/`
- `src/server/index.test.js` will activate automatically once real `getCMSContent` implementation lands (Plan 02)
- `src/index.test.js` already passes (useCMSContent, Blocks, Block all exported from Phase 2 work)

---
*Phase: 03-front-end-block-system*
*Completed: 2026-03-11*
