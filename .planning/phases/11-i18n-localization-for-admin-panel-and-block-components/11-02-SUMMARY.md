---
phase: 11-i18n-localization-for-admin-panel-and-block-components
plan: 02
subsystem: ui
tags: [i18n, react, context, locale, translation]

requires:
  - phase: 11-01
    provides: Wave 0 red tests for I18N-01..13 established, src/utils/ directory created

provides:
  - resolveLocale(value, locale) pure utility in src/utils/resolveLocale.js
  - CMSProvider extended with isLocalized prop and locale/setLocale context state
  - ADMIN_STRINGS EN/FR translation map with 21-key parity in src/admin/i18n.js

affects:
  - 11-03 (locale switcher component consumes useCMSFirebase locale/setLocale)
  - 11-04 (admin components consume ADMIN_STRINGS for translated UI text)
  - 11-05 (block components consume resolveLocale for field resolution)

tech-stack:
  added: []
  patterns:
    - "resolveLocale: string passthrough | locale object key lookup | EN fallback | empty-string guard"
    - "isLocalized = false default in CMSProvider for zero-change backward compat"
    - "ADMIN_STRINGS dual-locale map with enforced key parity (test-driven)"

key-files:
  created:
    - src/utils/resolveLocale.js
    - src/admin/i18n.js
  modified:
    - src/index.js

key-decisions:
  - "resolveLocale uses || not ?? for locale fallback — empty string in FR must fall through to EN per I18N-03 spec"
  - "isLocalized defaults to false in CMSProvider — consumers without the prop see zero context change (D-06)"
  - "setLocale excluded from useMemo deps array — useState setter identity is stable, exclusion is intentional"
  - "ADMIN_STRINGS is a pure data module with no imports — no side effects, tree-shakeable"

patterns-established:
  - "resolveLocale pattern: all block components call resolveLocale(data.fieldName, locale) for localized fields"
  - "locale state lives in CMSProvider context — single source of truth for active locale across admin"
  - "EN/FR key parity enforced by automated test — add keys to both locales atomically"

requirements-completed: [I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-08]

duration: 20min
completed: 2026-04-14
---

# Phase 11 Plan 02: i18n Foundations Summary

**resolveLocale utility with EN fallback, CMSProvider locale context, and 21-key EN/FR ADMIN_STRINGS map — all Wave 0 tests for I18N-01..05 and I18N-08 now green**

## Performance

- Duration: ~20 min
- Started: 2026-04-14T22:00:00Z
- Completed: 2026-04-14T22:19:24Z
- Tasks: 3
- Files modified: 3

## Accomplishments

- Created src/utils/resolveLocale.js: pure ESM function resolving plain strings, locale objects, null/undefined, and empty-string fallback (I18N-01 through I18N-04 green)
- Extended CMSProvider in src/index.js with isLocalized = false prop and useState('en') locale state, threaded into context value alongside existing keys (I18N-05 green, zero regressions)
- Created src/admin/i18n.js with ADMIN_STRINGS containing 21-key EN/FR pair — key parity enforced by test, all values non-empty (I18N-08 green)

## Task Commits

1. Task 1: resolveLocale utility - `35b475a` (feat)
2. Task 2: CMSProvider locale context - `8bcbff0` (feat)
3. Task 3: ADMIN_STRINGS EN/FR map - `f9f77f6` (feat)

## Files Created/Modified

- `src/utils/resolveLocale.js` - Pure resolveLocale(value, locale='en') function; string passthrough, locale object resolution, EN fallback, empty-string guard
- `src/index.js` - CMSProvider extended: isLocalized prop, locale/setLocale state, all three keys added to context value object
- `src/admin/i18n.js` - ADMIN_STRINGS with 21 keys each in en and fr; pure data export, no side effects

## Decisions Made

- Used `||` instead of `??` for the locale fallback in resolveLocale: the I18N-03 spec requires `{ en: 'Hello', fr: '' }` with requested locale 'fr' to return 'Hello'. The nullish coalescing operator `??` passes empty string through; `||` correctly treats it as falsy and falls through to EN.
- setLocale is excluded from the useMemo deps array — useState setters have stable identity and do not need to be listed as dependencies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] resolveLocale fallback operator corrected from ?? to ||**
- Found during: Task 1 verification (I18N-03 test run)
- Issue: Plan's canonical implementation used `value[locale] ?? value['en'] ?? ''`. The `??` operator only guards against null/undefined, so `{ en: 'Hello', fr: '' }` with locale='fr' returned '' instead of 'Hello'. I18N-03 asserts the empty-string case must fall back to EN.
- Fix: Changed `??` to `||` in both fallback positions: `value[locale] || value['en'] || ''`
- Files modified: src/utils/resolveLocale.js
- Verification: I18N-03 turned green; I18N-01, 02, 04 all remained green
- Committed in: 35b475a (Task 1 commit)

---

Total deviations: 1 auto-fixed (Rule 1 — bug in canonical implementation)
Impact on plan: Necessary correctness fix. The plan interface spec used `??` but the behavior spec required empty-string fallback — behavior spec takes precedence.

## Issues Encountered

None beyond the ?? vs || fix above.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None. All three files are complete implementations:
- resolveLocale handles all specified cases fully
- CMSProvider locale state is wired and exposed (consumers of useCMSFirebase can read locale and call setLocale)
- ADMIN_STRINGS contains non-empty values for all 21 keys in both locales

Downstream stubs (I18N-06, 07, 11, 12, 13) remain red — those are addressed in Plans 03, 04, 05.

## Next Phase Readiness

- Plan 03 (LocaleSwitcher component) can import useCMSFirebase and read locale/setLocale from context
- Plan 04 (admin component wiring) can import ADMIN_STRINGS and use locale from context
- Plan 05 (block components) can import resolveLocale from src/utils/resolveLocale.js
- Build pipeline verified clean after all changes

---
*Phase: 11-i18n-localization-for-admin-panel-and-block-components*
*Completed: 2026-04-14*
