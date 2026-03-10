---
phase: 01-package-scaffolding
plan: 02
subsystem: testing
tags: [node, scripts, validation, build-verification, dist]

# Dependency graph
requires:
  - phase: 01-package-scaffolding
    provides: dist file outputs from tsup build (index.mjs, index.js, admin.mjs, admin.js, server.mjs, server.js, styles.css)
provides:
  - scripts/verify-exports.js — automated validation of all Phase 1 dist output requirements
affects:
  - 01-package-scaffolding plan 03 (Wave 2 build execution — this script is the acceptance test)
  - All future phases that modify dist outputs

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Node.js built-in fs/path for dist validation — no extra npm install needed
    - check() wrapper pattern with PASS/FAIL console output and aggregated exit code

key-files:
  created:
    - scripts/verify-exports.js
  modified: []

key-decisions:
  - "Script uses only Node.js built-ins (fs, path) — runnable immediately after npm run build without npm install"
  - "check() wrapper accumulates failures before exiting — shows all failures in one run rather than stopping at first"
  - "fileStartsWith() trims BOM and leading whitespace before prefix check — handles tsup banner edge cases"

patterns-established:
  - "Verification script pattern: check() wrapper with passed/failed counters, PASS/FAIL per check, summary, exit code"
  - "Dist validation covers: file existence, content assertions (startsWith, contains, notContains), require() export shape"

requirements-completed: [PKG-01, PKG-02, PKG-03, PKG-04]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 1 Plan 02: Validation Script Summary

**Node.js-only dist verification script covering all 6 JS outputs, CSS, "use client" banner isolation, firebase exclusion, and named export shape — the Phase 1 acceptance test**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T18:23:24Z
- **Completed:** 2026-03-10T18:28:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `scripts/verify-exports.js` covering all 4 requirements (PKG-01 through PKG-04)
- Script requires only Node.js built-ins — no npm install step needed
- All 14 checks implement the per-task verification map from `01-VALIDATION.md`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/verify-exports.js** - `6b111b6` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `scripts/verify-exports.js` — Automated Phase 1 build output validation: 6 dist JS file existence checks, dist/styles.css existence, "use client" banner on index outputs, absence of "use client" on server outputs, absence of bundled firebase in index, required named exports on all 3 CJS outputs

## Decisions Made

- Script uses only `fs` and `path` from Node.js built-ins — avoids requiring any npm install step before verification can run
- `check()` wrapper accumulates all failures before exiting — all FAIL lines visible in a single run rather than aborting at first failure
- `fileStartsWith()` strips BOM (`\uFEFF`) and trims leading whitespace before the prefix check, handling potential tsup banner edge cases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `scripts/verify-exports.js` is ready to run once `dist/` is produced by `npm run build`
- Plan 03 (Wave 2) will execute the actual build and run this script as the acceptance test
- Full Phase 1 sign-off depends on `npm run build && node scripts/verify-exports.js` exiting 0

---
*Phase: 01-package-scaffolding*
*Completed: 2026-03-10*
