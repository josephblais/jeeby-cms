# Phase 5: Page Manager - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Page Manager admin UI — a list view of all CMS pages with create, rename, and delete actions. Pages are stored in Firestore with slug as the document ID. Slug validation runs against developer-registered templates. The Block Editor (Phase 6) fills in the page content editing — Phase 5 only manages page-level metadata (slug, name, template).

</domain>

<decisions>
## Implementation Decisions

### Create Page Flow
- "New Page" button sits top-right above the page list
- Clicking it opens a modal with three fields: display name, slug, and template dropdown
- Slug validation runs with a debounce (~300–500ms after the user stops typing) against the selected template's pattern
- Error message appears below the slug field inline
- On successful creation: modal closes, new page appears in the list
- Template dropdown is hidden if no templates are registered; any slug is accepted in that case

### Delete Page Flow
- Each table row has a Delete action button
- Clicking Delete opens a confirmation modal: "Delete /blog/my-post? This cannot be undone." with Cancel and Delete buttons
- Confirmed deletion calls `deletePage(db, slug)` and removes the row from the list

### Page List Display
- Table layout with four columns: Name | Slug | Last Published | Actions
- "Last Published" shows formatted date if `lastPublishedAt` exists, otherwise "Never"
- Empty state: centered message "No pages yet. Create your first page." with a New Page button

### Template Definition
- Developer provides templates via `CMSProvider` prop: `<CMSProvider templates={[...]}>`
- Each template is an object: `{ name: 'Blog Post', pattern: '/blog/[slug]' }`
- Pattern uses Next.js dynamic segment syntax: `[slug]` → single segment, `[...path]` → catch-all
- Validation converts `[slug]` to a regex segment (`[^/]+`) and `[...path]` to a catch-all (`.*`) for matching
- If `templates` prop is empty/undefined: template dropdown is hidden and any slug is valid

### Rename UX
- Inline edit: clicking the slug cell (or an edit icon) converts it to an editable input in place
- Pressing Enter or blurring saves; pressing Escape cancels and restores the original slug
- On save: validates the new slug against the page's assigned template pattern
- Firestore rename: read old doc, write under new slug, delete old doc — content is fully preserved
- Error shown inline below the row if the new slug is invalid or already taken

### Display Name Storage
- Stored as a top-level field on the page Firestore doc: `{ name, slug, template, draft, published, lastPublishedAt, updatedAt, ... }`
- Display name is also inline-editable in the page list (same inline edit pattern as slug)

### Admin Navigation
- Page Manager fills the `{children}` slot of `AdminPanel` as the default view — no nav links added in Phase 5
- `AdminPanel` auto-renders `PageManager` as its default content (consumer just uses `<AdminPanel>` and gets the full experience)
- `PageManager` is internal-only — not exported from `jeeby-cms/admin`

### Claude's Discretion
- Exact CSS for the table, modal, and inline edit states (Phase 8 handles full styling)
- Specific debounce delay (300–500ms range is acceptable)
- Pagination vs infinite list for the page list (v1 page count is expected to be small — no pagination needed)
- Exact aria labels and live region announcements (beyond the minimum: accessible form labels, modal focus management)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/REQUIREMENTS.md` §Page Manager — PAGE-01 through PAGE-06 (all Phase 5 requirements)

### Existing Firestore schema
- `src/firebase/firestore.js` — Existing CRUD helpers (`getPage`, `savePage`, `deletePage`, `publishPage`). Phase 5 adds `listPages` and `renamePage` to this file.

### Admin shell
- `src/admin/index.js` — `AdminPanel` with `{children}` slot. Phase 5 default-renders `PageManager` here.
- `src/admin/AdminNav.js` — Existing nav bar. Phase 5 does not modify this.

### CMSProvider
- `src/index.js` — `CMSProvider` and `useAuth` hook. Phase 5 adds `templates` prop to `CMSProvider`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/firebase/firestore.js` — `getPage`, `savePage`, `deletePage` already exist. Need to add: `listPages(db)` (queries `/cms/pages` collection) and `renamePage(db, oldSlug, newSlug)` (read + write + delete).
- `src/admin/index.js` (`AdminPanel`) — Already has `{children}` slot and `jeeby-cms-admin` wrapper. Phase 5 renders `PageManager` as the default child.
- `src/index.js` (`CMSProvider`) — Already receives Firebase config and passes it to `initFirebase`. The `templates` prop needs to be added and passed down via context.
- `src/admin/LoginPage.js` — Login form with modal-style card layout. Similar card/modal pattern can be reused for create/delete modals.

### Established Patterns
- JavaScript only (no TypeScript for v1)
- `"use client"` at the top of individual admin component files
- Minimal inline styles for function; full CSS scoped under `.jeeby-cms-admin` deferred to Phase 8
- Error handling: helpers throw, callers use try/catch
- Firebase peer dep — import from `firebase/firestore`, never bundle
- `getFirebaseInstances()` available anywhere without prop drilling

### Integration Points
- `CMSProvider` (src/index.js) — Add `templates` prop; pass templates array down via context so `PageManager` can read it
- `AdminPanel` (src/admin/index.js) — Import `PageManager` and render it as default children when no `children` prop is provided
- `src/firebase/firestore.js` — Add `listPages` and `renamePage` exports
- `src/admin/index.js` (exports) — `PageManager` stays internal; `AdminPanel` is the only public export

</code_context>

<specifics>
## Specific Ideas

- Inline slug edit should use the same debounced validation as the create modal — consistent behavior
- The rename Firestore operation (read old → write new → delete old) is not atomic; if delete fails, both slugs temporarily exist. For v1, this is acceptable — just log the error and show a retry message.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-page-manager*
*Context gathered: 2026-03-17*
