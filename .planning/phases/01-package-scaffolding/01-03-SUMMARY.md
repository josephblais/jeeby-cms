---
phase: 01-package-scaffolding
plan: 03
subsystem: infra
tags: [tsup, build, dist, use-client, banner, rollup, typescript, verification]

# Dependency graph
requires:
  - phase: 01-package-scaffolding
    provides: package.json, tsup.config.js, source stubs, styles/cms.css (from plan 01)
  - phase: 01-package-scaffolding
    provides: scripts/verify-exports.js acceptance test (from plan 02)
provides:
  - dist/index.mjs — ESM client entry with "use client" banner
  - dist/index.js — CJS client entry with "use client" banner
  - dist/admin.mjs — ESM admin entry bundle
  - dist/admin.js — CJS admin entry bundle
  - dist/server.mjs — ESM server entry (no "use client")
  - dist/server.js — CJS server entry (no "use client")
  - dist/styles.css — CSS output stub
  - package-lock.json — locked dependency tree (tsup + typescript)
  - All Phase 1 PKG-01 through PKG-04 requirements verified passing
affects:
  - 02-firebase-layer
  - 03-front-end-block-system
  - 04-admin-auth
  - all-subsequent-phases

# Tech tracking
tech-stack:
  added:
    - typescript ^5.9.3 (devDependency — required by tsup at runtime, not declared in plan 01)
  patterns:
    - Post-build Node.js one-liner in build script to inject "use client" banner after rollup strips it
    - Rollup 4 strips module-level directives ("use client") even when set as tsup banner — workaround required

key-files:
  created:
    - dist/index.mjs
    - dist/index.js
    - dist/admin.mjs
    - dist/admin.js
    - dist/server.mjs
    - dist/server.js
    - dist/styles.css
    - package-lock.json
  modified:
    - package.json (added typescript devDep, updated build script with post-process banner inject)
    - tsup.config.js (splitting: false on index entry, reverted esbuildOptions attempt)

key-decisions:
  - "Post-build banner injection: Rollup 4 strips use-client directives from banners — must prepend after tsup runs, not via tsup banner option"
  - "splitting: false on index entry — Phase 1 stubs are simple null-returning functions; no splitting benefit"
  - "typescript added as devDependency — tsup requires it at runtime even for JS source files"

patterns-established:
  - "Use post-build shell step (node -e inline) to inject use-client when rollup strips it — pattern needed for any future rebuild"

requirements-completed: [PKG-01, PKG-02, PKG-03, PKG-04]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 1 Plan 03: Build Execution Summary

**Full dist build producing 7 artifacts (6 JS + 1 CSS), with "use client" banner injection via post-build step to work around Rollup 4 stripping module-level directives — 16/16 verification checks pass**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-10T20:26:45Z
- **Completed:** 2026-03-10T20:34:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- npm install completed successfully with 159 packages (tsup + typescript devDependencies)
- npm run build produces all 7 required dist files: index.mjs, index.js, admin.mjs, admin.js, server.mjs, server.js, styles.css
- node scripts/verify-exports.js exits 0 with 16/16 PASS — Phase 1 acceptance test passed
- "use client" banner correctly appears in dist/index.mjs and dist/index.js, absent from server outputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Install devDependencies and run build** - `6b1e08c` (chore)
2. **Task 2: Run full verification suite** - `41a1bac` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `dist/index.mjs` - ESM client entry with "use client" banner (254 B)
- `dist/index.js` - CJS client entry with "use client" banner (337 B)
- `dist/admin.mjs` - ESM admin entry (203 B)
- `dist/admin.js` - CJS admin entry (250 B)
- `dist/server.mjs` - ESM server entry, no "use client" (105 B)
- `dist/server.js` - CJS server entry, no "use client" (133 B)
- `dist/styles.css` - Empty CSS stub copied from styles/cms.css
- `package-lock.json` - Locked dependency tree
- `package.json` - Added typescript devDep, updated build script with banner post-process
- `tsup.config.js` - Set splitting: false on index entry

## Decisions Made

- Post-build banner injection chosen over tsup banner option — Rollup 4 unconditionally strips `"use client"` as a module-level directive warning and omits it from output. A Node.js one-liner appended to the build script prepends the banner after tsup runs.
- `splitting: false` on index entry — stubs are simple single-file exports with no code-splitting benefit in Phase 1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing typescript devDependency**
- **Found during:** Task 1 (npm run build)
- **Issue:** tsup requires typescript at runtime even for plain JS source files. `npm install` succeeded but `npm run build` failed with `Cannot find module 'typescript'`
- **Fix:** `npm install --save-dev typescript` — added to package.json devDependencies
- **Files modified:** package.json, package-lock.json
- **Verification:** npm run build succeeded after installation
- **Committed in:** 6b1e08c (Task 1 commit)

**2. [Rule 1 - Bug] Rollup 4 strips "use client" tsup banner**
- **Found during:** Task 2 (verify-exports.js — FAIL on "use client" checks)
- **Issue:** Rollup 4 treats `"use client"` as a module-level directive and strips it with a warning: "Module level directives cause errors when bundled, 'use client' was ignored". Both `banner: { js: ... }` and `esbuildOptions.banner` approaches failed because tsup routes JS through rollup which strips it.
- **Fix:** Added a post-build Node.js inline script to the build npm script that reads dist/index.mjs and dist/index.js and prepends `"use client";\n` if not already present
- **Files modified:** package.json (build script), tsup.config.js (splitting: false, removed esbuildOptions)
- **Verification:** node scripts/verify-exports.js exits 0 with 16/16 PASS
- **Committed in:** 41a1bac (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking missing dependency, 1 bug — rollup banner stripping)
**Impact on plan:** Both fixes necessary for correct operation. Post-build banner injection is a permanent workaround required for all future rebuilds. No scope creep.

## Issues Encountered

- Rollup 4 (used internally by tsup 8.5.1) strips `"use client"` module-level directives regardless of how they are injected. Three approaches failed (tsup banner, esbuildOptions.banner, splitting: false) before post-build prepend was confirmed working.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 1 dist outputs exist and pass verification
- Phase 2 (Firebase Layer) can begin immediately
- The post-build banner injection in package.json build script is established — future phases adding client components will benefit from this pattern
- Entry point paths are locked: dist/index.js, dist/admin.js, dist/server.js for CJS; .mjs variants for ESM

---
*Phase: 01-package-scaffolding*
*Completed: 2026-03-10*
