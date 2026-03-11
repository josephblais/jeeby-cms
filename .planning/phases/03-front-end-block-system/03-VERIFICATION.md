---
phase: 03-front-end-block-system
verified: 2026-03-11T07:30:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 3: Front-End Block System Verification Report

**Phase Goal:** A consumer can fetch published CMS content and render all supported block types on a Next.js page using server or client rendering.
**Verified:** 2026-03-11T07:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1 | `getCMSContent('about')` returns published blocks for a page from Firestore | VERIFIED | `src/server/index.js` queries `db.doc('cms/pages/' + slug).get()`, returns `pageData?.published ?? null`; 3 tests pass including null-return and published-return cases |
| 2 | `<Blocks data={content} />` renders each block type without errors given valid block data | VERIFIED | `src/blocks/index.js` BLOCK_REGISTRY maps all 6 types; `Blocks` maps block array to `Block`-wrapped components; 6 index tests pass |
| 3 | `<Block>` applies `jeeby-cms-block` class; accepts `id` and `className` props | VERIFIED | `src/blocks/index.js` Block function: `className: ['jeeby-cms-block', className].filter(Boolean).join(' ')` and `id` passed through; 3 Block tests pass |
| 4 | All 6 block types (Title, Paragraph, RichText, Image, Video, Gallery) render their content | VERIFIED | All 6 component files exist with full implementations; 64 tests pass (0 skips, 0 failures) covering heading levels, p-tag, HTML sanitization, alt text, iframe title, ul/li gallery |
| 5 | `useCMSContent(slug)` sets up real-time Firestore listener returning `{ data, loading, error }` | VERIFIED | `src/index.js` exports `useCMSContent` using `onSnapshot`, reading `published` sub-object only; hook shape verified by index.test.js |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/server/index.js` | `getCMSContent(slug)` — async fn returning published data or null | VERIFIED | Full implementation; uses `getAdminFirestore()`; snap.exists (property, not method) |
| `src/firebase/admin.js` | Exports `getAdminFirestore()` alongside `getAdminAuth()` | VERIFIED | Both exports present; `getFirestore(getAdminApp())` pattern |
| `src/index.js` | `useCMSContent` hook + re-exports `Blocks` and `Block` | VERIFIED | `onSnapshot` implementation present; `export { Blocks, Block } from './blocks/index.js'` |
| `src/blocks/Title.js` | Named export `Title` — h2-h6 with h1 clamped to h2 | VERIFIED | `VALID_LEVELS`, `normalizeLevel`, `createElement` — 6 tests pass |
| `src/blocks/Paragraph.js` | Named export `Paragraph` — wraps text in `<p>` | VERIFIED | `createElement('p', ...)` — 3 tests pass |
| `src/blocks/RichText.js` | Named export `RichText` — sanitized HTML via isomorphic-dompurify | VERIFIED | `DOMPurify.sanitize` with `ADD_ATTR` for aria-* attributes — 6 tests pass |
| `src/blocks/Image.js` | Named export `Image` — alt fallback, figure/figcaption | VERIFIED | `alt: data?.alt ?? ''`, caption triggers figure/figcaption — 5 tests pass |
| `src/blocks/Video.js` | Named exports `Video` and `toEmbedUrl` — iframe with title, URL parsing | VERIFIED | YouTube/Vimeo/Loom regex parsing; `title={data?.title \|\| 'Embedded video'}` — 7 tests pass |
| `src/blocks/Gallery.js` | Named export `Gallery` — `<ul>` with `aria-label="Gallery"`, per-item alt | VERIFIED | `aria-label="Gallery"`, `alt: item.alt ?? ''`, figcaption on caption — 6 tests pass |
| `src/blocks/index.js` | Exports `Blocks`, `Block`, `BLOCK_REGISTRY` | VERIFIED | All 3 exported; BLOCK_REGISTRY maps all 6 type strings — 6 tests pass |
| `tsup.config.js` | JSX transform on entries 1 and 2 | VERIFIED | `loader: { '.js': 'jsx' }` and `esbuildOptions({ jsx: 'automatic' })` on entries 1 and 2 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/server/index.js getCMSContent` | `firebase-admin/firestore` | `getAdminFirestore() → db.doc(...).get()` | WIRED | Line 9: `db.doc('cms/pages/' + slug).get()` |
| `getCMSContent` | `published` sub-object only | `pageData?.published ?? null` | WIRED | Line 15 returns published only, never draft |
| `src/index.js useCMSContent` | `firebase/firestore onSnapshot` | `doc(db, 'cms', 'pages', slug) → onSnapshot` | WIRED | Line 63: `onSnapshot(ref, ...)` |
| `useCMSContent snap callback` | `published` sub-object only | `snap.data()?.published ?? null` | WIRED | Line 68: `setData(snap.exists() ? snap.data()?.published ?? null : null)` |
| `src/index.js Blocks/Block` | `src/blocks/index.js` | `export { Blocks, Block } from './blocks/index.js'` | WIRED | Line 82: exact re-export pattern from plan |
| `Blocks component` | `BLOCK_REGISTRY` | `const registry = components ? { ...BLOCK_REGISTRY, ...components } : BLOCK_REGISTRY` | WIRED | Line 50 of blocks/index.js |
| `Blocks map` | `Block wrapper` | `createElement(Block, { key, id }, createElement(Component, ...))` | WIRED | Lines 60-64 of blocks/index.js |
| `Title component` | `VALID_LEVELS` constant | `l === 'h1' ? 'h2' : (VALID_LEVELS.includes(l) ? l : 'h3')` | WIRED | Line 18: normalizeLevel used in render |
| `RichText component` | `isomorphic-dompurify` | `DOMPurify.sanitize(data?.html ?? '', DOMPURIFY_CONFIG)` | WIRED | Line 27 |
| `Video component` | `toEmbedUrl()` | `const embedUrl = toEmbedUrl(src)` | WIRED | Line 134 of Video.js |
| `Video iframe` | `title` attribute (WCAG 4.1.2) | `title={data?.title \|\| 'Embedded video'}` | WIRED | Line 97: `titleText = data?.title \|\| 'Embedded video'`; used on line 139 |
| `Gallery ul` | `aria-label` (WCAG 1.3.1) | `'aria-label': 'Gallery'` | WIRED | Line 21 of Gallery.js |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FRONT-01 | 03-01, 03-02 | `getCMSContent(slug)` fetches published page content for Server Components | SATISFIED | `src/server/index.js` implemented; 3 tests pass |
| FRONT-02 | 03-01, 03-02 | `useCMSContent(slug)` real-time Firestore listener for Client Components | SATISFIED | `src/index.js` onSnapshot hook; exported and tested |
| FRONT-03 | 03-01, 03-05 | `<Blocks>` renders array of block objects into correct components | SATISFIED | `src/blocks/index.js` Blocks renderer with BLOCK_REGISTRY; 6 tests pass |
| FRONT-04 | 03-01, 03-05 | `<Block>` wrapper applies max-width/spacing via CSS custom props and optional anchor id | SATISFIED (Phase 3 scope) | `jeeby-cms-block` class + id passthrough delivered; CSS custom property values deferred to Phase 8 per plan |
| FRONT-05 | 03-01, 03-03 | `<Title>` renders text with configurable heading level (h1–h6) | SATISFIED | Title.js with VALID_LEVELS, h1 clamped to h2; 6 tests pass |
| FRONT-06 | 03-01, 03-03 | `<Paragraph>` renders plain text | SATISFIED | Paragraph.js wraps in `<p>`; 3 tests pass |
| FRONT-07 | 03-01, 03-03 | `<RichText>` renders sanitized HTML | SATISFIED | RichText.js uses isomorphic-dompurify with ADD_ATTR; 6 tests pass |
| FRONT-08 | 03-01, 03-04 | `<Image>` renders from Firebase Storage or external URL with alt and caption | SATISFIED | Image.js with alt fallback, figure/figcaption; 5 tests pass |
| FRONT-09 | 03-01, 03-04 | `<Video>` renders embedded iframe (YouTube, Vimeo, Loom) or Firebase Storage video | SATISFIED | Video.js with toEmbedUrl regex parsing, iframe title; 7 tests pass |
| FRONT-10 | 03-01, 03-04 | `<Gallery>` renders collection of images in grid or masonry layout | SATISFIED | Gallery.js with ul/li, aria-label, per-item alt; 6 tests pass |

All 10 FRONT-* requirements satisfied. No orphaned requirements.

---

### Anti-Patterns Found

No blocking anti-patterns found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `dist/server.mjs` build warning | — | "getFirestore" imported from firebase-admin/firestore unused in dist/admin | Info | Rollup tree-shake warning only; no functional impact. admin.js imports getFirestore for getAdminFirestore() which is used in server/index.js (different entry). Bundler warning is expected cross-entry behavior. |
| `dist/index.mjs` build warning | — | `"use client"` directive ignored by bundler | Info | Expected behavior — the post-build script re-injects it at file start. `dist/index.mjs` starts with `"use client";` as verified. |

All `return null` occurrences in source files are legitimate guard clauses (empty src, missing blocks array, unknown block type) — not stubs.

---

### Human Verification Required

#### 1. getCMSContent in real Next.js Server Component

**Test:** In a Next.js App Router project, import `getCMSContent` from `jeeby-cms/server` in a server component. Call it with a real Firestore slug. Render the result with `<Blocks>`.
**Expected:** Page renders block content from Firestore without "use client" directive errors.
**Why human:** Requires a live Firebase Admin SDK credential and a real Next.js server environment.

#### 2. useCMSContent real-time update

**Test:** In a Next.js Client Component using `<CMSProvider>`, call `useCMSContent('some-slug')`. Update the `published.blocks` field in Firestore.
**Expected:** The rendered output updates without a page reload.
**Why human:** Requires live Firebase client SDK with an authenticated Firestore connection.

#### 3. Video.js fallback vs. installed path

**Test:** Install `video.js` as a dependency in a consuming project. Render a `<Video>` block with a Firebase Storage URL.
**Expected:** VideoJSPlayer renders with keyboard-accessible controls.
**Why human:** VideoJSPlayer uses `useRef` and `useEffect` — cannot be verified with `renderToStaticMarkup`.

---

### Build and Test Summary

- **Test suite:** 64 tests, 64 pass, 0 fail, 0 skip — exit code 0
- **Build:** `npm run build` exits 0; all 6 dist files produced (`dist/index.mjs`, `dist/index.js`, `dist/admin.mjs`, `dist/admin.js`, `dist/server.mjs`, `dist/server.js`) plus `dist/styles.css`
- **"use client" banner:** Confirmed present at line 1 of `dist/index.mjs` and `dist/index.js`
- **Notable deviation documented in summaries:** Block files use `createElement` (not JSX) so Node.js test runner can import them without a transform. TSUP still compiles with JSX enabled for the dist output.

---

_Verified: 2026-03-11T07:30:00Z_
_Verifier: Claude (gsd-verifier)_
