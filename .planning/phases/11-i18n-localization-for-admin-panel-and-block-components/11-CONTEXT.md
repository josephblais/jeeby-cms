# Phase 11: i18n Localization for Admin Panel and Block Components - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add bilingual (English + French) support to the CMS. Two concerns:
1. **Content localization** — pages and blocks store locale-specific data; the admin panel lets editors manage both languages
2. **Admin UI strings** — labels, buttons, and messages in the admin panel are translatable

Scope is English + French only for v1. No other locales. No locale auto-detection.

</domain>

<decisions>
## Implementation Decisions

### Languages
- **D-01:** Two locales only — `en` (English) and `fr` (French)
- **D-02:** Default locale is `en` — CMS behaves as English-only when localization is inactive

### Consumer Control
- **D-03:** Single prop `isLocalized` (boolean) is the sole on/off switch for the entire localization feature
- **D-04:** When `isLocalized` is falsy (default) — CMS operates in monolingual English mode; no language UI shown, no locale fields exposed
- **D-05:** When `isLocalized: true` — CMS is bilingual; editors can manage EN + FR content; consumers receive locale-aware content

### Default Behavior
- **D-06:** Out of the box (no `isLocalized` prop), the CMS is identical to a non-localized CMS — zero friction for developers who don't need localization

### Claude's Discretion
- Where `isLocalized` lives (likely `CMSProvider` and/or `AdminPanel` props — both need it; planner decides)
- Content model for bilingual blocks (e.g. `{ en: "...", fr: "..." }` shape vs separate Firestore docs) — research should determine cleanest approach given existing Firestore doc-per-page model
- Admin UX for bilingual editing — language switcher tab vs side-by-side vs field-level toggle; researcher to recommend
- How locale reaches `getCMSContent` / `useCMSContent` — URL param, prop, or context; researcher to recommend
- Admin panel UI string translation approach — hardcoded locale objects vs i18n library (keep bundle lean)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing data model
- `src/firebase/firestore.js` — Current Firestore CRUD helpers; locale-aware variants must extend or wrap these
- `src/server/index.js` — `getCMSContent` and `getCollectionPages`; locale param must be added without breaking existing callers

### Admin panel entry points
- `src/admin/PageEditor.js` — Block editor host; locale switching UI would live here
- `src/admin/PageManager.js` — Page list; collection/entry structure established in Phase 09.1

### Package exports
- `package.json` exports map — `isLocalized` prop surfaces through existing `CMSProvider` and `AdminPanel` exports; no new entry points expected

### Project constraints
- `.planning/PROJECT.md` — JavaScript only (no TypeScript for v1); peer deps only (no new bundled deps unless tiny)
- `.planning/REQUIREMENTS.md` — No user roles for v1; locale is not a role

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ModalShell.js` — Already used for modals; any locale-picker UI can reuse it
- `useCMSFirebase` hook — Provides `db`/`storage`; locale context would sit alongside it in `CMSProvider`

### Established Patterns
- CSS scoped under `.jeeby-cms-admin` — admin UI string translations follow same scope
- `isLocalized` pattern mirrors how `templates` prop enables/disables page templating — consistent API shape

### Integration Points
- `CMSProvider` — Natural home for `isLocalized` and current locale state; passes down via context
- `AdminPanel` — Needs `isLocalized` to show/hide language UI in editor
- `getCMSContent(slug)` / `useCMSContent(slug)` — Need optional `locale` param; must default to `'en'` for backward compat

</code_context>

<specifics>
## Specific Ideas

- `isLocalized` is the single source of truth in the consumer app — one prop to activate the whole feature
- Bilingual by default when active — no opt-in per-page or per-block; all content is localizable
- English remains the fallback — if French content is missing for a field, render the English value

</specifics>

<deferred>
## Deferred Ideas

- Additional locales beyond EN/FR — post-v1
- Auto locale detection from browser/request headers — post-v1
- Per-page localization toggle — post-v1
- Locale-specific slugs (e.g. `/fr/about`) — post-v1

</deferred>

---

*Phase: 11-i18n-localization-for-admin-panel-and-block-components*
*Context gathered: 2026-04-14*
