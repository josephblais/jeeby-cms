---
phase: 03-front-end-block-system
plan: "04"
subsystem: ui
tags: [react, wcag, accessibility, alt-text, iframe, video-js, gallery, figure, figcaption, node-test]

# Dependency graph
requires:
  - phase: 03-front-end-block-system
    plan: "01"
    provides: JSX transform, test stub files for Image/Video/Gallery, react/react-dom devDeps

provides:
  - Image component with WCAG 1.1.1 alt="" fallback and figure/figcaption when caption present
  - Gallery component with ul/li list semantics, aria-label="Gallery" (WCAG 1.3.1), per-item alt
  - Video component with toEmbedUrl() parsing YouTube/Vimeo/Loom, WCAG 4.1.2 iframe title, Video.js + native fallback
  - toEmbedUrl() exported as utility for consumer use and direct test assertions

affects: [03-front-end-block-system plans 05+, 08-css-and-theming, jeeby-cms-gallery CSS class]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Block components written with React.createElement (not JSX) for Node.js test runner compatibility — TSUP still compiles with JSX enabled for dist output"
    - "alt='' (empty string) always present on img elements — never omit alt entirely"
    - "aria-label on ul with no preceding visible heading (WCAG 1.3.1 Gallery pattern)"
    - "Video.js optional peer dep: dynamic require() with videojsAvailable flag; falls back to native <video controls>"
    - "iframe title: data?.title || 'Embedded video' fallback (WCAG 4.1.2)"

key-files:
  created:
    - src/blocks/Image.js
    - src/blocks/Video.js
    - src/blocks/Gallery.js
  modified: []

key-decisions:
  - "React.createElement instead of JSX in block files — Node.js test runner cannot parse JSX syntax in .js files; try/catch import silently fails and tests skip. createElement avoids the transform requirement while TSUP still processes JSX in the final build"
  - "alt='' empty string (not undefined/omitted) for decorative images — WCAG 1.1.1 requires alt on every img; omitting alt causes screen readers to announce the filename"
  - "aria-label='Gallery' on ul — no visible heading precedes the gallery in Phase 3 static rendering; aria-label provides accessible context per WCAG 1.3.1"
  - "toEmbedUrl exported (not private) — enables consumers to derive embed URLs and simplifies test assertions for URL parsing logic"
  - "Video.js detection via try/catch require() at render time — video.js is an optional peer dep; fallback to native <video controls> is WCAG 2.1.1 compliant"

patterns-established:
  - "Media block pattern: always alt on img (empty string fallback), figure/figcaption when caption present"
  - "Video embed pattern: toEmbedUrl() → iframe with title attribute; Firebase Storage → Video.js or native video"
  - "Gallery pattern: ul[aria-label='Gallery'] > li > [figure or img]"

requirements-completed: [FRONT-08, FRONT-09, FRONT-10]

# Metrics
duration: 8min
completed: 2026-03-11
---

# Phase 3 Plan 04: Media Blocks (Image, Video, Gallery) Summary

**Image/Gallery/Video block components with WCAG AA accessibility — alt="" fallback, iframe title enforcement, ul/li gallery semantics, and YouTube/Vimeo/Loom URL parsing**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-11T06:15:00Z
- **Completed:** 2026-03-11T06:23:00Z
- **Tasks:** 2 of 2
- **Files modified:** 3 (all created)

## Accomplishments

- Image component: `alt=""` always present (WCAG 1.1.1), `<figure>/<figcaption>` when `data.caption` is set, `width`/`height` pass-through for CLS prevention
- Gallery component: semantic `<ul aria-label="Gallery">` with `<li>` per item (WCAG 1.3.1), empty-string alt fallback, per-item `<figure>/<figcaption>` when caption present, `loading="lazy"` on images
- Video component: `toEmbedUrl()` parses YouTube (watch + short URLs), Vimeo, Loom; `<iframe title>` always non-empty (WCAG 4.1.2); Firebase Storage URLs render via Video.js or `<video controls>` fallback (WCAG 2.1.1)
- All 18 tests pass (5 Image + 6 Gallery + 7 Video), `npm run build` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Image Block + Gallery Block** - `530545f` (feat)
2. **Task 2: Video Block with URL Parsing + Iframe Title + Video.js Fallback** - `7669e8e` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/blocks/Image.js` - Image component: alt="" fallback, figure/figcaption conditional, width/height attrs
- `src/blocks/Gallery.js` - Gallery component: ul[aria-label]/li structure, lazy loading, figcaption support, jeeby-cms-gallery class
- `src/blocks/Video.js` - Video component + toEmbedUrl(): YouTube/Vimeo/Loom URL parsing, iframe with WCAG-compliant title, Video.js + native video fallback

## Decisions Made

- **React.createElement over JSX in block source files:** The Node.js test runner runs files directly without a JSX transform. Block test stubs wrap `import()` in `try/catch` — if Node can't parse JSX, the import fails silently and all tests skip. Using `createElement` in source files ensures Node can parse and load the implementation, activating the tests. TSUP's `loader: { '.js': 'jsx' }` still processes these files for the dist build.
- **`toEmbedUrl` exported:** Makes URL parsing independently testable and usable by consumers who want to pre-process URLs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rewrote JSX to React.createElement in all three block files**
- **Found during:** Task 1 (first test run after writing Image.js and Gallery.js with JSX)
- **Issue:** Plan's provided implementation code used JSX syntax. When Node.js test runner imported these files, it threw `SyntaxError: Unexpected token '<'` — caught by the test stub's try/catch, causing all tests to skip rather than run. This was not a plan error per se; the plan assumed test execution would work, but JSX in the implementation files silently broke it.
- **Fix:** Rewrote all three block implementations using `React.createElement` instead of JSX. Behavior is identical; TSUP builds correctly; Node.js can now parse and import the files.
- **Files modified:** `src/blocks/Image.js`, `src/blocks/Gallery.js`, `src/blocks/Video.js`
- **Verification:** 18/18 tests pass (0 skipped), exit code 0
- **Committed in:** `530545f` (Task 1 commit), `7669e8e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug — JSX in Node test runner context)
**Impact on plan:** Essential fix. Without it, all tests would skip and success criteria could not be met. Same behavior, different syntax. No scope creep.

## Issues Encountered

The plan provided JSX-syntax implementation code, but the Node.js test runner (`node --experimental-test-module-mocks --test`) cannot parse JSX. This was caught during Task 1 verification when all 11 Image+Gallery tests still showed as SKIP after implementing the components. Root cause identified immediately (Node `SyntaxError: Unexpected token '<'` in manual import test), resolved by switching to `React.createElement`.

This is a known constraint of this project's test setup: block source files must use `createElement` API (not JSX) to be importable by the test runner. Future block plans should follow this pattern.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Image, Video, and Gallery components are fully implemented and tested
- `jeeby-cms-gallery` CSS class is in place for Phase 8 (CSS & Theming) to add responsive grid styles
- `--jeeby-cms-gallery-columns` CSS custom property convention is documented for Phase 8
- Plans 03-05 (blocks index re-export) and later phases can now import from `src/blocks/Image.js`, `src/blocks/Video.js`, `src/blocks/Gallery.js`
- Video.js optional peer dep pattern is established; Phase 9 (Media Handling) may expand this

## Self-Check: PASSED

- FOUND: src/blocks/Image.js
- FOUND: src/blocks/Gallery.js
- FOUND: src/blocks/Video.js
- FOUND: .planning/phases/03-front-end-block-system/03-04-SUMMARY.md
- Task commits: 530545f (Task 1), 7669e8e (Task 2)
- All 18 tests pass, exit code 0
- npm run build exits 0

---
*Phase: 03-front-end-block-system*
*Completed: 2026-03-11*
