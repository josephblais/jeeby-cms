# Phase 11: i18n Localization for Admin Panel and Block Components - Research

**Researched:** 2026-04-14
**Domain:** Bilingual content model + admin UX + admin UI string translation (EN/FR)
**Confidence:** HIGH (all recommendations grounded in direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Two locales only — `en` (English) and `fr` (French)
- D-02: Default locale is `en` — CMS behaves as English-only when localization is inactive
- D-03: Single prop `isLocalized` (boolean) is the sole on/off switch for the entire localization feature
- D-04: When `isLocalized` is falsy (default) — CMS operates in monolingual English mode; no language UI shown, no locale fields exposed
- D-05: When `isLocalized: true` — CMS is bilingual; editors can manage EN + FR content; consumers receive locale-aware content
- D-06: Out of the box (no `isLocalized` prop), the CMS is identical to a non-localized CMS — zero friction for developers who don't need localization

### Claude's Discretion
- Where `isLocalized` lives (likely `CMSProvider` and/or `AdminPanel` props — both need it; planner decides)
- Content model for bilingual blocks (e.g. `{ en: "...", fr: "..." }` shape vs separate Firestore docs) — research should determine cleanest approach given existing Firestore doc-per-page model
- Admin UX for bilingual editing — language switcher tab vs side-by-side vs field-level toggle; researcher to recommend
- How locale reaches `getCMSContent` / `useCMSContent` — URL param, prop, or context; researcher to recommend
- Admin panel UI string translation approach — hardcoded locale objects vs i18n library (keep bundle lean)

### Deferred Ideas (OUT OF SCOPE)
- Additional locales beyond EN/FR — post-v1
- Auto locale detection from browser/request headers — post-v1
- Per-page localization toggle — post-v1
- Locale-specific slugs (e.g. `/fr/about`) — post-v1
</user_constraints>

---

## Summary

Phase 11 adds bilingual (EN/FR) support across two concerns: (1) content data stored per-locale in Firestore and surfaced to consumers via locale-aware read functions, and (2) admin panel UI strings translated into French. The `isLocalized` prop on `CMSProvider` is the sole feature flag — when absent or false the entire localization layer is invisible.

The cleanest content model given the existing `draft.blocks` / `published.blocks` shape is per-field locale objects: each localizable text field becomes `{ en: "...", fr: "..." }`. This requires no new Firestore documents and no schema migration — monolingual pages simply have string values that pass through a resolver unchanged. The resolver function (`resolveLocale`) lives in one place and is used both by server read paths (`getCMSContent`) and by block render components.

For admin UX, a single active-locale state (`'en'` or `'fr'`) in `CMSContext` drives all editor forms. A language tab bar in `PageEditor` switches the active locale. Block editor forms already receive `data` as a prop — they will receive `locale` as a second prop and read/write only the active locale's value within the per-field locale object. This requires no structural change to `BlockCanvas`, `handleBlockChange`, or `saveDraft`.

Admin UI strings are best handled with a hardcoded locale map (no new dependency). The full set of translatable strings in the admin panel fits comfortably in a single 50-100 line `src/admin/i18n.js` module. i18next would add ~30-40 KB gzipped with zero benefit for a fixed two-locale, non-interpolation-heavy use case.

**Primary recommendation:** Per-field locale objects `{ en, fr }` for content; `CMSContext` locale state for admin; `resolveLocale(value, locale)` utility for consistent EN fallback everywhere.

---

## Project Constraints (from CLAUDE.md)

- JavaScript only — no TypeScript for v1
- No new bundled dependencies unless tiny (hardcoded locale map is effectively zero-cost)
- Admin styles scoped under `.jeeby-cms-admin`
- WCAG AA required for all UI changes — language tab switcher needs proper ARIA (`role="tablist"`, `aria-selected`, keyboard navigation)
- No bold or italic markdown in files (project formatting preference, does not affect code)

---

## Standard Stack

### Core — no new dependencies needed

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none new) | — | Content model is pure data transform | The per-field locale object is a plain JS pattern; zero install cost |

### Supporting

| Library / Module | Purpose | When to Use |
|---------|---------|-------------|
| `src/admin/i18n.js` (new, hand-rolled) | Admin UI string translations | Always — replaces hardcoded EN strings in admin components |
| `src/utils/resolveLocale.js` (new, hand-rolled) | Resolves `{ en, fr }` field to correct locale with EN fallback | Used by block components + server read paths |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded locale map | i18next (~30-40 KB gzipped) | i18next adds plural rules, interpolation, namespaces — none needed for two static locales. Hand-rolled map costs ~1 KB and zero parse overhead. |
| Per-field `{ en, fr }` object | Separate `draft.en.blocks` / `draft.fr.blocks` top-level keys | Separate top-level keys would duplicate every Firestore write path (`saveDraft`, `publishPage`) and break `listPages` shape. Per-field is surgical — only localizable fields change. |
| Per-field `{ en, fr }` object | Separate Firestore documents per locale | Separate docs double the Firestore reads everywhere and add collection management complexity. Not justified for two locales on the same doc-per-page model. |

**Installation:** No new packages required.

---

## Content Model: Per-Field Locale Objects

### Recommendation: Per-field `{ en, fr }` objects on localizable text fields

**Rationale grounded in code inspection:**

Current block data shape (from `DEFAULT_BLOCK_DATA` in `PageEditor.js` and from block components):
```js
// title block
{ level: 'h2', text: '' }

// paragraph block
{ text: '' }

// richtext block
{ html: '' }

// image block
{ src: '', alt: '' }

// video block  
{ url: '' }

// gallery block
{ items: [] }
```

With per-field locale objects, only the text fields that editors actually localize become locale-aware:
```js
// title block (localized)
{ level: 'h2', text: { en: 'Welcome', fr: 'Bienvenue' } }

// paragraph block (localized)
{ text: { en: 'Hello', fr: 'Bonjour' } }

// richtext block (localized)
{ html: { en: '<p>Hello</p>', fr: '<p>Bonjour</p>' } }

// image block (partially localized — src is shared, alt is locale-specific)
{ src: 'https://...', alt: { en: 'A cat', fr: 'Un chat' } }

// video block — url is not locale-specific; caption would be if added
{ url: '' }

// gallery block — items[].alt is locale-specific; items[].src is shared
{ items: [{ src: '...', alt: { en: 'Dog', fr: 'Chien' } }] }
```

### Why not separate top-level keys (`draft.en.blocks` / `draft.fr.blocks`)

Inspecting `firestore.js`: `saveDraft` writes to `'draft.blocks'` with `updateDoc`. `publishPage` copies `page.draft?.blocks ?? []` to `'published.blocks'`. `getCMSContent` in `server/index.js` returns `pageData?.published ?? null`. Switching to separate top-level locale keys would require every one of these call sites to be rewritten with locale parameters and branching logic — a much larger surface area and a breaking change for monolingual consumers. Per-field locale objects touch only the leaf values, not the structural keys.

### Backward compatibility

When `isLocalized` is false, block components receive `data.text` which may be a plain string. The `resolveLocale` utility handles both shapes:

```js
// src/utils/resolveLocale.js
export function resolveLocale(value, locale = 'en') {
  if (value === null || value === undefined) return ''
  // Plain string (monolingual or legacy data) — return as-is
  if (typeof value !== 'object') return value
  // Locale object — return requested locale, fall back to 'en', then ''
  return value[locale] ?? value['en'] ?? ''
}
```

This function is the single point of EN-fallback logic. It is used:
1. In each block component's render: `resolveLocale(data.text, locale)`
2. In `getCMSContent` / `getCollectionContent` — or alternatively, consumers apply it themselves via a utility export

### Firestore write shape (admin path)

`saveDraft(db, slug, blocks)` writes the entire blocks array. The admin editor constructs blocks with locale objects already embedded in the data field. The Firestore write is locale-agnostic — it stores the full `{ en, fr }` object. This is consistent with the current `saveDraft` implementation and requires no signature change.

`publishPage(db, slug)` copies `draft.blocks` to `published.blocks` wholesale. This already publishes both locales in one operation — no locale parameter needed.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── utils/
│   └── resolveLocale.js          # resolveLocale(value, locale) utility
├── admin/
│   ├── i18n.js                   # ADMIN_STRINGS['en'] / ADMIN_STRINGS['fr'] map
│   └── LocaleSwitcher.js         # Tab bar: EN | FR (new admin component)
```

### Pattern 1: CMSContext carries isLocalized + locale state

`CMSProvider` in `src/index.js` currently provides `{ db, auth, storage, templates }` from `useCMSFirebase()`. Locale state is a natural addition here — it is consumed by both the admin (editing locale) and the front end (`useCMSContent`).

```js
// src/index.js — extended CMSProvider
export function CMSProvider({ firebaseConfig, templates = [], isLocalized = false, children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  const value = useMemo(
    () => ({ ...firebase, templates, isLocalized }),
    [firebase, templates, isLocalized]
  )
  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>
}
```

`AdminPanel` also accepts `isLocalized` for the admin-side locale switcher state. The simplest approach: `AdminPanel` reads `isLocalized` from `CMSContext` (set by `CMSProvider`) rather than accepting it as a separate prop. This avoids prop duplication and the consumer only sets it once on `CMSProvider`.

**Locale state** (the currently active locale for admin editing, `'en'` or `'fr'`) lives in `CMSContext` as a `useState` pair `[locale, setLocale]`. Admin components read `locale` from context; the `LocaleSwitcher` component calls `setLocale`. This avoids prop-drilling through `AdminPanel` -> `PageEditor` -> `BlockCanvas` -> each editor form.

```js
// src/index.js — locale state in CMSProvider
export function CMSProvider({ firebaseConfig, templates = [], isLocalized = false, children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  const [locale, setLocale] = useState('en')
  const value = useMemo(
    () => ({ ...firebase, templates, isLocalized, locale, setLocale }),
    [firebase, templates, isLocalized, locale]
  )
  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>
}
```

### Pattern 2: LocaleSwitcher tab bar in PageEditor

`PageEditor` renders `LocaleSwitcher` above `BlockCanvas` when `isLocalized` is true. `LocaleSwitcher` is a simple tab bar with two buttons (`EN`, `FR`) wired to `setLocale` from context. No other component in `PageEditor` changes — `BlockCanvas` and editor forms already receive `blocks` and call `onChange`; they will additionally read `locale` from context.

ARIA pattern: `role="tablist"` on the container, `role="tab"` on each button, `aria-selected` on the active tab, keyboard arrow navigation. This is consistent with the accessibility standards enforced by CLAUDE.md.

```js
// src/admin/LocaleSwitcher.js (simplified structure)
export function LocaleSwitcher() {
  const { locale, setLocale } = useCMSFirebase()
  return (
    <div role="tablist" aria-label="Content language" className="jeeby-cms-locale-switcher">
      <button role="tab" aria-selected={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
      <button role="tab" aria-selected={locale === 'fr'} onClick={() => setLocale('fr')}>FR</button>
    </div>
  )
}
```

### Pattern 3: Editor forms read locale from context, write locale-aware data

Each block editor form (TitleEditor, TextEditor, RichTextEditor, ImageEditor, etc.) currently receives `data` and `onChange`. With localization active, the form reads `locale` from `useCMSFirebase()` and accesses `data.text[locale]` rather than `data.text`. On change, it writes back to `data.text[locale]` while preserving the other locale's value.

```js
// TitleEditor — localized field access pattern
const { locale, isLocalized } = useCMSFirebase()

// Read
const textValue = isLocalized
  ? (data?.text?.[locale] ?? '')
  : (data?.text ?? '')

// Write
function handleChange(newVal) {
  if (isLocalized) {
    onChange({ ...data, text: { ...(data.text ?? {}), [locale]: newVal } })
  } else {
    onChange({ ...data, text: newVal })
  }
}
```

This pattern is identical across all localizable text fields. The `isLocalized` guard ensures monolingual behavior is completely unchanged.

### Pattern 4: resolveLocale utility for front-end block components

Block components (`Title`, `Paragraph`, `RichText`, `Image`, `Gallery`) call `resolveLocale` on each localizable field. The locale is passed as a prop from `Blocks`.

`Blocks` component receives `locale` prop (optional, defaults to `'en'`):
```js
// src/blocks/index.js — Blocks extended
export function Blocks({ data, components, className, blockClassName, locale = 'en' }) {
  // ...
  return createElement(
    'div',
    { className },
    ...data.blocks.map((block, i) => {
      const Component = registry[block.type]
      if (!Component) return null
      return createElement(
        Block,
        { key: block.id ?? i, id: block.id, className: blockClassName },
        createElement(Component, { data: block.data, locale })
      )
    })
  )
}
```

Each block component calls `resolveLocale`:
```js
// src/blocks/Title.js — localized
import { resolveLocale } from '../utils/resolveLocale.js'

export function Title({ data, locale = 'en', className }) {
  const tag = normalizeLevel(data?.level)
  const text = resolveLocale(data?.text, locale)
  return createElement(tag, { className }, text)
}
```

### Pattern 5: getCMSContent locale param

```js
// src/server/index.js — extended signature
export async function getCMSContent(slug, { locale = 'en' } = {}) {
  const db = getAdminFirestore()
  const snap = await db.doc('pages/' + slug).get()
  if (!snap.exists) return null
  const pageData = snap.data()
  const published = pageData?.published ?? null
  if (!published || locale === 'en') return published
  // For FR: resolve all block data fields through resolveLocale
  // Option A: return raw published and let consumer call resolveLocale via Blocks locale prop
  // Option B: resolve on server before returning
  return published  // See decision below
}
```

**Recommendation:** Return raw published data unchanged. The `locale` param on `getCMSContent` does NOT resolve fields server-side — it is reserved for future use (e.g., locale-specific slugs in post-v1). The consumer passes `locale` to `<Blocks locale={locale}>` which resolves fields at render time via `resolveLocale`. This keeps the server function simple and avoids duplicating the resolution logic.

The `locale` param is therefore added for API completeness and backward compat verification, but the real resolution happens in `Blocks`. `getCMSContent` signature becomes `getCMSContent(slug, { locale = 'en' } = {})` — existing callers `getCMSContent(slug)` continue to work unchanged.

### Pattern 6: useCMSContent locale param

```js
// src/index.js — useCMSContent extended
export function useCMSContent(slug, { locale = 'en' } = {}) {
  // ... existing snapshot logic unchanged
  // locale is accepted for API symmetry; resolution happens in <Blocks locale={locale}>
}
```

### Pattern 7: Admin UI string translation — hardcoded locale map

```js
// src/admin/i18n.js
export const ADMIN_STRINGS = {
  en: {
    publish: 'Publish',
    published: 'Published',
    draft: 'Draft',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    // ... ~30-50 strings total
  },
  fr: {
    publish: 'Publier',
    published: 'Publié',
    draft: 'Brouillon',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    // ... matching FR strings
  },
}

// Usage in any admin component:
// const { locale } = useCMSFirebase()
// const t = ADMIN_STRINGS[locale] ?? ADMIN_STRINGS.en
// <button>{t.publish}</button>
```

Admin components use `const t = ADMIN_STRINGS[locale] ?? ADMIN_STRINGS.en` at the top of each component. The `?? ADMIN_STRINGS.en` guard ensures EN fallback if a future locale is somehow passed. This pattern adds zero bundle weight beyond the string literals themselves.

### Anti-Patterns to Avoid

- **Prop-drilling locale:** Do not thread `locale` as a prop from `AdminPanel` down through `PageEditor` -> `BlockCanvas` -> each editor. Use `useCMSFirebase()` context read in each editor component directly.
- **Resolving on write:** Do not flatten `{ en, fr }` to a string before saving to Firestore. Always write the full locale object so both locales persist.
- **Separate Firestore documents per locale:** Doubles read costs, breaks `listPages`, adds collection management complexity.
- **i18next for admin strings:** Adds ~30-40 KB gzipped for no concrete benefit over a 50-line hardcoded map at fixed two-locale scope.
- **Resolving fields inside getCMSContent/useCMSContent:** Resolution belongs at render time (`Blocks`), not at fetch time — keeps the API surface simple and allows the consumer to switch locales without re-fetching.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EN fallback logic | Ad-hoc `data.text?.fr ?? data.text?.en ?? data.text` scattered in every component | `resolveLocale(value, locale)` utility in one file | Scattered fallback is easy to miss or get wrong; centralized utility is testable |
| ARIA tab pattern | Custom click-only locale toggle | Proper `role="tablist"` / `role="tab"` / `aria-selected` / arrow key nav | WCAG 4.1.2 requires ARIA state; WCAG 2.1.1 requires keyboard access |

**Key insight:** The entire localization feature is achievable with one utility function, one locale map module, and one new UI component. The existing architecture (context, editor props, Blocks renderer) requires extensions, not rewrites.

---

## Existing Code Impact Analysis

### Functions requiring locale-aware extension

| File | Function | Change Required |
|------|----------|----------------|
| `src/index.js` | `CMSProvider` | Add `isLocalized` prop + `locale`/`setLocale` state to context value |
| `src/index.js` | `useCMSContent` | Add optional `{ locale }` second param (no behavior change yet) |
| `src/server/index.js` | `getCMSContent` | Add optional `{ locale }` second param (no behavior change yet) |
| `src/server/index.js` | `getCollectionContent` | Same optional locale param |
| `src/blocks/index.js` | `Blocks` | Add `locale` prop, pass to block components |
| `src/blocks/Title.js` | `Title` | Accept `locale` prop, call `resolveLocale` on `data.text` |
| `src/blocks/Paragraph.js` | `Paragraph` | Same pattern as Title |
| `src/blocks/RichText.js` | `RichText` | Same on `data.html` |
| `src/blocks/Image.js` | `Image` | `resolveLocale` on `data.alt`; `data.src` is shared |
| `src/blocks/Gallery.js` | `Gallery` | `resolveLocale` on each `item.alt`; `item.src` is shared |
| `src/admin/PageEditor.js` | `PageEditor` | Render `LocaleSwitcher` when `isLocalized`; no other change |
| `src/admin/editors/TitleEditor.js` | `TitleEditor` | Locale-aware read/write pattern for `data.text` |
| `src/admin/editors/TextEditor.js` | `TextEditor` | Same for `data.text` (paragraph) |
| `src/admin/editors/RichTextEditor.js` | `RichTextEditor` | Same for `data.html` |
| `src/admin/editors/ImageEditor.js` | `ImageEditor` | `data.alt` is locale-aware; `data.src` is not |
| `src/admin/editors/GalleryEditor.js` | `GalleryEditor` | `item.alt` is locale-aware; `item.src` is not |

### Functions that do NOT need changes

| File | Function | Reason |
|------|----------|--------|
| `src/firebase/firestore.js` | `saveDraft`, `publishPage`, `getPage`, etc. | Write/publish entire blocks array — locale structure is inside `data`, which is already opaque to these functions |
| `src/firebase/firestore.js` | `listPages`, `listPagesPaginated` | Page list metadata (`name`, `slug`, `status`) is not localized |
| `src/admin/PageManager.js` | All | Page list does not render block content |
| `src/admin/BlockCanvas.js` | All | Passes `data` through to editors; locale is read by editors from context |
| `src/admin/EditorHeader.js` | All | Page name / slug fields are not block content (name is shared, not localized) |

### Key insight on saveDraft

`saveDraft` writes `{ 'draft.blocks': blocks }`. Because each block's `data` field already contains the full `{ en, fr }` locale object (assembled by the editor forms), the write is locale-agnostic. **No change to saveDraft is required.** Same for `publishPage`.

---

## Common Pitfalls

### Pitfall 1: Locale state reset on navigation between pages

**What goes wrong:** If `locale` state lives in `CMSProvider` and an editor navigates from page A to page B, the locale resets to `'en'` (React re-renders `CMSProvider` ... actually it does not reset — `CMSProvider` is mounted once at app root). This is safe.

**Verification:** `CMSProvider` wraps the entire admin; it does not unmount between page navigations. Locale persists across page editor navigations within the same session.

### Pitfall 2: Writing only the active locale's value, losing the other locale

**What goes wrong:** Editor form onChange writes `{ ...data, text: frenchValue }` instead of `{ ...data, text: { ...data.text, fr: frenchValue } }`, overwriting the EN value.

**How to avoid:** Always spread the existing locale object: `{ ...(data.text ?? {}), [locale]: newVal }`. Every editor form must use this pattern. Add a test that verifies switching locale and editing does not lose the other locale's content.

**Warning signs:** FR editor saves, switch to EN, EN field is blank.

### Pitfall 3: Block components crash on plain string data (legacy / monolingual pages)

**What goes wrong:** If `data.text` is `"Hello"` (monolingual legacy page), and a block component does `data.text.en`, it reads `undefined` on a string (or crashes).

**How to avoid:** `resolveLocale` handles this — `typeof value !== 'object'` returns the value as-is. Block components must always call `resolveLocale(data?.text, locale)`, never `data?.text?.[locale]` directly.

### Pitfall 4: resolveLocale called with undefined locale

**What goes wrong:** A consumer renders `<Blocks data={content} />` without a `locale` prop. `locale` would be `undefined`, `resolveLocale(value, undefined)` returns `value['en']` (correct, because `value[undefined]` is `undefined`, falls to `?? value['en']`).

**Verification:** `resolveLocale` defaults `locale` to `'en'`. `Blocks` defaults `locale` to `'en'`. Both layers have a default, making this safe.

### Pitfall 5: Admin UI strings missing FR translations

**What goes wrong:** A developer adds a new admin string in EN but forgets to add the FR translation. The `t.newKey` is `undefined` in FR mode, rendering blank.

**How to avoid:** Keep `ADMIN_STRINGS.en` and `ADMIN_STRINGS.fr` in the same file. Add a source-scan test that verifies the key sets of both objects are identical.

### Pitfall 6: isLocalized reaching AdminPanel via prop but not CMSProvider

**What goes wrong:** Consumer sets `isLocalized` on `AdminPanel` but not on `CMSProvider`. The admin panel shows the locale switcher, but `getCMSContent` / `useCMSContent` callers on the front end don't know about localization.

**How to avoid:** `isLocalized` must live on `CMSProvider` as the single source of truth. `AdminPanel` reads it from context via `useCMSFirebase()`, not from its own prop. CONTEXT.md notes "both need it" but recommends CMSProvider as the owner — research confirms this. Document clearly in the API that `isLocalized` goes on `CMSProvider`.

---

## Code Examples

### resolveLocale utility (complete)
```js
// src/utils/resolveLocale.js
// Resolves a field value that may be a plain string or a { en, fr } locale object.
// Always falls back to 'en' if the requested locale has no content.
export function resolveLocale(value, locale = 'en') {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return value          // plain string — return as-is
  return value[locale] ?? value['en'] ?? ''            // locale object — resolve with fallback
}
```

### Admin i18n map skeleton (src/admin/i18n.js)
```js
export const ADMIN_STRINGS = {
  en: {
    // Publishing
    publish: 'Publish',
    publishPage: 'Publish page',
    publishing: 'Publishing...',
    published: 'Published',
    lastPublished: 'Last published',
    unpublishedChanges: 'Unpublished changes',
    // Draft / Save
    draft: 'Draft',
    saving: 'Saving...',
    saved: 'Saved',
    saveError: 'Save failed — retry',
    // Blocks
    addBlock: 'Add block',
    deleteBlock: 'Delete block',
    undoDelete: 'Undo',
    // Navigation
    back: 'Back',
    pages: 'Pages',
    // Locale switcher
    contentLanguage: 'Content language',
    english: 'English',
    french: 'French',
    // Errors
    loadError: "This page couldn't be loaded",
    loadErrorBody: 'Check your connection and try again.',
    reload: 'Reload',
  },
  fr: {
    publish: 'Publier',
    publishPage: 'Publier la page',
    publishing: 'Publication...',
    published: 'Publié',
    lastPublished: 'Dernière publication',
    unpublishedChanges: 'Modifications non publiées',
    draft: 'Brouillon',
    saving: 'Enregistrement...',
    saved: 'Enregistré',
    saveError: "Échec — réessayer",
    addBlock: 'Ajouter un bloc',
    deleteBlock: 'Supprimer le bloc',
    undoDelete: 'Annuler',
    back: 'Retour',
    pages: 'Pages',
    contentLanguage: 'Langue du contenu',
    english: 'Anglais',
    french: 'Français',
    loadError: "Cette page n'a pas pu être chargée",
    loadErrorBody: 'Vérifiez votre connexion et réessayez.',
    reload: 'Recharger',
  },
}
```

### LocaleSwitcher component (structure)
```js
// src/admin/LocaleSwitcher.js
"use client"
import { useCMSFirebase } from '../index.js'
import { ADMIN_STRINGS } from './i18n.js'

export function LocaleSwitcher() {
  const { locale, setLocale } = useCMSFirebase()
  const t = ADMIN_STRINGS[locale] ?? ADMIN_STRINGS.en

  function handleKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setLocale(locale === 'en' ? 'fr' : 'en')
    }
  }

  return (
    <div
      role="tablist"
      aria-label={t.contentLanguage}
      className="jeeby-cms-locale-switcher"
      onKeyDown={handleKeyDown}
    >
      <button
        role="tab"
        aria-selected={locale === 'en'}
        tabIndex={locale === 'en' ? 0 : -1}
        className="jeeby-cms-locale-tab"
        onClick={() => setLocale('en')}
      >
        {t.english}
      </button>
      <button
        role="tab"
        aria-selected={locale === 'fr'}
        tabIndex={locale === 'fr' ? 0 : -1}
        className="jeeby-cms-locale-tab"
        onClick={() => setLocale('fr')}
      >
        {t.french}
      </button>
    </div>
  )
}
```

### TitleEditor locale-aware pattern (read + write)
```js
// Inside TitleEditor component
const { locale, isLocalized } = useCMSFirebase()

const textValue = isLocalized
  ? (typeof data?.text === 'object' ? (data.text[locale] ?? '') : (data?.text ?? ''))
  : (data?.text ?? '')

function handleTextChange(newVal) {
  if (isLocalized) {
    const existing = (typeof data?.text === 'object' ? data.text : {})
    onChange({ ...data, text: { ...existing, [locale]: newVal } })
  } else {
    onChange({ ...data, text: newVal })
  }
}
```

### getCMSContent locale extension (minimal, backward-compat)
```js
// src/server/index.js
export async function getCMSContent(slug, { locale = 'en' } = {}) {
  const db = getAdminFirestore()
  const snap = await db.doc('pages/' + slug).get()
  if (!snap.exists) return null
  const pageData = snap.data()
  return pageData?.published ?? null
  // Note: locale param accepted for API symmetry; field resolution happens in <Blocks locale={locale}>
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| i18next for all i18n | Hardcoded locale maps for small fixed-locale admin UIs | Ongoing best practice for small CMSs | Removes runtime dependency; simpler mental model |
| Separate Firestore docs per locale | Per-field locale objects within one doc | Established Sanity/Contentful pattern for doc-based CMSs | Single Firestore document preserves existing CRUD surface |

**Deprecated/outdated:**
- Using i18n libraries for admin UI when locale count is fixed and small: unnecessary complexity and bundle weight at two locales.

---

## Open Questions

1. **Page name localization**
   - What we know: `page.name` is a plain string used in `PageManager` and `EditorHeader`. It is not a block field.
   - What's unclear: Should editors be able to set different names per locale (e.g., "About" / "À propos")? CONTEXT.md does not mention this.
   - Recommendation: Defer to planner. If page names are localizable, `name` becomes `{ en, fr }` in the page doc — a small addition. If not, `name` stays a single string. Suggest keeping it monolingual for v1 unless the planner has a strong reason.

2. **Admin UI strings scope**
   - What we know: Many admin component strings are hardcoded in JSX (e.g., "Reload", "This page couldn't be loaded", button labels).
   - What's unclear: The full inventory of strings needing translation. A wave 0 audit task should produce this list before implementing.
   - Recommendation: Wave 0 plan task: enumerate all user-visible strings in admin components and add them to `ADMIN_STRINGS`. Estimate: 30-60 strings across ~15 components.

3. **Video block locale**
   - What we know: `video.url` is a shared URL. No caption field currently exists.
   - What's unclear: If a caption field is added in this phase, it would be locale-specific.
   - Recommendation: Video `url` is not localized. If no caption field exists yet, video block has no locale-specific content and needs no changes beyond accepting `locale` prop (which it ignores).

---

## Environment Availability

Step 2.6: SKIPPED — this phase is entirely code changes to an existing Node.js/React project. No new external tools, databases, CLI utilities, or services required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None — test script in `package.json`: `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/**/*.test.js'` |
| Quick run command | `npm test -- --test-name-pattern="resolveLocale"` (single file) |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| I18N-01 | `resolveLocale` returns string value unchanged | unit | `npm test -- --test-name-pattern="resolveLocale"` | `src/utils/resolveLocale.test.js` (Wave 0 gap) |
| I18N-02 | `resolveLocale` returns `locale` value from object | unit | same | same |
| I18N-03 | `resolveLocale` falls back to `en` when locale missing | unit | same | same |
| I18N-04 | `resolveLocale` returns `''` for null/undefined | unit | same | same |
| I18N-05 | `CMSProvider` passes `isLocalized` and `locale` through context | source-scan | `npm test -- --test-name-pattern="CMSProvider"` | `src/index.test.js` (extend existing) |
| I18N-06 | `getCMSContent` accepts optional `locale` param without breaking existing callers | source-scan | `npm test -- --test-name-pattern="getCMSContent"` | `src/server/index.test.js` (extend existing) |
| I18N-07 | `Blocks` accepts and forwards `locale` prop to block components | source-scan | `npm test -- --test-name-pattern="Blocks"` | `src/blocks/index.test.js` (extend existing) |
| I18N-08 | `ADMIN_STRINGS.en` and `ADMIN_STRINGS.fr` have identical key sets | source-scan | `npm test -- --test-name-pattern="ADMIN_STRINGS"` | `src/admin/i18n.test.js` (Wave 0 gap) |
| I18N-09 | `LocaleSwitcher` renders `role="tablist"` and two `role="tab"` buttons | source-scan | `npm test -- --test-name-pattern="LocaleSwitcher"` | `src/admin/LocaleSwitcher.test.js` (Wave 0 gap) |
| I18N-10 | `LocaleSwitcher` marks active locale with `aria-selected="true"` | source-scan | same | same |
| I18N-11 | TitleEditor writes locale-keyed object when `isLocalized` is true | source-scan | `npm test -- --test-name-pattern="TitleEditor"` | `src/admin/editors/TitleEditor.test.js` (extend existing) |
| I18N-12 | Switching locale in editor does not overwrite other locale's content | source-scan | same | same |
| I18N-13 | `isLocalized: false` — block components receive plain string unchanged | unit | `npm test -- --test-name-pattern="Title"` | `src/blocks/Title.test.js` (extend existing) |

### Sampling Rate

- Per task commit: `npm test -- --test-name-pattern="<feature under test>"`
- Per wave merge: `npm test` (full suite)
- Phase gate: Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/utils/resolveLocale.test.js` — covers I18N-01 through I18N-04
- [ ] `src/admin/i18n.test.js` — covers I18N-08 (key set parity check)
- [ ] `src/admin/LocaleSwitcher.test.js` — covers I18N-09, I18N-10

*(Existing test files `src/index.test.js`, `src/server/index.test.js`, `src/blocks/index.test.js`, `src/blocks/Title.test.js`, `src/admin/editors/TitleEditor.test.js` need new test cases added — not new files.)*

---

## Sources

### Primary (HIGH confidence)

- Direct source inspection: `src/firebase/firestore.js` — all CRUD signatures confirmed
- Direct source inspection: `src/server/index.js` — `getCMSContent` and `getCollectionContent` signatures confirmed
- Direct source inspection: `src/index.js` — `CMSProvider` context shape, `useCMSContent` signature confirmed
- Direct source inspection: `src/admin/index.js` — `AdminPanel` current props confirmed
- Direct source inspection: `src/admin/PageEditor.js` — editor state, `saveDraft` call sites, block structure confirmed
- Direct source inspection: `src/blocks/index.js` + `src/blocks/Title.js` — block renderer and component patterns confirmed
- Direct source inspection: `.planning/phases/11-i18n-localization-for-admin-panel-and-block-components/11-CONTEXT.md` — all decisions confirmed

### Secondary (MEDIUM confidence)

- Established pattern: per-field `{ en, fr }` locale objects are the standard approach in Sanity CMS, Contentful, and Payload CMS for document-based CMSs with shared CRUD paths — this is consistent with the existing Firestore doc-per-page model.
- Established pattern: hardcoded locale maps for fixed two-locale admin UIs is standard practice in smaller CMS tools (Ghost CMS uses this pattern internally for its admin l10n).

### Tertiary (LOW confidence)

- None — all recommendations grounded in direct code inspection.

---

## Metadata

**Confidence breakdown:**
- Content model (per-field locale objects): HIGH — grounded in direct inspection of all Firestore write paths
- Architecture (context-based locale state): HIGH — consistent with existing `templates` prop pattern in `CMSProvider`
- Admin UX (tab-based locale switcher): HIGH — lightest option consistent with existing `ModalShell` / component patterns
- Admin UI strings (hardcoded map): HIGH — verified against bundle constraint in PROJECT.md
- Pitfalls: HIGH — derived from actual code paths, not speculation

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable codebase, no fast-moving dependencies)
