---
phase: 01-package-scaffolding
plan: 01
subsystem: infra
tags: [tsup, package-json, esm, cjs, bundling, use-client, peer-dependencies]

# Dependency graph
requires: []
provides:
  - package.json with jeeby-cms identity, three-subpath exports map (./ ./admin ./server ./dist/styles.css), peerDependencies, and build scripts
  - tsup.config.js with array config of 3 isolated blocks (index with use-client banner, admin, server)
  - src/index.js client entry stub exporting CMSProvider, Blocks, Block, useCMSContent
  - src/admin/index.js admin entry stub exporting AdminPanel, withCMSAuth
  - src/server/index.js server-safe entry stub exporting getCMSContent
  - styles/cms.css stub for build script cp command
affects:
  - 02-firebase-layer
  - 03-front-end-block-system
  - 04-admin-auth
  - all-subsequent-phases

# Tech tracking
tech-stack:
  added: [tsup ^8.5.1 (devDependency)]
  patterns:
    - Three-entry TSUP array config with per-block isolation (banner, clean, splitting per entry)
    - "use client" injected via TSUP banner on index entry only — not in source files
    - Dual-format output (ESM .mjs + CJS .js) for all three entries
    - Peer deps for runtime packages (react, react-dom, next, firebase, framer-motion) to prevent double-bundling

key-files:
  created:
    - package.json
    - tsup.config.js
    - src/index.js
    - src/admin/index.js
    - src/server/index.js
    - styles/cms.css
  modified: []

key-decisions:
  - "Three-entry TSUP array config so each entry gets isolated options — prevents clean: true race condition and banner contamination"
  - "use client banner on index entry only via tsup.config.js, not in source — avoids duplication and correctly marks all output chunks"
  - "Firebase, React, Next.js, Framer Motion in peerDependencies to prevent double-bundling in consumer apps"
  - "server entry uses splitting: false — server utilities are simple async functions, no code-splitting needed"
  - "styles/cms.css stub created immediately so build script cp command does not fail before Phase 8"

patterns-established:
  - "Source stubs return null — silent stubs that don't render or throw during scaffold validation"
  - "Server entry has no use client at any level — safe for Next.js Server Component imports"
  - "outExtension per format: esm gets .mjs, cjs gets .js — standard dual-format library convention"

requirements-completed: [PKG-01, PKG-02, PKG-03, PKG-04]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 1 Plan 01: Package Scaffolding Summary

**Six-file package foundation: package.json with three-subpath exports and peer deps, TSUP array config with isolated use-client banner on index entry, and null-returning source stubs for all three entry points**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T20:18:05Z
- **Completed:** 2026-03-10T20:20:57Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- package.json established with jeeby-cms identity, exports map for `.`, `./admin`, `./server`, `./dist/styles.css`, correct peerDependencies (React/Firebase/Next/Framer Motion), and tsup devDependency
- tsup.config.js with array of 3 isolated config blocks: index (banner `"use client"`, clean: true), admin (no banner), server (no banner, splitting: false, external: firebase only)
- Four source stubs: three entry JS files and styles/cms.css — all necessary for `npm run build` to succeed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json and tsup.config.js** - `41eaa62` (chore)
2. **Task 2: Create source stubs and CSS stub** - `13e9dfd` (feat)

**Plan metadata:** (docs commit pending)

## Files Created/Modified
- `package.json` - Package identity, exports map, peerDependencies, build scripts
- `tsup.config.js` - Three-entry TSUP array config with isolated banner and clean settings
- `src/index.js` - Client entry stub: CMSProvider, Blocks, Block, useCMSContent
- `src/admin/index.js` - Admin entry stub: AdminPanel, withCMSAuth
- `src/server/index.js` - Server entry stub: getCMSContent (no use client)
- `styles/cms.css` - Empty CSS stub for build script cp command

## Decisions Made
- TSUP array config (not object config) chosen so each entry gets fully isolated options — critical for preventing `clean: true` race condition and `"use client"` banner contamination between entries
- `"use client"` handled via TSUP banner on the index config block only, not in source files — avoids duplication and marks all output chunks correctly
- server entry uses `splitting: false` since it will only contain simple async server utilities
- All four peer dependency families (react, react-dom, next, firebase, framer-motion) confirmed in peerDependencies, not dependencies

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan verification script false-positive on "use client" string in comments**
- **Found during:** Task 2 (source stubs verification)
- **Issue:** The plan's `<verify>` script checks `idx.includes('use client')` which matches the string in comment text ("No 'use client' directive here"), not just the actual JS directive. This would cause a false positive failure on a correctly-written file.
- **Fix:** Used a regex `^['"]use client['"];/m` to detect only the actual JS directive (with quotes, at line start), which correctly passes on the stub file. The source files themselves were written exactly as specified.
- **Files modified:** None (verification logic only — source files are correct as written)
- **Verification:** Verified with corrected regex; all source files confirmed free of actual use client directive
- **Committed in:** 13e9dfd (Task 2 commit)

---

**Total deviations:** 1 (verification script false-positive, not a code deviation — source files are exactly as specified)
**Impact on plan:** No scope creep. Source files match plan spec exactly. Only the verification method differed.

## Issues Encountered
- Node.js shell escape of `!` in `-e` flag caused syntax errors when running plan's verification script verbatim — worked around by using a heredoc-style node script instead.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Complete pre-build file set established: package.json, tsup.config.js, all three source entries, styles/cms.css
- `npm install` will install tsup; `npm run build` will produce dist/ with all three entry points
- Entry file paths (src/index.js, src/admin/index.js, src/server/index.js) are locked in — must remain consistent in all subsequent phases
- Phase 2 (Firebase Layer) can begin immediately

---
*Phase: 01-package-scaffolding*
*Completed: 2026-03-10*
