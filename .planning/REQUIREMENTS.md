# Requirements: jeeby-cms

**Defined:** 2026-03-10
**Core Value:** Developers can drop a fully functional CMS into any Next.js project in minutes, with zero lock-in to a specific design system

## v1 Requirements

### Package Setup

- [x] **PKG-01**: Package is installable via `npm install jeeby-cms` and exports `jeeby-cms` and `jeeby-cms/admin` entry points
- [x] **PKG-02**: TSUP builds ESM and CJS outputs for both entry points with tree-shaking
- [x] **PKG-03**: `dist/styles.css` is exported and importable by consumers
- [x] **PKG-04**: Firebase, React, Next.js, and Framer Motion are peer dependencies (not bundled)

### Firebase Layer

- [x] **FIRE-01**: `CMSProvider` initializes Firebase client SDK safely (handles multi-init via `getApps()` check)
- [ ] **FIRE-02**: Firestore CRUD helpers support reading and writing pages with draft/published blocks
- [ ] **FIRE-03**: Firebase Auth supports email/password sign-in and sign-out
- [ ] **FIRE-04**: Firebase Storage upload helper supports file upload with progress tracking

### Front-End Block System

- [x] **FRONT-01**: `getCMSContent(slug)` fetches published page content for use in Server Components
- [x] **FRONT-02**: `useCMSContent(slug)` provides real-time Firestore listener for Client Components
- [x] **FRONT-03**: `<Blocks>` component renders an array of block objects into the correct block components
- [x] **FRONT-04**: `<Block>` wrapper applies max-width, vertical spacing, and optional anchor id via CSS custom properties
- [x] **FRONT-05**: `<Title>` block renders text with configurable heading level (h1–h6)
- [x] **FRONT-06**: `<Paragraph>` block renders plain text
- [x] **FRONT-07**: `<RichText>` block renders sanitized HTML
- [x] **FRONT-08**: `<Image>` block renders an image from Firebase Storage URL or external URL with alt and caption
- [x] **FRONT-09**: `<Video>` block renders an embedded iframe (YouTube, Vimeo, Loom) or a Firebase Storage video
- [x] **FRONT-10**: `<Gallery>` block renders a collection of images in grid or masonry layout

### Admin Auth

- [x] **AUTH-01**: Admin panel shows `LoginPage` (email/password) when user is unauthenticated
- [x] **AUTH-02**: `withCMSAuth` middleware helper redirects unauthenticated requests away from `/admin/*`
- [x] **AUTH-03**: `useAuth` hook exposes current user and sign-out function to admin components

### Page Manager

- [x] **PAGE-01**: Admin can view a list of all CMS pages with their slugs and last published date
- [x] **PAGE-02**: Admin can create a new page by entering a slug and selecting a template
- [x] **PAGE-03**: Admin can delete a page
- [x] **PAGE-04**: Admin can rename a page slug
- [x] **PAGE-05**: Slug is validated against the selected template pattern before saving
- [x] **PAGE-06**: Developer can register available templates in config (`jeeby.config.js` or `CMSProvider` prop)

### Block Editor

- [x] **EDIT-01**: Admin can view and edit blocks on a page in a drag-and-drop canvas
- [x] **EDIT-02**: Admin can add a new block of any supported type via `BlockToolbar`
- [x] **EDIT-03**: Admin can reorder blocks via drag-and-drop (Framer Motion)
- [x] **EDIT-04**: Admin can delete a block
- [x] **EDIT-05**: Block edits auto-save to Firestore `draft.blocks` on change
- [x] **EDIT-06**: Each block type has its own editor form (Title, Paragraph, RichText, Image, Video, Gallery)

### Draft / Publish

- [x] **PUB-01**: `PublishBar` shows last published date and unsaved indicator
- [x] **PUB-02**: Admin can publish a page (copies `draft` → `published`, updates `lastPublishedAt`)
- [ ] **PUB-03**: Front-end always reads from `published.blocks`; live site is unaffected until publish

### Media Handling

- [x] **MEDIA-01**: Video editor supports embed URL input (YouTube, Vimeo, Loom) and generates iframe src
- [ ] **MEDIA-02**: Video editor supports Firebase Storage file upload
- [ ] **MEDIA-03**: Gallery editor supports adding items via Firebase Storage upload or external URL paste
- [x] **MEDIA-04**: Image editor supports Firebase Storage upload or external URL

### CSS & Theming

- [x] **CSS-01**: Admin panel UI styles are scoped under `.jeeby-cms-admin`
- [x] **CSS-02**: CSS custom properties `--jeeby-cms-max-width` and `--jeeby-cms-block-spacing` are exposed for consumer override
- [x] **CSS-03**: Block components accept `className` prop for consumer-applied styles
- [x] **CSS-04**: No color, typography, or visual opinions are applied to content blocks

## v2 Requirements

### User Roles

- **ROLE-01**: Admin can assign editor role (limited permissions) vs admin role

### Advanced Editing

- **ADV-01**: Admin can revert draft to last published state
- **ADV-02**: Admin can preview published version inside admin panel
- **ADV-03**: Per-block `draft: true` toggle to hide individual blocks from published view

### Custom Blocks

- **CBLK-01**: Developer can register custom block types via `registerBlock(type, component, editorComponent)`

### Infrastructure

- **INFRA-01**: Subcollection fallback for pages exceeding Firestore 1MB document limit
- **INFRA-02**: Webhook fires on publish to notify external services
- **INFRA-03**: Publish history / versioning

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Not planned for v1 |
| Mobile app | Web-first; mobile later |
| TypeScript types | Post-v1 addition |
| OAuth / social login | Email/password sufficient for v1 |
| Multi-tenant / SaaS hosting | Self-hosted only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 1 | Complete |
| PKG-02 | Phase 1 | Complete |
| PKG-03 | Phase 1 | Complete |
| PKG-04 | Phase 1 | Complete |
| FIRE-01 | Phase 2 | Complete |
| FIRE-02 | Phase 2 | Pending |
| FIRE-03 | Phase 2 | Pending |
| FIRE-04 | Phase 2 | Pending |
| FRONT-01 | Phase 3 | Complete |
| FRONT-02 | Phase 3 | Complete |
| FRONT-03 | Phase 3 | Complete |
| FRONT-04 | Phase 3 | Complete |
| FRONT-05 | Phase 3 | Complete |
| FRONT-06 | Phase 3 | Complete |
| FRONT-07 | Phase 3 | Complete |
| FRONT-08 | Phase 3 | Complete |
| FRONT-09 | Phase 3 | Complete |
| FRONT-10 | Phase 3 | Complete |
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | Complete |
| AUTH-03 | Phase 4 | Complete |
| PAGE-01 | Phase 5 | Complete |
| PAGE-02 | Phase 5 | Complete |
| PAGE-03 | Phase 5 | Complete |
| PAGE-04 | Phase 5 | Complete |
| PAGE-05 | Phase 5 | Complete |
| PAGE-06 | Phase 5 | Complete |
| EDIT-01 | Phase 6 | Complete |
| EDIT-02 | Phase 6 | Complete |
| EDIT-03 | Phase 6 | Complete |
| EDIT-04 | Phase 6 | Complete |
| EDIT-05 | Phase 6 | Complete |
| EDIT-06 | Phase 6 | Complete |
| PUB-01 | Phase 7 | Complete |
| PUB-02 | Phase 7 | Complete |
| PUB-03 | Phase 7 | Pending |
| CSS-01 | Phase 8 | Complete |
| CSS-02 | Phase 8 | Complete |
| CSS-03 | Phase 8 | Complete |
| CSS-04 | Phase 8 | Complete |
| MEDIA-01 | Phase 9 | Complete |
| MEDIA-02 | Phase 9 | Pending |
| MEDIA-03 | Phase 9 | Pending |
| MEDIA-04 | Phase 9 | Complete |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition from PLANNING.md*
