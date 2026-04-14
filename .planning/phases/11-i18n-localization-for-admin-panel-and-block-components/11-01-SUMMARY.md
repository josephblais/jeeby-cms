---
phase: 11-i18n-localization-for-admin-panel-and-block-components
plan: 01
subsystem: testing
tags: [i18n, localization, tdd, node-test, wave-0]

# Dependency graph
requires:
  - phase: 09.1-page-collections-and-index-pattern
    provides: getCMSContent, getCollectionPages — server API this plan adds locale param to
  - phase: 09-media-handling
    provides: existing test infrastructure (node:test, source-scan pattern, skip guards)
provides:
  - Failing test stubs for all 13 I18N requirements (Wave 0 red phase)
  - src/utils/resolveLocale.test.js — 4 unit tests (I18N-01..04)
  - src/admin/i18n.test.js — 2 source-scan tests (I18N-08)
  - src/admin/LocaleSwitcher.test.js — 4 source-scan tests (I18N-09, I18N-10)
  - Extensions to 5 existing test files covering I18N-05..07, I18N-11..13
affects: [11-02, 11-03, 11-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Source-scan tests read target source file with readFileSync and assert patterns — used when DOM rendering is unavailable or overkill"
    - "Wave 0 TDD: test files written before implementation modules exist, failing on import resolution"
    - "File-level failure (ERR_MODULE_NOT_FOUND) counts as red signal for tests whose module does not yet exist"

key-files:
  created:
    - src/utils/resolveLocale.test.js
    - src/admin/i18n.test.js
    - src/admin/LocaleSwitcher.test.js
  modified:
    - src/index.test.js
    - src/server/index.test.js
    - src/blocks/index.test.js
    - src/blocks/Title.test.js
    - src/admin/editors/TitleEditor.test.js

key-decisions:
  - "I18N-13 Title test 'renders plain string unchanged' passes immediately — acceptable because the current Title renders strings unchanged already; other two I18N-13 tests remain red until resolveLocale is wired in Plan 02"
  - "src/utils directory created as new home for pure utility functions (resolveLocale first occupant)"
  - "LocaleSwitcher.test.js uses readFileSync source-scan pattern instead of DOM render — avoids React peer dep complexity in test environment"

patterns-established:
  - "Wave 0 pattern: test files for not-yet-created modules fail at file-level (ERR_MODULE_NOT_FOUND) — this is the expected red signal"
  - "I18N test naming: 'I18N-NN: description' for traceability in test output"

requirements-completed:
  - I18N-01
  - I18N-02
  - I18N-03
  - I18N-04
  - I18N-05
  - I18N-06
  - I18N-07
  - I18N-08
  - I18N-09
  - I18N-10
  - I18N-11
  - I18N-12
  - I18N-13

# Metrics
duration: 12min
completed: 2026-04-14
---

# Phase 11 Plan 01: i18n Wave 0 Summary

13 failing test stubs covering all I18N requirements — resolveLocale unit tests, ADMIN_STRINGS key-parity scan, LocaleSwitcher tablist ARIA scan, and CMSProvider/getCMSContent/Blocks/Title/TitleEditor locale behavior assertions

## Performance

- Duration: 12 min
- Started: 2026-04-14T05:10:00Z
- Completed: 2026-04-14T05:22:00Z
- Tasks: 2
- Files modified: 8

## Accomplishments

- Created 3 new test files targeting modules that do not yet exist (resolveLocale.js, i18n.js, LocaleSwitcher.js) — all fail red at module resolution
- Extended 5 existing test files with 8 new failing test cases covering I18N-05..07 and I18N-11..13
- All 13 I18N requirements now have at least one failing test in the suite (28 total failures, up from 21)
- Established src/utils/ directory as the home for pure utility modules

## Task Commits

Each task was committed atomically:

1. Task 1: Create new Wave 0 test files (resolveLocale, i18n, LocaleSwitcher) - `749e54e` (test)
2. Task 2: Extend existing test files with I18N-05/06/07/11/12/13 failing stubs - `c40ea35` (test)

## Files Created/Modified

- `src/utils/resolveLocale.test.js` - 4 unit tests: I18N-01 plain string passthrough, I18N-02 locale object lookup, I18N-03 EN fallback, I18N-04 null/undefined returns empty string
- `src/admin/i18n.test.js` - 2 source-scan tests: I18N-08 ADMIN_STRINGS en+fr existence and key parity (>=10 keys)
- `src/admin/LocaleSwitcher.test.js` - 4 source-scan tests: I18N-09 tablist/tab roles and keyboard nav, I18N-10 aria-selected binding
- `src/index.test.js` - I18N-05: CMSProvider isLocalized prop and locale useState stub
- `src/server/index.test.js` - I18N-06: getCMSContent (slug, { locale = "en" } = {}) signature stub
- `src/blocks/index.test.js` - I18N-07: Blocks locale prop forwarding stub (added readFileSync import)
- `src/blocks/Title.test.js` - I18N-13: 3 tests for Title resolveLocale integration (plain string, locale object, EN fallback)
- `src/admin/editors/TitleEditor.test.js` - I18N-11/12: isLocalized context read, [locale] computed key, spread preservation stubs

## Decisions Made

- I18N-13 "renders plain string text unchanged" passes immediately because the current Title component already renders strings unchanged. This is acceptable — the other two I18N-13 tests (locale object resolution and EN fallback) remain red until Plan 02 wires resolveLocale. I18N-13 has coverage.
- `src/utils/` directory created as the canonical home for pure utility functions, with resolveLocale as the first occupant.
- LocaleSwitcher.test.js uses source-scan (readFileSync) rather than DOM rendering — consistent with other admin component tests and avoids React peer dep complexity in Node.js test environment.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 0 complete: all 13 I18N requirements have red tests
- Plan 02 can now implement resolveLocale.js and ADMIN_STRINGS (will turn I18N-01..04 and I18N-08 green)
- Plan 03 can implement CMSProvider locale state, getCMSContent locale param, and Blocks locale forwarding (I18N-05, 06, 07)
- Plan 04 can implement LocaleSwitcher component and TitleEditor locale write logic (I18N-09, 10, 11, 12, 13)

---
*Phase: 11-i18n-localization-for-admin-panel-and-block-components*
*Completed: 2026-04-14*
