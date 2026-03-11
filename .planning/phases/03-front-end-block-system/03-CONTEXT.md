# Phase 3: Front-End Block System - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Consumer-facing functions and components for fetching and rendering CMS content. This phase delivers: `getCMSContent` (server), `useCMSContent` (client, real-time), `<Blocks>`, `<Block>`, and 6 block components (Title, Paragraph, RichText, Image, Video, Gallery). Does NOT include admin UI, block editing, drag-and-drop, or draft preview — those are phases 6+.

</domain>

<decisions>
## Implementation Decisions

### JSX Transform
- Add JSX transform to TSUP via esbuildOptions (esbuild supports JSX natively)
- Use **automatic runtime** — no `import React` needed in component files
- Enable project-wide for all `.js` files in `src/`
- Convert existing `React.createElement` calls in `src/index.js` to JSX syntax for consistency

### Block File Structure
- Block components live in `src/blocks/` — one file per block type: `Title.js`, `Paragraph.js`, `RichText.js`, `Image.js`, `Video.js`, `Gallery.js`
- `<Blocks>` and `<Block>` wrapper live in `src/blocks/index.js`, re-exported from `src/index.js`
- `<Blocks>` uses a static `BLOCK_REGISTRY` object mapping type strings to components
- `<Blocks>` accepts a `components` prop to merge custom block types with built-in registry: `<Blocks data={...} components={{ myBlock: MyBlock }} />` — designed for extensibility without a breaking change
- Unknown block types: silently skip (render nothing)

### RichText Sanitization
- Use **isomorphic-dompurify** (works server-side and client-side)
- Add as a peer dependency (not bundled)
- `<RichText>` renders sanitized HTML via `dangerouslySetInnerHTML` inside a `<div className={className}>`
- Consumer wraps `<Blocks>` in their own semantic element (`<article>`, `<main>`, etc.)

### Gallery Layout
- **CSS Grid only** for Phase 3 — responsive auto-fill columns
- Column count controlled via CSS custom property: `--jeeby-cms-gallery-columns` (consistent with existing CSS custom property strategy)
- No lightbox — deferred to future phase
- Carousel as a stretch goal — noted for deferred ideas

### getCMSContent (server)
- Uses **Firebase Admin SDK** (`src/firebase/admin.js`) — no React context, no consumer config needed
- Returns **full page document**: `{ title, subtitle, headerImage, blocks, lastPublishedAt, ... }` from `published.*`
- Returns `null` if page doesn't exist
- Published content only — no draft parameter

### Title Block
- Heading level stored in **Firestore block data**: `block.data.level` (e.g. `'h3'`)
- Inside `<Blocks>`, level is **restricted to h2–h6** — h1 is reserved for the page-level `title` field
- Blocks that specify `level='h1'` fall back to `h2`
- Default heading level: **h3** (leaves room for h1=page title, h2=section heading in consumer layout)

### Video Block
- `<Video>` transforms raw URLs to iframe src **on render** (YouTube, Vimeo, Loom detection)
- Firebase Storage videos: use **Video.js** as optional peer dependency
- Video.js for storage videos only — YouTube/Vimeo iframes rendered natively
- If Video.js is not installed: fall back to native `<video>` element, emit a `console.warn` recommending installation, throw an error if consumer passes Video.js-specific props

### useCMSContent Hook
- Listens to **published.blocks only** — no draft preview from public hook
- Returns `{ data, loading, error }` — `data` is the full page document or `null` if page doesn't exist
- `null` return lets consumers handle their own 404 rendering

### Claude's Discretion
- Exact esbuildOptions config for JSX transform in tsup.config.js
- Internal URL parsing logic for YouTube/Vimeo/Loom detection in `<Video>`
- isomorphic-dompurify integration details
- Image block alt text fallback behavior (empty alt or aria-hidden when no alt provided)
- Paragraph block wrapping element (likely `<p>`)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/firebase/firestore.js` — `getPage(db, slug)` returns full page document; use this via Admin SDK path for `getCMSContent`
- `src/firebase/admin.js` — `getAdminAuth()` pattern shows Admin SDK init; similar pattern needed for Admin Firestore
- `useCMSFirebase()` hook — gives access to `{ db, auth, storage }` for `useCMSContent` real-time listener
- `src/index.js` stubs — `Blocks`, `Block`, `useCMSContent` stubs already exported; replace implementations in place

### Established Patterns
- No JSX transform currently — Phase 3 adds it (first use of JSX in codebase)
- `React.createElement` in `src/index.js` — to be converted to JSX during this phase
- CSS custom properties: `--jeeby-cms-max-width`, `--jeeby-cms-block-spacing` — extend with `--jeeby-cms-gallery-columns`
- Peer deps for external libraries (Firebase, Framer Motion) — same pattern for Video.js and isomorphic-dompurify
- TSUP array config with 3 entries — admin entry may need Video.js added to `external`

### Integration Points
- `src/server/index.js` — `getCMSContent` stub lives here; implement using Admin Firestore
- `src/index.js` — `Blocks`, `Block`, `useCMSContent` stubs; update imports to pull from `src/blocks/`
- `tsup.config.js` — needs `esbuildOptions` for JSX transform and new peer deps in `external` arrays
- `package.json` — add `isomorphic-dompurify` and `video.js` to `peerDependencies` (both optional)

</code_context>

<specifics>
## Specific Ideas

- Page document structure vision: `{ title, subtitle, headerImage: { src, width, height }, blocks: [...] }` — `getCMSContent` returns this full shape; page-level fields (title, subtitle, headerImage) are editable via Phase 5 (Page Manager)
- The `components` prop on `<Blocks>` is designed for v1 extensibility so custom blocks don't require a breaking change when CBLK-01 (custom block registration) ships in v2
- Video.js chosen for Firebase Storage video to enable future: background video mode, admin-configurable controls

</specifics>

<deferred>
## Deferred Ideas

- Gallery carousel layout — noted as stretch goal; could be a `layout='carousel'` prop in a future phase
- Gallery lightbox / click-to-expand — future phase (complex modal interaction)
- `jeeby-cms/blocks` as a separate entry point to make Video.js peer dep explicit — explore in Phase 9 (Media Handling) or Polish phase
- Background video mode for `<Video>` — future enhancement
- Admin-configurable Video.js controls — future enhancement (Phase 6 Block Editor)
- Page-level metadata admin UI (title, subtitle, headerImage fields editable in admin) — Phase 5 (Page Manager)

</deferred>

---

*Phase: 03-front-end-block-system*
*Context gathered: 2026-03-11*
