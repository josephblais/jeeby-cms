# Phase 5: Page Manager - Research

**Researched:** 2026-03-18
**Domain:** React admin UI, Firestore collection queries, slug validation, modal/inline-edit patterns, accessibility
**Confidence:** HIGH

## Summary

Phase 5 builds the Page Manager admin UI: a table of CMS pages with create, rename, and delete flows. All decisions are locked in CONTEXT.md. The technical surface is narrow — Firestore collection queries (adding `listPages` and `renamePage` to the existing `firestore.js`), React state management for two modals and one inline edit flow, slug pattern validation via regex, and passing a `templates` prop through CMSContext.

The project established patterns in Phases 3 and 4 that carry directly into this phase: source inspection tests (no multi-layer mock chains), `readFileSync`-based accessibility contract tests, `"use client"` at the top of every admin component, minimal inline styles with `.jeeby-cms-admin` class scoping, and error handling via throw/try-catch. These patterns are non-negotiable and must be applied consistently.

The accessibility obligations from CLAUDE.md are significant: modals require focus trapping, return focus on close, Escape key support, and `role="dialog"` with `aria-labelledby`. The inline slug/name edit requires proper keyboard support (Enter saves, Escape cancels) and accessible feedback. Live regions are needed for success/error announcements.

**Primary recommendation:** Follow established patterns precisely — source inspection tests, try/catch error handling, minimal inline styles, accessibility-first — and add only what is new: `listPages`, `renamePage`, `CMSContext.templates`, `PageManager`, `CreatePageModal`, `DeletePageModal`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Create Page Flow**
- "New Page" button sits top-right above the page list
- Clicking it opens a modal with three fields: display name, slug, and template dropdown
- Slug validation runs with a debounce (~300–500ms after the user stops typing) against the selected template's pattern
- Error message appears below the slug field inline
- On successful creation: modal closes, new page appears in the list
- Template dropdown is hidden if no templates are registered; any slug is accepted in that case

**Delete Page Flow**
- Each table row has a Delete action button
- Clicking Delete opens a confirmation modal: "Delete /blog/my-post? This cannot be undone." with Cancel and Delete buttons
- Confirmed deletion calls `deletePage(db, slug)` and removes the row from the list

**Page List Display**
- Table layout with four columns: Name | Slug | Last Published | Actions
- "Last Published" shows formatted date if `lastPublishedAt` exists, otherwise "Never"
- Empty state: centered message "No pages yet. Create your first page." with a New Page button

**Template Definition**
- Developer provides templates via `CMSProvider` prop: `<CMSProvider templates={[...]}>`
- Each template is an object: `{ name: 'Blog Post', pattern: '/blog/[slug]' }`
- Pattern uses Next.js dynamic segment syntax: `[slug]` → single segment, `[...path]` → catch-all
- Validation converts `[slug]` to a regex segment (`[^/]+`) and `[...path]` to a catch-all (`.*`) for matching
- If `templates` prop is empty/undefined: template dropdown is hidden and any slug is valid

**Rename UX**
- Inline edit: clicking the slug cell (or an edit icon) converts it to an editable input in place
- Pressing Enter or blurring saves; pressing Escape cancels and restores the original slug
- On save: validates the new slug against the page's assigned template pattern
- Firestore rename: read old doc, write under new slug, delete old doc — content is fully preserved
- Error shown inline below the row if the new slug is invalid or already taken
- Non-atomic: if delete fails, both slugs temporarily exist. For v1, log the error and show retry message.

**Display Name Storage**
- Stored as top-level field on the page Firestore doc: `{ name, slug, template, draft, published, lastPublishedAt, updatedAt, ... }`
- Display name is also inline-editable in the page list (same inline edit pattern as slug)

**Admin Navigation**
- Page Manager fills the `{children}` slot of `AdminPanel` as the default view — no nav links added in Phase 5
- `AdminPanel` auto-renders `PageManager` as its default content (consumer just uses `<AdminPanel>`)
- `PageManager` is internal-only — not exported from `jeeby-cms/admin`

### Claude's Discretion
- Exact CSS for the table, modal, and inline edit states (Phase 8 handles full styling)
- Specific debounce delay (300–500ms range is acceptable)
- Pagination vs infinite list (no pagination needed for v1)
- Exact aria labels and live region announcements (beyond minimum: accessible form labels, modal focus management)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-01 | Admin can view a list of all CMS pages with their slugs and last published date | `listPages(db)` using Firestore `collection` + `getDocs`; table layout with Name, Slug, Last Published, Actions columns |
| PAGE-02 | Admin can create a new page by entering a slug and selecting a template | `CreatePageModal` component; `savePage(db, slug, { name, template })` for persistence; modal pattern from LoginPage card |
| PAGE-03 | Admin can delete a page | `DeletePageModal` confirmation; existing `deletePage(db, slug)` helper |
| PAGE-04 | Admin can rename a page slug | `renamePage(db, oldSlug, newSlug)` helper (read + write + delete); inline edit UX in table row |
| PAGE-05 | Slug is validated against the selected template pattern before saving | `validateSlug(pattern, slug)` — converts `[slug]`→`[^/]+` and `[...path]`→`.*`, anchors regex |
| PAGE-06 | Developer can register available templates in config (CMSProvider prop) | `templates` prop on `CMSProvider`; threaded through `CMSContext`; read in `PageManager` via `useCMSFirebase` or new `useCMSContext` hook |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/firestore | >=10 (peer) | `collection`, `getDocs`, `query`, `orderBy` for listPages | Already the project's data layer; never bundled |
| react | >=18 (peer) | useState, useEffect, useRef, useCallback for all UI state | Already the project's view layer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node built-ins (readFileSync) | Node 22 | Source inspection tests | All test files in this project use this pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual debounce with setTimeout/clearTimeout | lodash.debounce | No extra dependency needed; simple 300ms pattern is sufficient |
| Inline regex construction | path-to-regexp | No extra dep; the pattern syntax is a small subset (two tokens only) |

**Installation:** No new packages required. All dependencies are already peer deps or Node built-ins.

---

## Architecture Patterns

### Recommended File Structure
```
src/
├── firebase/
│   └── firestore.js         # Add: listPages(), renamePage()
├── admin/
│   ├── index.js             # Modify: import PageManager, render as default children
│   ├── PageManager.js       # New: main table + empty state + orchestrates modals
│   ├── CreatePageModal.js   # New: modal with name/slug/template fields
│   ├── DeletePageModal.js   # New: confirmation modal
│   ├── PageManager.test.js  # New: source inspection tests
│   ├── CreatePageModal.test.js
│   └── DeletePageModal.test.js
└── index.js                 # Modify: add templates prop to CMSProvider + CMSContext
```

### Pattern 1: Firestore Collection Query (listPages)
**What:** Fetch all documents from `/cms/pages` sub-collection path. The existing `pageRef` uses `doc(db, 'cms', 'pages', slug)` — this is a nested collection path where `cms` is a document and `pages` is a sub-collection. `listPages` must use `collection(db, 'cms', 'pages')` with `getDocs`.

Note: the existing `pageRef` uses `doc(db, 'cms', 'pages', slug)` which is a 3-segment path. In Firestore, a 3-segment doc path is `collection/document/subcollection` — this means the pages live in a sub-collection named `pages` under a document named `pages` inside a collection named `cms`. To list them, use `collection(db, 'cms', 'pages')`.

**When to use:** PAGE-01 list view, refresh after create/delete/rename

```javascript
// Source: firestore.js existing pageRef pattern
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

export async function listPages(db) {
  const col = collection(db, 'cms', 'pages')
  const snap = await getDocs(query(col, orderBy('updatedAt', 'desc')))
  return snap.docs.map(d => ({ slug: d.id, ...d.data() }))
}
```

### Pattern 2: Rename (Non-Atomic Read-Write-Delete)
**What:** Read old document, write new document under new slug, delete old document. CONTEXT.md explicitly accepts the non-atomic tradeoff for v1.

**When to use:** PAGE-04 rename flow

```javascript
export async function renamePage(db, oldSlug, newSlug) {
  const data = await getPage(db, oldSlug)
  if (!data) throw new Error(`Page "${oldSlug}" not found`)
  await savePage(db, newSlug, data)
  await deletePage(db, oldSlug)
}
```

### Pattern 3: Slug Validation Regex
**What:** Convert Next.js dynamic segment pattern to anchored regex. Two token types only: `[slug]` (single path segment, no slashes) and `[...path]` (catch-all, any chars including slashes).

**When to use:** PAGE-05 validation in CreatePageModal and inline rename

```javascript
// Source: CONTEXT.md pattern spec
export function validateSlug(pattern, slug) {
  if (!pattern) return true  // no template registered
  const regexStr = pattern
    .replace(/\[\.\.\.[\w]+\]/g, '.*')       // [...path] → .*
    .replace(/\[[\w]+\]/g, '[^/]+')          // [slug]    → [^/]+
    .replace(/\//g, '\\/')                    // escape slashes
  const re = new RegExp('^' + regexStr + '$')
  return re.test(slug)
}
```

### Pattern 4: Templates via CMSContext
**What:** Add `templates` prop to `CMSProvider`, merge into context value. Existing context value is the Firebase instances object. Extend it with `templates`.

**When to use:** PAGE-06 developer registration

```javascript
// src/index.js modification
export function CMSProvider({ firebaseConfig, templates = [], children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  const value = useMemo(() => ({ ...firebase, templates }), [firebase, templates])
  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>
}
```

### Pattern 5: Modal Accessibility (from LoginPage + CLAUDE.md)
**What:** Dialogs need `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal heading, focus trapped inside, Escape key closes, focus returns to trigger element on close.

The project does not yet have a reusable modal primitive. Both `CreatePageModal` and `DeletePageModal` must implement the full pattern themselves in Phase 5, since Phase 8 defers full styling and no modal utility exists yet.

**Focus trap approach without external library:** Use `useRef` to capture all focusable elements inside the dialog and cycle Tab/Shift+Tab within them. The trigger button ref should be passed in or captured before open so focus can return on close.

```javascript
// Minimum modal shell pattern
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-heading-id"
  // ref for focus trap
>
  <h2 id="modal-heading-id">Create New Page</h2>
  {/* ... fields ... */}
</div>
```

### Pattern 6: Inline Edit
**What:** Slug and name cells toggle between display and input mode. Input mode renders a text `<input>` with the current value. Enter/blur saves; Escape cancels. Error renders below the row.

The inline edit is not a dialog — it does not need `role="dialog"`. It should:
- Use `aria-label` on the input describing what is being edited (e.g., `aria-label="Edit slug for About page"`)
- Show error with `role="alert"` so screen readers announce it immediately

### Pattern 7: Debounce (no library)
**What:** Plain setTimeout/clearTimeout inside useEffect or an event handler. 300ms is the chosen value.

```javascript
const debounceRef = useRef(null)
function handleSlugChange(val) {
  setSlug(val)
  clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    // run validation
  }, 300)
}
```

### Pattern 8: Source Inspection Tests
**What:** All test files in this project use `readFileSync` to inspect source code rather than mounting components. This avoids multi-layer Firebase/React mock chains that fail under Node 22.

```javascript
// Established pattern — ALL new test files must follow this
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('./PageManager.js', import.meta.url), 'utf8')
assert.ok(src.includes('role="dialog"'), 'Modal must have role="dialog"')
```

### Anti-Patterns to Avoid
- **Using `doc(db, 'cms/pages', slug)`:** String path with slash is invalid Firestore API — must use separate string segments `doc(db, 'cms', 'pages', slug)` as already established in `pageRef`.
- **Exporting PageManager from jeeby-cms/admin:** CONTEXT.md is explicit — `PageManager` is internal only. Only `AdminPanel` is exported.
- **Touching AdminNav.js:** CONTEXT.md explicitly says Phase 5 does not modify AdminNav.
- **Atomic rename:** CONTEXT.md accepts non-atomic v1 — do not add transactions.
- **Pagination:** CONTEXT.md defers pagination; v1 renders all pages.
- **Template dropdown when no templates:** Hide it entirely — do not show an empty `<select>`.
- **JSX without "use client":** Every admin component file must have `"use client"` at the top.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in modals | Custom DOM traversal utility | Inline focusable-selector + keydown handler per modal | No external library needed; two modals is manageable; avoid importing a focus-trap library as a non-peer dep |
| Slug regex matching | URL parsing library | `validateSlug()` function (7 lines) | Pattern syntax is two tokens only; library would be overkill |
| Debounce | lodash.debounce | setTimeout/clearTimeout (5 lines) | No new dependency; already established project pattern |
| Date formatting | date-fns | `new Date(ts.toDate()).toLocaleDateString()` | Firestore Timestamps have `.toDate()`; basic locale string is sufficient for v1 |

---

## Common Pitfalls

### Pitfall 1: Firestore collection path
**What goes wrong:** Calling `collection(db, 'cms/pages')` (single string with slash) instead of `collection(db, 'cms', 'pages')` (two separate segments). The single-string form references a top-level collection named literally `'cms/pages'` which does not exist.

**Why it happens:** Firestore SDK accepts both forms but they mean different things. A string with forward slashes creates nested paths only when the segment count is odd (documents) vs even (collections).

**How to avoid:** Mirror the existing `pageRef` helper: `doc(db, 'cms', 'pages', slug)` has 3 segments (collection, doc, subcollection + doc implied). For `collection(db, 'cms', 'pages')` — 2 segments — this is a sub-collection path.

**Warning signs:** Query returns empty results despite documents existing in Firestore console.

### Pitfall 2: CMSContext value mutation breaks memoization
**What goes wrong:** Spreading `firebase` and `templates` directly in the Provider without `useMemo` causes a new context value object on every render, re-rendering all consumers.

**Why it happens:** `{ ...firebase, templates }` creates a new object reference each render.

**How to avoid:** Wrap the combined value in `useMemo(() => ({ ...firebase, templates }), [firebase, templates])`.

### Pitfall 3: Modal not returning focus on close
**What goes wrong:** After closing a modal (Create or Delete), focus returns to `document.body` instead of the button that opened it.

**Why it happens:** React unmounts the modal element, browser places focus at body.

**How to avoid:** Capture `triggerRef` before opening the modal (`useRef` pointing to the New Page button or Delete button). In the close handler, call `triggerRef.current?.focus()`.

### Pitfall 4: Rename leaves orphan document on delete failure
**What goes wrong:** `renamePage` writes the new slug, then `deletePage` throws. Now both slugs exist.

**Why it happens:** Non-atomic Firestore operation.

**How to avoid:** Per CONTEXT.md, this is accepted for v1. Catch the delete error, log it, and show the user a retry message. Do not silently swallow the error.

### Pitfall 5: orderBy on missing field silently excludes documents
**What goes wrong:** `query(col, orderBy('updatedAt', 'desc'))` silently excludes documents that do not have `updatedAt`.

**Why it happens:** Firestore omits documents from ordered queries when the ordered field is absent.

**How to avoid:** All page creation paths use `savePage` which already sets `updatedAt: serverTimestamp()`. For robustness, `listPages` can also work without `orderBy` for v1 (page count is small). If ordering is needed, ensure `savePage` always sets `updatedAt` (it does).

### Pitfall 6: slug-as-doc-ID means rename = new document
**What goes wrong:** Developer assumes `updateDoc` can change a document's ID, or tries to update `slug` field without creating a new document.

**Why it happens:** Firestore document IDs are immutable — they cannot be changed with `updateDoc`.

**How to avoid:** The rename must always be read + write-new + delete-old. The `slug` field stored in the doc data is redundant but useful for list rendering — it should mirror the document ID.

### Pitfall 7: Inline edit blur fires before click on save button
**What goes wrong:** If an inline edit has a separate Save button, `onBlur` fires when the user clicks Save, which may cancel the save or trigger a premature commit.

**Why it happens:** `blur` fires before `click` in the browser event order.

**How to avoid:** Per CONTEXT.md, the inline edit saves on blur (not on a separate save button). No Save button needed — Enter or blur = save, Escape = cancel. This avoids the race condition.

---

## Code Examples

### listPages — complete implementation
```javascript
// Source: firestore.js pattern + Firestore SDK docs
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export async function listPages(db) {
  const col = collection(db, 'cms', 'pages')
  const snap = await getDocs(col)  // no orderBy to avoid missing-field exclusion
  return snap.docs.map(d => ({ slug: d.id, ...d.data() }))
}
```

### renamePage — complete implementation
```javascript
export async function renamePage(db, oldSlug, newSlug) {
  const data = await getPage(db, oldSlug)
  if (!data) throw new Error(`Page "${oldSlug}" not found`)
  await savePage(db, newSlug, { ...data, slug: newSlug })
  await deletePage(db, oldSlug)
}
```

### validateSlug — complete implementation
```javascript
export function validateSlug(pattern, slug) {
  if (!pattern) return true
  const regexStr = pattern
    .replace(/\[\.\.\.[\w]+\]/g, '.*')
    .replace(/\[[\w]+\]/g, '[^/]+')
    .replace(/\//g, '\\/')
  return new RegExp('^' + regexStr + '$').test(slug)
}
```

### CMSProvider with templates prop
```javascript
// src/index.js
export function CMSProvider({ firebaseConfig, templates = [], children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  const value = useMemo(() => ({ ...firebase, templates }), [firebase, templates])
  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>
}
```

### AdminPanel default-rendering PageManager
```javascript
// src/admin/index.js
import { PageManager } from './PageManager.js'

export function AdminPanel({ children }) {
  // ... loading/auth checks ...
  return (
    <div className="jeeby-cms-admin" style={{ minHeight: '100vh' }}>
      {/* skip link */}
      <AdminNav onSignOut={signOut} />
      <main className="jeeby-cms-shell-content" id="main-content" role="main" tabIndex={-1}>
        {children ?? <PageManager />}
      </main>
    </div>
  )
}
```

### Focus management for modals (minimum pattern)
```javascript
// In a modal component
const dialogRef = useRef(null)
const triggerRef = useRef(null)  // passed from parent or captured before open

useEffect(() => {
  if (open) {
    // Focus first focusable element inside dialog
    const focusable = dialogRef.current?.querySelector(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  }
}, [open])

function handleClose() {
  onClose()
  triggerRef.current?.focus()  // return focus to trigger
}

// Keyboard handler on dialog div
function handleKeyDown(e) {
  if (e.key === 'Escape') handleClose()
  // Tab cycling omitted here — implement per modal
}
```

### Date formatting for lastPublishedAt (Firestore Timestamp)
```javascript
function formatDate(ts) {
  if (!ts) return 'Never'
  // Firestore Timestamps have .toDate(); could also be a plain Date if from local state
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React.createElement in admin files | JSX (TSUP loader: { '.js': 'jsx' }) | Phase 3 (Plan 01) | All admin .js files can use JSX directly |
| Separate `{children}` rendering | `{children ?? <PageManager />}` nullish coalescing | Phase 5 | Default content without breaking existing children API |

**Deprecated/outdated:**
- React.createElement pattern: superseded in Phase 3 when TSUP JSX loader was configured. All new admin components use JSX.

---

## Open Questions

1. **Firestore collection path for pages**
   - What we know: existing `pageRef` uses `doc(db, 'cms', 'pages', slug)` — 3 args after db means `collection/docId/subcollection` is ambiguous without testing
   - What's unclear: is `'cms'` a collection and `'pages'` a subcollection, or is there a top-level `cms` document? The path `doc(db, 'cms', 'pages', slug)` has 3 string args — in Firestore SDK, `doc` with odd total segments is a document reference. `doc(db, 'cms', 'pages', slug)` = collection `cms`, document `pages`, (but that's only 2 segments so slug would be a subcollection doc). Actually: `doc(db, collectionPath, docId)` with 3 string args means collection=`cms`, doc=`pages`, subcollection implied... this needs careful review against the SDK.
   - Recommendation: The implementer should verify the collection path by checking Firebase console or running a test query. The `collection(db, 'cms', 'pages')` for `listPages` mirrors the `doc(db, 'cms', 'pages', slug)` pattern from `pageRef` and should be correct.

2. **useCMSFirebase exposing templates**
   - What we know: `useCMSFirebase` currently returns `{ db, auth, storage }` — the Firebase instances
   - What's unclear: should `PageManager` call `useCMSFirebase()` and get `templates` from it (after the context value is extended), or should there be a separate `useCMSTemplates()` hook?
   - Recommendation: Extend `useCMSFirebase` to return `templates` alongside Firebase instances. No new hook needed for v1.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none — invoked via npm test script |
| Quick run command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js'` |
| Full suite command | `npm test` (runs all `src/**/*.test.js`) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | listPages exported as function | unit (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-01 | PageManager renders table with correct columns | structural (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-02 | CreatePageModal has labeled inputs + role="dialog" | structural (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-02 | savePage called with name/slug/template | structural (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-03 | DeletePageModal has confirmation text + role="dialog" | structural (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-03 | deletePage called on confirm | structural (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-04 | renamePage exported as function | unit (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-04 | inline edit keyboard pattern (Enter/Escape) present in source | structural (source inspection) | `npm test` | No — Wave 0 gap |
| PAGE-05 | validateSlug returns true for matching pattern | unit | `npm test` | No — Wave 0 gap |
| PAGE-05 | validateSlug returns false for non-matching pattern | unit | `npm test` | No — Wave 0 gap |
| PAGE-06 | CMSProvider accepts templates prop + passes through context | structural (source inspection) | `npm test` | No — Wave 0 gap |

### Sampling Rate
- Per task commit: `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js' 'src/firebase/firestore.test.js'`
- Per wave merge: `npm test`
- Phase gate: Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/firebase/firestore.test.js` — extend existing file with tests for `listPages` and `renamePage`
- [ ] `src/admin/PageManager.test.js` — structural tests for table layout, empty state, accessibility attributes
- [ ] `src/admin/CreatePageModal.test.js` — form labels, role="dialog", aria-labelledby, slug validation wiring
- [ ] `src/admin/DeletePageModal.test.js` — confirmation text, role="dialog", button labels
- [ ] `src/index.test.js` or new test — CMSProvider templates prop passes through context

---

## Sources

### Primary (HIGH confidence)
- Existing project source (`src/firebase/firestore.js`, `src/admin/index.js`, `src/index.js`, `src/admin/LoginPage.js`) — established patterns and integration points
- `.planning/phases/05-page-manager/05-CONTEXT.md` — all locked decisions
- `.planning/REQUIREMENTS.md` — PAGE-01 through PAGE-06 requirement definitions
- `.planning/STATE.md` — decisions log confirming JSX loader, children prop, testing approach

### Secondary (MEDIUM confidence)
- CLAUDE.md accessibility requirements — WCAG AA standards for modals, forms, keyboard, live regions
- Node.js `node:test` module patterns from existing test files — established testing idiom

### Tertiary (LOW confidence)
- None — all research is grounded in the project's own source and documented decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing project dependencies; no new packages needed
- Architecture: HIGH — all patterns are direct extensions of established Phase 3/4 patterns
- Pitfalls: HIGH — derived from existing source code analysis and documented Firestore/React behaviors
- Accessibility requirements: HIGH — CLAUDE.md is explicit; existing LoginPage demonstrates the pattern

**Research date:** 2026-03-18
**Valid until:** 2026-06-18 (stable Firebase SDK + React patterns; 90 days)
