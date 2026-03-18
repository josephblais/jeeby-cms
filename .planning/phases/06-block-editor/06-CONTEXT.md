# Phase 6: Block Editor - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Block Editor — a page-level canvas where admins add, edit, reorder, and delete blocks, with all changes auto-saved to Firestore's `draft.blocks` array. This phase delivers the editing experience only. Publishing (Phase 7) and media upload (Phase 9) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Page Editor Navigation
- Consumer creates `/admin/pages/[slug]/page.js` that renders `<AdminPanel><PageEditor slug={slug} /></AdminPanel>`
- `PageEditor` is a standalone exported component — consumer wraps it in AdminPanel (same pattern as PageManager)
- `PageManager` gets two access points: page name becomes a link AND an Edit button added to the Actions column
- Links point to `/admin/pages/[slug]` — the `/pages/` namespace leaves room for `/admin/data/[slug]` etc. in future
- Browser back from the editor returns to `/admin` (standard Next.js App Router behavior)
- Editor renders inside the same AdminPanel shell — nav bar stays visible

### Page Editor Header
- Header layout: `← Pages` link on the left, page name in the center, save status on the right
- No Publish button in Phase 6 — that comes in Phase 7

### Canvas Layout (Notion-Style)
- No block type labels on cards — fields mirror the output content directly
- Drag handle (⠿) and delete button appear on hover, hidden at rest
- Each block's fields are always visible inline (no click-to-expand)
- Empty canvas state: centered prompt "No blocks yet — click + to add your first block" with a visible + button

### Add Block UX
- Floating `+` button appears between every block and after the last block
- Clicking `+` opens a dropdown list of all 5 block types: Title, Text, Image, Video, Gallery
- New block inserts at the clicked position (not always at the bottom)
- New block appears immediately with fields open and ready to edit (no extra click)

### Delete Block UX
- Delete button on each block card (visible on hover)
- Clicking Delete is immediate on the canvas (block disappears)
- Firestore write is **deferred** — the delete is held for a 5-second undo window before writing to Firestore
- If admin clicks Undo within 5 seconds: block is re-inserted at its original position, no Firestore write
- After 5 seconds: `saveDraft` fires with the updated blocks array

### Block Editor Forms (per type)
- **Title:** `contenteditable`-style input rendered at the actual heading font size on the canvas (h2 looks big, h3 smaller). Heading level selector (h2–h6 dropdown) appears nearby.
- **Text (RichText):** Tiptap WYSIWYG editor with `@tiptap/starter-kit` (bold, italic, lists, links, headings). Outputs raw HTML stored in `data.html` — matches the existing `RichText.js` front-end schema.
- **Image:** URL text input + alt text input. Once a URL is entered, the actual image renders on the canvas (WYSIWYG). Alt text field remains accessible below.
- **Video:** Embed URL input only (YouTube, Vimeo, Loom). `toEmbedUrl()` in `Video.js` handles conversion. No file upload — that's Phase 9.
- **Gallery:** A list of items, each with a URL input + alt text input. `+ Add image` button appends a new item. Each item has a remove button.

### Tiptap Bundling
- `@tiptap/react` and `@tiptap/starter-kit` are **bundled** into the admin entry (not peer deps)
- Reasoning: consumers won't have Tiptap installed; it has no singleton issues; it's admin-only so front-end bundle is unaffected
- Core open-source extensions only — no Tiptap Pro

### Block IDs and Ordering
- Each block has a `block.id` field set to `crypto.randomUUID()` at creation time
- Array order in `draft.blocks` defines display order
- Drag-to-reorder updates the array and triggers auto-save

### Auto-save
- Trigger: debounced, 1 second after the last change to any block field
- Each block manages its own debounce timer; the whole `draft.blocks` array is written on each save
- Save writes to `draft.blocks` only via the existing `saveDraft(db, slug, blocks)` helper
- Status indicator: subtle text near the top of the editor — "Saving..." while in-flight, "Saved" after success
- On error: "Save failed. Retry?" with a Retry button near the status indicator

### Back Navigation
- If the debounce timer is still pending (admin typed and immediately clicked ← Pages), show a "You have unsaved changes" warning before navigating
- If nothing is pending, navigate immediately

### Claude's Discretion
- Exact CSS for block cards, drag handles, dropdown, and canvas layout (Phase 8 handles full CSS — Phase 6 uses minimal inline styles sufficient for function)
- Specific dropdown open/close implementation for the + block picker
- Exact Framer Motion drag props for reorder (constraint axis, drag handle selector, animation spring)
- Error boundary or fallback for failed image URLs in the Image block editor preview

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/REQUIREMENTS.md` §Block Editor — EDIT-01 through EDIT-06 (all Phase 6 requirements)

### Block system
- `src/blocks/index.js` — BLOCK_REGISTRY (exact type strings: `title`, `paragraph`, `richtext`, `image`, `video`, `gallery`), Block wrapper, Blocks renderer
- `src/blocks/Title.js` — Title component field structure: `data.level` (h2–h6), `data.text`
- `src/blocks/RichText.js` — RichText component reads `data.html` — editor must write this field
- `src/blocks/Image.js` — Image component reads `data.src`, `data.alt`, `data.caption`
- `src/blocks/Video.js` — Video component + `toEmbedUrl()` export; reads `data.url` or `data.src`
- `src/blocks/Gallery.js` — Gallery component reads `data.items` array of `{ src, alt }`

### Firestore helpers
- `src/firebase/firestore.js` — `saveDraft(db, slug, blocks)` for auto-save writes; `getPage(db, slug)` for loading draft blocks on editor open

### Admin shell
- `src/admin/index.js` — `AdminPanel` shell; `PageEditor` will be added to exports alongside `AdminPanel`
- `src/admin/PageManager.js` — Existing page list; needs Edit button added to Actions column + page name turned into a link

### Established admin patterns (read before building)
- `src/admin/CreatePageModal.js` — Focus management, focus trap, Escape-to-close pattern
- `src/admin/PageManager.js` — Live region announcements, inline error pattern, debounce pattern

### State decisions
- `.planning/STATE.md` §Block Type Decisions — ParagraphBlock dropped; RichText display name is "Text"; block types are `title`, `richtext`, `image`, `video`, `gallery`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/firebase/firestore.js` (`saveDraft`) — Drop-in auto-save helper; writes entire `draft.blocks` array in one `updateDoc` call. Phase 6 calls this after each debounced change.
- `src/firebase/firestore.js` (`getPage`) — Loads the full page document including `draft.blocks` for the editor's initial state.
- `src/admin/CreatePageModal.js` — Focus trap + Escape close + `triggerRef` focus-return pattern. Reuse for any modal-style overlays in Phase 6 (e.g., the "unsaved changes" warning).
- `src/admin/PageManager.js` (`announcement` + live region) — ARIA live region pattern for status announcements. Reuse for "Saved" and "Save failed" announcements.
- `src/blocks/Video.js` (`toEmbedUrl`) — Exported utility to convert YouTube/Vimeo/Loom URLs to embed src. Call this when admin enters a video URL in the editor.

### Established Patterns
- JavaScript only — no TypeScript for v1
- `"use client"` at the top of each admin component file
- Minimal inline styles for Phase 6; full CSS under `.jeeby-cms-admin` deferred to Phase 8
- Error handling: helpers throw, callers use try/catch
- Firebase is a peer dep — import from `firebase/firestore`, never bundle
- `getFirebaseInstances()` available for Firebase without prop drilling; `useCMSFirebase()` in React components
- Debounce via `useRef` + `clearTimeout` (see `PageManager.js` and `CreatePageModal.js`)
- Focus management: `useRef` + `requestAnimationFrame` for focus-return after state changes

### Integration Points
- `src/admin/index.js` — Add `PageEditor` as a named export alongside `AdminPanel`
- `src/admin/PageManager.js` — Add Edit button to Actions column; make page name a link to `/admin/pages/[slug]`
- `src/firebase/firestore.js` — No new helpers needed for Phase 6 (`saveDraft` and `getPage` cover auto-save and load)
- Framer Motion — Already a peer dep. Use `Reorder.Group` + `Reorder.Item` from `framer-motion/dist/framer-motion` for drag-to-reorder
- Tiptap — Bundle `@tiptap/react` + `@tiptap/starter-kit` in the admin TSUP entry. Add to `devDependencies` (not peer deps) in `package.json`.

</code_context>

<specifics>
## Specific Ideas

- Notion-style canvas: fields mirror the actual rendered output — no separate "form vs preview" modes. Title inputs render at heading size, RichText shows formatted text, Image shows the actual image.
- The `/admin/pages/` route namespace was chosen intentionally to leave room for `/admin/data/[type]/[slug]` style routes for future data taxonomy management.
- Deferred delete (5s undo window before Firestore write) is the user's preference — simpler than immediate write + undo re-add.

</specifics>

<deferred>
## Deferred Ideas

- Firebase Storage file upload for Image, Video, Gallery — Phase 9 (MEDIA-01 through MEDIA-04)
- Inline formatting (bold/italic) within Title block — noted as stretch goal, deferred post-Phase 6
- Publish button in the page editor header — Phase 7

</deferred>

---

*Phase: 06-block-editor*
*Context gathered: 2026-03-18*
