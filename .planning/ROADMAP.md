# Roadmap: jeeby-cms

**Milestone:** v1.0 — Publishable npm package
**Requirements:** 43 v1 requirements across 10 phases

---

## Phase 1: Package Scaffolding

**Goal:** A working TSUP build pipeline with stub exports, validating that tree-shaking and dual-entry bundling work before any real code is written.

**Requirements:** PKG-01, PKG-02, PKG-03, PKG-04

**Plans:** 3/3 plans executed

Plans:
- [x] 01-01-PLAN.md — Package foundation (package.json, tsup.config.js, source stubs, CSS stub)
- [x] 01-02-PLAN.md — Validation infrastructure (scripts/verify-exports.js)
- [x] 01-03-PLAN.md — Build execution and full verification

**Success Criteria:**
1. `npm run build` produces `dist/index.mjs`, `dist/index.js`, `dist/admin.mjs`, `dist/admin.js`, and `dist/styles.css`
2. Consumer can `import { CMSProvider } from 'jeeby-cms'` and `import { AdminPanel } from 'jeeby-cms/admin'` without errors
3. Firebase, React, Next.js, and Framer Motion are listed as peerDependencies (not in dependencies)
4. Tree-shaking: importing from `jeeby-cms` does not pull in admin bundle, and vice versa

---

## Phase 2: Firebase Layer

**Goal:** All Firebase interactions (auth, Firestore CRUD, Storage uploads) are encapsulated in composable helpers that the rest of the package can use.

**Requirements:** FIRE-01, FIRE-02, FIRE-03, FIRE-04

**Plans:** 5/5 plans complete

Plans:
- [x] 02-01-PLAN.md — Wave 0: Test stubs for all Firebase helper modules
- [x] 02-02-PLAN.md — Firebase init (src/firebase/init.js) + CMSProvider upgrade with React context
- [ ] 02-03-PLAN.md — Firestore CRUD helpers (src/firebase/firestore.js)
- [ ] 02-04-PLAN.md — Auth helpers (src/firebase/auth.js) + useAuth hook in src/index.js
- [ ] 02-05-PLAN.md — Storage helpers (src/firebase/storage.js) + withCMSAuth middleware + firebase-admin wiring

**Success Criteria:**
1. `CMSProvider` can initialize Firebase without errors when passed a valid config, and does not double-initialize if Firebase is already running
2. Firestore helpers can create, read, update, and delete a page document with draft/published structure
3. Firebase Auth sign-in and sign-out functions work and return the expected user state
4. Storage upload helper returns a public download URL after a successful upload

---

## Phase 3: Front-End Block System

**Goal:** A consumer can fetch published CMS content and render all supported block types on a Next.js page using server or client rendering.

**Requirements:** FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06, FRONT-07, FRONT-08, FRONT-09, FRONT-10

**Plans:** 6/6 plans complete

Plans:
- [x] 03-01-PLAN.md — Wave 1: JSX transform + all test stubs (build infra + Nyquist scaffolding)
- [ ] 03-02-PLAN.md — Wave 2: getCMSContent (Admin SDK) + useCMSContent hook + CMSProvider JSX conversion
- [ ] 03-03-PLAN.md — Wave 2: Title, Paragraph, RichText block components (text blocks + sanitization)
- [x] 03-04-PLAN.md — Wave 2: Image, Video, Gallery block components (media blocks + URL parsing)
- [ ] 03-05-PLAN.md — Wave 3: Block system assembly (Blocks + Block + BLOCK_REGISTRY + export wiring)

**Success Criteria:**
1. `getCMSContent('about')` returns published blocks for a page with slug "about" from Firestore
2. `<Blocks data={content} />` renders each block type without errors given valid block data
3. `<Block>` applies max-width and vertical spacing via CSS custom properties; accepts `className` prop
4. All 6 block types (Title, Paragraph, RichText, Image, Video, Gallery) render their content visually
5. `useCMSContent(slug)` updates the rendered output in real-time when Firestore data changes

---

## Phase 4: Admin Auth

**Goal:** The admin panel is gated behind Firebase Auth — unauthenticated users see the login page, authenticated users see the admin shell.

**Requirements:** AUTH-01, AUTH-02, AUTH-03

**Plans:** 2/2 plans complete

Plans:
- [ ] 04-01-PLAN.md — useAuth cookie lifecycle (__session write/clear in onAuthStateChanged)
- [ ] 04-02-PLAN.md — LoginPage, AdminNav, AdminPanel auth gate + tests + visual verification

**Success Criteria:**
1. Visiting `/admin` without a session shows `LoginPage` with email/password form
2. Successful login transitions to the admin shell (authenticated view)
3. `withCMSAuth` middleware redirects unauthenticated requests from `/admin/*` routes
4. `useAuth` hook returns the current user object and a working sign-out function

---

## Phase 5: Page Manager

**Goal:** Admins can create, list, rename, and delete CMS pages, with slug validation against developer-registered templates.

**Requirements:** PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06

**Plans:** 3/3 plans complete

Plans:
- [ ] 05-01-PLAN.md — Data layer: listPages, renamePage, validateSlug + CMSProvider templates prop
- [ ] 05-02-PLAN.md — PageManager component (table, inline edit, empty state) + AdminPanel wiring
- [ ] 05-03-PLAN.md — CreatePageModal + DeletePageModal + integration into PageManager

**Success Criteria:**
1. Page Manager lists all pages in Firestore with slug and last published date
2. Admin can create a new page by entering a slug and selecting a template; page appears in the list
3. Slug is rejected if it doesn't match the selected template's pattern (e.g. `/blog/[slug]`)
4. Admin can rename a page slug and the change persists in Firestore
5. Admin can delete a page and it is removed from the list
6. Developer can register templates via `CMSProvider` prop and they appear in the create-page dropdown

---

## Phase 6: Block Editor

**Goal:** Admins can add, edit, reorder, and delete blocks on a page canvas, with all changes auto-saved to Firestore.

**Requirements:** EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06

**Success Criteria:**
1. Page Editor renders existing draft blocks from Firestore in a vertical canvas
2. Admin can add a block of any supported type via BlockToolbar; new block appears at the bottom
3. Admin can drag blocks to reorder them; new order persists in Firestore after drop
4. Admin can delete a block; it disappears and Firestore is updated
5. Editing a block field triggers a Firestore write within 1 second (auto-save)
6. Each block type has its own editor form with the correct fields

---

## Phase 7: Draft / Publish

**Goal:** The live site always serves published content, and admins have explicit control over when changes go live.

**Requirements:** PUB-01, PUB-02, PUB-03

**Success Criteria:**
1. `PublishBar` displays the last published timestamp and an indicator when draft differs from published
2. Clicking "Publish" copies `draft.blocks` to `published.blocks` and updates `lastPublishedAt`
3. Front-end `getCMSContent` and `useCMSContent` return `published.blocks` only — draft changes do not appear on the live site until publish

---

## Phase 8: CSS & Theming

**Goal:** The package ships a self-contained CSS file that styles the admin UI without leaking opinions onto the consumer's content.

**Requirements:** CSS-01, CSS-02, CSS-03, CSS-04

**Success Criteria:**
1. `dist/styles.css` is produced by the build and importable via `jeeby-cms/dist/styles.css`
2. All admin panel UI elements are visually styled and scoped under `.jeeby-cms-admin` (no style leaks to consumer pages)
3. Content blocks have no hardcoded colors, fonts, or visual styles — they inherit from the consumer's site
4. Changing `--jeeby-cms-max-width` or `--jeeby-cms-block-spacing` in the consumer's CSS visibly affects block layout
5. Block components accept and apply a `className` prop from the consumer

---

## Phase 9: Media Handling

**Goal:** Video, Image, and Gallery blocks support both Firebase Storage uploads and external embed/URL inputs, with a functional upload progress UI.

**Requirements:** MEDIA-01, MEDIA-02, MEDIA-03, MEDIA-04

**Success Criteria:**
1. Video editor generates a valid iframe `src` from a YouTube, Vimeo, or Loom URL pasted by the admin
2. Video editor uploads a file to Firebase Storage and stores the resulting URL in the block data
3. Gallery editor allows adding items via Storage upload or external URL; items appear in the gallery canvas
4. Image editor supports Storage upload and external URL, storing the result in `data.src`
5. Upload progress is visible in the UI during Firebase Storage uploads

---

## Phase 10: Polish & Publish

**Goal:** The package is ready for public release on npm with complete documentation and verified consumer integration.

**Requirements:** PKG-01 (publish verification)

**README sections to complete** (foundation started in phase 4):
- Block editor usage and block types reference
- Draft/publish workflow
- Configuration options reference
- Theming and CSS customisation
- Media upload usage
- Firestore data structure reference
- Troubleshooting / common errors

**Success Criteria:**
1. README documents installation, CMSProvider setup, page rendering, admin panel setup, and configuration options
2. `npm publish --dry-run` shows only `dist/` files and no source files
3. Package installs cleanly in a fresh Next.js App Router project with no peer dependency conflicts
4. A test page renders CMS content and the admin panel functions end-to-end in the consumer project
5. Peer dependency warnings appear correctly if required packages are missing

---

## Requirement Coverage

| Phase | Requirements | Count |
|-------|-------------|-------|
| 1 | PKG-01, PKG-02, PKG-03, PKG-04 | 4 | 2/2 | Complete   | 2026-03-18 | 4 |
| 3 | FRONT-01 through FRONT-10 | 10 |
| 4 | AUTH-01, AUTH-02, AUTH-03 | 3 |
| 5 | 3/3 | Complete   | 2026-03-18 | 6 | EDIT-01–06 | 6 |
| 7 | PUB-01, PUB-02, PUB-03 | 3 |
| 8 | CSS-01–04 | 4 |
| 9 | MEDIA-01–04 | 4 |
| 10 | Polish/publish | — |
| **Total** | | **44** |

---
*Roadmap created: 2026-03-10*
*Phase 1 plans added: 2026-03-10*
*Phase 2 plans added: 2026-03-10*
*Phase 3 plans added: 2026-03-11*
*Phase 4 plans added: 2026-03-17*
*Phase 5 plans added: 2026-03-18*
