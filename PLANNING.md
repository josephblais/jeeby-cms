# jeeby-cms — Planning Document

## Overview

A publishable npm package (`jeeby-cms`) that provides:
- A block-based content rendering system for the front-end
- A full `/admin` CMS panel (Firebase Auth, Firestore, Storage)
- A theme-agnostic UI (inherits site styles, minimal bundled CSS)
- Drag-and-drop block reordering (Framer Motion)
- Draft/publish workflow
- Multi-page support with nested sub-routes

**Stack:** Next.js (App Router, JavaScript), Firebase (Auth + Firestore + Storage), Framer Motion, Tailwind (bundled minimal CSS only), TSUP (bundler)

---

## Architecture

### Two Entry Points

```
jeeby-cms              → frontend components (Blocks, Block, getCMSContent, CMSProvider)
jeeby-cms/admin        → admin panel (AdminPanel, withCMSAuth)
```

Tree-shaking via named exports. Both entry points bundled separately by TSUP.

### Consumer Usage

**`app/layout.js`**
```jsx
import { CMSProvider } from 'jeeby-cms'
import 'jeeby-cms/dist/styles.css'

export default function RootLayout({ children }) {
  return (
    <CMSProvider firebaseConfig={firebaseConfig}>
      {children}
    </CMSProvider>
  )
}
```

**`app/[slug]/page.js`** (or any page)
```jsx
import { Blocks } from 'jeeby-cms'
import { getCMSContent } from 'jeeby-cms'

export default async function Page({ params }) {
  const content = await getCMSContent(params.slug)
  return <Blocks data={content} />
}
```

**`app/admin/[[...slug]]/page.js`**
```jsx
import { AdminPanel } from 'jeeby-cms/admin'

export default function AdminPage() {
  return <AdminPanel />
}
```

**`middleware.js`**
```js
import { withCMSAuth } from 'jeeby-cms/admin'
export default withCMSAuth({ adminPath: '/admin' })
export const config = { matcher: ['/admin/:path*'] }
```

---

## Package File Structure

```
jeeby-cms/
├── src/
│   ├── index.js                      ← frontend entry point
│   ├── components/
│   │   ├── CMSProvider.jsx           ← "use client" — Firebase init via context
│   │   ├── Blocks.jsx                ← renders block array from CMS data
│   │   ├── Block.jsx                 ← agnostic layout wrapper (spacing, max-width)
│   │   └── blocks/
│   │       ├── Title.jsx
│   │       ├── Paragraph.jsx
│   │       ├── Video.jsx             ← embed URL or Firebase Storage upload
│   │       ├── Gallery.jsx           ← upload or URL array
│   │       ├── Image.jsx
│   │       ├── RichText.jsx
│   │       └── index.js
│   ├── firebase/
│   │   ├── init.js                   ← safe multi-init (checks existing app)
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   └── storage.js
│   ├── hooks/
│   │   └── useCMSContent.js          ← "use client" — real-time listener
│   ├── utils/
│   │   └── getCMSContent.js          ← async fetch (for server components)
│   │
│   ├── admin/
│   │   ├── index.js                  ← admin entry point
│   │   ├── AdminPanel.jsx            ← "use client" — root admin component, handles internal routing
│   │   ├── middleware.js             ← withCMSAuth helper
│   │   ├── components/
│   │   │   ├── LoginPage.jsx         ← Firebase Auth UI
│   │   │   ├── PageManager.jsx       ← list/create/delete/rename pages
│   │   │   ├── PageEditor.jsx        ← block list + drag-and-drop canvas
│   │   │   ├── BlockToolbar.jsx      ← add new block controls
│   │   │   ├── DraggableBlock.jsx    ← Framer Motion drag wrapper
│   │   │   ├── PublishBar.jsx        ← draft/publish status + publish button
│   │   │   └── blocks/              ← admin edit forms for each block type
│   │   │       ├── TitleEditor.jsx
│   │   │       ├── ParagraphEditor.jsx
│   │   │       ├── VideoEditor.jsx
│   │   │       ├── GalleryEditor.jsx
│   │   │       └── ...
│   │   └── hooks/
│   │       ├── useAuth.js
│   │       ├── usePages.js
│   │       └── useBlocks.js
│
├── styles/
│   └── cms.css                       ← pre-bundled minimal CSS (spacing, font-size, admin UI)
│
├── tsup.config.js
└── package.json
```

---

## Firestore Data Model

```
/cms/pages/{pageId}
  - id:              string
  - title:           string
  - slug:            string           ← e.g. "about", "blog/my-post"
  - template:        string           ← dev-defined route pattern e.g. "/blog/[slug]"
  - createdAt:       timestamp
  - updatedAt:       timestamp
  - lastPublishedAt: timestamp | null
  - draft: {
      blocks: Block[]
    }
  - published: {
      blocks: Block[]
    } | null
```

**Block shape:**
```json
{
  "id": "uuid",
  "type": "title" | "paragraph" | "video" | "gallery" | "image" | "richtext",
  "order": 0,
  "data": { ...block-specific fields },
  "className": ""
}
```

**Notes:**
- Firestore has a 1MB document limit per document. A page with 50 average blocks sits well under this. Edge case: Gallery blocks with hundreds of URLs may require a subcollection (noted as stretch).
- Front-end always reads from `published.blocks`. Admin reads and writes to `draft.blocks`.
- Hitting "Publish" copies `draft` → `published` and sets `lastPublishedAt`.
- A `draft: true` flag can be added per-block to hide individual blocks from the published view (stretch).

---

## Block Components

Each block component receives:
```jsx
<Title
  data={blockData}
  className="optional-dev-classname"
/>
```

Wrapped by `<Block>` which handles:
- `max-width` container
- Vertical spacing / margin
- Optional `id` anchor for in-page linking

### Initial Block Types

| Block | Data fields |
|---|---|
| `Title` | text, level (h1-h6) |
| `Paragraph` | text |
| `RichText` | html (sanitized) |
| `Image` | src (Storage URL or external), alt, caption |
| `Video` | type ("embed" or "upload"), url, storageRef |
| `Gallery` | items: [{ src, alt }], layout ("grid" or "masonry") |

---

## Admin Panel — Internal Routing

`AdminPanel` manages its own routing using URL params from the catch-all `[[...slug]]`:

| URL | View |
|---|---|
| `/admin` | Page Manager (list all pages) |
| `/admin/new` | Create page wizard |
| `/admin/edit/[pageId]` | Page Editor (block canvas) |
| `/admin/settings` | CMS settings (users, etc.) |

Auth state gates all views — unauthenticated users see `LoginPage`.

---

## Firebase Auth & Middleware

- Package ships a `LoginPage` component (email/password via Firebase Auth)
- `withCMSAuth` is a Next.js middleware helper that checks for a valid Firebase session cookie on `/admin/*` routes and redirects to `/admin/login` if absent
- Session cookies set server-side via Firebase Admin SDK (requires consumer to add Firebase Admin credentials — see Configuration below)

---

## Configuration

Consumer creates a `jeeby.config.js` (or passes inline to `CMSProvider`):

```js
// jeeby.config.js
export default {
  firebaseConfig: { apiKey: '...', ... },   // client SDK config
  firebaseAdmin: {                           // optional, enables SSR auth checks
    projectId: '...',
    clientEmail: '...',
    privateKey: '...'
  },
  adminPath: '/admin',                       // customize admin route
  mediaProvider: 'firebase',                // 'firebase' | 'custom'
}
```

---

## CSS Strategy

- TSUP bundles `styles/cms.css` as a separate file → `dist/styles.css`
- `cms.css` contains only:
  - Admin panel UI styles (scoped under `.jeeby-cms-admin`)
  - Minimal block layout helpers (max-width, vertical rhythm) using CSS custom properties
  - No color, typography, or visual opinions outside admin UI
- Consumer imports `jeeby-cms/dist/styles.css` once in their root layout
- Block components accept `className` prop — dev applies their own Tailwind or CSS
- CSS custom properties exposed for easy override:
  ```css
  :root {
    --jeeby-cms-max-width: 720px;
    --jeeby-cms-block-spacing: 2rem;
  }
  ```

---

## Build Config (TSUP)

```js
// tsup.config.js
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
    banner: { js: '"use client";' },   // only on client-only entry
    injectStyle: false,
    clean: true,
  },
  {
    entry: { admin: 'src/admin/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
  }
])
```

**Package.json exports:**
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./admin": {
      "import": "./dist/admin.mjs",
      "require": "./dist/admin.js"
    },
    "./dist/styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "sideEffects": ["dist/styles.css"]
}
```

---

## "use client" Strategy

- Components using hooks, context, or Framer Motion get `"use client"` at the top of the file
- TSUP preserves the directive when bundling
- `getCMSContent` (async fetch) is a plain async function — safe in Server Components
- `useCMSContent` (real-time Firestore listener) is client-only — marked `"use client"`
- Firebase client SDK calls are always in client components or client utilities

---

## Draft / Publish Workflow

1. Admin edits `draft.blocks` in real-time (auto-saved to Firestore on each change)
2. `PublishBar` shows: last published date, unsaved indicator, "Publish" button
3. On publish: `draft` is deep-copied to `published`, `lastPublishedAt` updated
4. Front-end always reads `published` — live site unaffected until explicitly published
5. Stretch: "Revert to published" button to reset draft to last published state

---

## Multi-page & Nested Routes

- Admin `PageManager` lists all pages with their slugs
- When creating a page, admin enters a slug (e.g. `blog/my-post`) and selects a template from a dev-defined list
- Dev registers available templates in `jeeby.config.js`:
  ```js
  templates: [
    { label: 'Default Page', pattern: '/[slug]' },
    { label: 'Blog Post', pattern: '/blog/[slug]' },
    { label: 'Case Study', pattern: '/work/[slug]' },
  ]
  ```
- Slug is validated against the template pattern before saving
- `getCMSContent(slug)` queries Firestore for `published` content matching the slug

---

## Media Handling

**Video block:**
- Tab 1: Embed URL — accepts YouTube, Vimeo, Loom, etc. — stored as `url`, rendered via `<iframe>`
- Tab 2: Upload — uploads to Firebase Storage, stores `storageRef` + public URL

**Gallery block:**
- Each item: upload to Firebase Storage or paste an external URL
- Rendered as grid or masonry layout via CSS

**Image block:**
- Same dual approach as Gallery item

---

## Phased Build Plan

### Phase 1 — Package Scaffolding
- Init repo, TSUP config, package.json exports
- Folder structure, `src/index.js` and `src/admin/index.js` entry points
- Stub exports to validate tree-shaking and bundling

### Phase 2 — Firebase Layer
- `CMSProvider` with context (client SDK init, safe multi-init)
- `firestore.js` — CRUD helpers for pages/blocks
- `auth.js` — sign in, sign out, session management
- `storage.js` — upload helper with progress

### Phase 3 — Front-End Block System
- `Block.jsx` wrapper (layout, spacing, max-width via CSS vars)
- `Blocks.jsx` renderer (maps block array → components)
- All initial block components (Title, Paragraph, RichText, Image, Video, Gallery)
- `getCMSContent(slug)` utility
- `useCMSContent(slug)` real-time hook

### Phase 4 — Admin Auth
- `LoginPage.jsx` (email/password)
- `withCMSAuth` middleware helper
- `useAuth` hook
- Auth-gated `AdminPanel` shell

### Phase 5 — Page Manager
- `PageManager.jsx` — list, create, delete, rename pages
- Template registration system
- Slug validation

### Phase 6 — Block Editor
- `PageEditor.jsx` — block canvas
- `DraggableBlock.jsx` — Framer Motion drag-to-reorder
- `BlockToolbar.jsx` — add block controls
- Per-block editor forms (Title, Paragraph, Video, Gallery, etc.)
- Auto-save draft to Firestore on change

### Phase 7 — Draft / Publish
- `PublishBar.jsx`
- Publish action (copy draft → published)
- Revert to published (stretch)

### Phase 8 — CSS & Theming
- `styles/cms.css` — admin UI + CSS custom properties
- TSUP CSS bundle verification
- Consumer import testing

### Phase 9 — Media Handling
- Firebase Storage upload in Video/Gallery/Image editors
- Embed URL parsing (YouTube, Vimeo iframe src generation)
- Upload progress UI

### Phase 10 — Polish & Publish
- README with full usage docs
- `jeeby.config.js` documentation
- Peer dependency warnings
- npm publish config (`files`, `main`, `module`, `exports`)
- Test in a real Next.js consumer project

---

## Known Risks / Open Questions

| Risk | Mitigation |
|---|---|
| Firebase Admin SDK for SSR auth requires service account in env vars — dev must configure this | Document clearly; middleware is optional (can use client-side auth guard instead) |
| Firestore 1MB doc limit for pages with large Gallery blocks | Monitor; add subcollection fallback for blocks if needed |
| TSUP `"use client"` banner applies to whole entry — mixed server/client exports need separate entry files | Keep server utilities (getCMSContent) in a third entry point if needed |
| Framer Motion bundle size (~30kb gzip) is significant | It's a peer dependency — not bundled into the package |
| Firebase client SDK (~100kb) — same | Peer dependency |
| Consumer may already have Firebase initialized | `init.js` uses `getApps()` check before calling `initializeApp()` |

---

## Stretch Features (Post-v1)

- User roles (editor vs admin)
- Per-block `draft: true` toggle to hide from published
- Revert to published
- Page preview mode (render published version inside admin)
- Custom block registration API (`registerBlock(type, component, editorComponent)`)
- Subcollection fallback for pages exceeding 1MB
- Webhook on publish (notify external services)
- Versioning / publish history
