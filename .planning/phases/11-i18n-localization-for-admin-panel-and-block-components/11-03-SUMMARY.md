---
phase: 11-i18n-localization-for-admin-panel-and-block-components
plan: "03"
subsystem: ui
tags: [react, i18n, localization, blocks, firebase]

# Dependency graph
requires:
  - phase: 11-02
    provides: resolveLocale utility at src/utils/resolveLocale.js
  - phase: 11-01
    provides: Wave 0 red tests for I18N-06, I18N-07, I18N-13
provides:
  - getCMSContent accepts optional locale option (I18N-06)
  - useCMSContent accepts optional locale option
  - Blocks component forwards locale to every block component (I18N-07)
  - All 6 primary block components resolve locale-object fields via resolveLocale (I18N-13)
affects: [11-04, any consumer using getCMSContent or Blocks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Locale option accepted by read functions but resolution deferred to block render layer — keeps raw data shape stable"
    - "void locale suppresses lint on accepted-but-deferred params without removing them from signature"
    - "resolveLocale passthrough ensures plain-string fields work identically in bilingual and monolingual codebases"

key-files:
  created: []
  modified:
    - src/server/index.js
    - src/index.js
    - src/blocks/index.js
    - src/blocks/Title.js
    - src/blocks/Paragraph.js
    - src/blocks/RichText.js
    - src/blocks/Image.js
    - src/blocks/Video.js
    - src/blocks/Gallery.js

key-decisions:
  - "Locale resolution happens at the block render layer, not in getCMSContent or useCMSContent — raw data stays stable across mono/bilingual consumers"
  - "void locale used to accept locale param in read functions without triggering unused-variable lint"
  - "Gallery and Image caption truthiness check uses the resolved string (not the raw locale object) so figure/figcaption branch triggers correctly"
  - "Video: only data.title is localizable; data.url and data.src are non-localizable URLs — no resolveLocale applied to those fields"

patterns-established:
  - "Block components: import resolveLocale, add locale = 'en' to destructuring, wrap text fields — 3-line surgical change per block"
  - "Blocks renderer: one new destructured prop + one new forwarded prop — locale travels to all registered blocks including future ones"

requirements-completed: [I18N-06, I18N-07, I18N-13]

# Metrics
duration: 18min
completed: 2026-04-14
---

# Phase 11 Plan 03: i18n Read Path and Block Renderer Summary

**locale option wired into getCMSContent, useCMSContent, and all 6 primary block components — Blocks forwards locale to every component, resolveLocale resolves locale objects at render time**

## Performance

- Duration: 18 min
- Started: 2026-04-14T22:35:00Z
- Completed: 2026-04-14T22:53:00Z
- Tasks: 2
- Files modified: 9

## Accomplishments
- getCMSContent and useCMSContent accept `{ locale = 'en' } = {}` — backward-compatible additive signature locked in for I18N-06
- Blocks component forwards locale to every registered block component including List and PullQuote (which safely ignore it)
- Title, Paragraph, RichText, Image, Video, Gallery all import resolveLocale and resolve their localizable fields at render time
- I18N-06, I18N-07, I18N-13 all green; no regressions on 307 pre-existing passing tests (now 311 pass)

## Task Commits

1. Task 1: locale option on getCMSContent + useCMSContent - `ac89b68` (feat)
2. Task 2: locale wired through Blocks + 6 block components - `42212f1` (feat)

## Files Created/Modified
- `src/server/index.js` — getCMSContent signature updated to `(slug, { locale = 'en' } = {})`
- `src/index.js` — useCMSContent signature updated to `(slug, { locale = 'en' } = {})`
- `src/blocks/index.js` — Blocks destructures `locale = 'en'`, forwards to every createElement(Component, { data, locale })
- `src/blocks/Title.js` — resolveLocale import added; `data?.text` wrapped with `resolveLocale(data?.text, locale)`
- `src/blocks/Paragraph.js` — resolveLocale import added; `data?.text` wrapped
- `src/blocks/RichText.js` — resolveLocale import added; `data?.html` resolved before sanitization pipeline
- `src/blocks/Image.js` — resolveLocale on alt and caption; caption truthiness check uses resolved string
- `src/blocks/Video.js` — resolveLocale on data.title only; url/src remain plain
- `src/blocks/Gallery.js` — per-item resolveLocale on alt and caption; src/id remain plain

## Decisions Made
- Locale resolution deferred to block render layer: getCMSContent and useCMSContent return raw published data. This keeps the returned shape stable regardless of bilingual/monolingual mode and lets `<Blocks locale="fr">` act as the single locale-injection point.
- `void locale` used in both read functions to accept the param without unused-variable lint.
- Gallery and Image caption branch uses the resolved string for the truthiness check — prevents `{ en: '', fr: 'Légende' }` object from incorrectly triggering the figure branch when resolved caption is empty.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 complete. All I18N read-path and block-render requirements are wired.
- Plan 04 can now build the LocaleSwitcher admin UI component and TitleEditor locale-object write path (I18N-09..I18N-12 tests are still red and await Plan 04).

---
*Phase: 11-i18n-localization-for-admin-panel-and-block-components*
*Completed: 2026-04-14*
