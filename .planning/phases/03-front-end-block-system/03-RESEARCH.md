# Phase 3: Front-End Block System - Research

**Researched:** 2026-03-11
**Domain:** React components, Firestore real-time, Firebase Admin SDK, JSX transform, HTML sanitization, Video embed
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**JSX Transform**
- Add JSX transform to TSUP via esbuildOptions (esbuild supports JSX natively)
- Use automatic runtime — no `import React` needed in component files
- Enable project-wide for all `.js` files in `src/`
- Convert existing `React.createElement` calls in `src/index.js` to JSX syntax for consistency

**Block File Structure**
- Block components live in `src/blocks/` — one file per block type: `Title.js`, `Paragraph.js`, `RichText.js`, `Image.js`, `Video.js`, `Gallery.js`
- `<Blocks>` and `<Block>` wrapper live in `src/blocks/index.js`, re-exported from `src/index.js`
- `<Blocks>` uses a static `BLOCK_REGISTRY` object mapping type strings to components
- `<Blocks>` accepts a `components` prop to merge custom block types with built-in registry
- Unknown block types: silently skip (render nothing)

**RichText Sanitization**
- Use isomorphic-dompurify (works server-side and client-side)
- Add as a peer dependency (not bundled)
- `<RichText>` renders sanitized HTML via `dangerouslySetInnerHTML` inside a `<div className={className}>`
- Consumer wraps `<Blocks>` in their own semantic element (`<article>`, `<main>`, etc.)

**Gallery Layout**
- CSS Grid only for Phase 3 — responsive auto-fill columns
- Column count controlled via CSS custom property: `--jeeby-cms-gallery-columns`
- No lightbox — deferred to future phase

**getCMSContent (server)**
- Uses Firebase Admin SDK (`src/firebase/admin.js`) — no React context, no consumer config needed
- Returns full page document: `{ title, subtitle, headerImage, blocks, lastPublishedAt, ... }` from `published.*`
- Returns `null` if page doesn't exist
- Published content only — no draft parameter

**Title Block**
- Heading level stored in Firestore block data: `block.data.level` (e.g. `'h3'`)
- Inside `<Blocks>`, level is restricted to h2–h6 — h1 is reserved for the page-level `title` field
- Blocks that specify `level='h1'` fall back to `h2`
- Default heading level: h3

**Video Block**
- `<Video>` transforms raw URLs to iframe src on render (YouTube, Vimeo, Loom detection)
- Firebase Storage videos: use Video.js as optional peer dependency
- Video.js for storage videos only — YouTube/Vimeo iframes rendered natively
- If Video.js is not installed: fall back to native `<video>` element, emit a `console.warn` recommending installation, throw an error if consumer passes Video.js-specific props

**useCMSContent Hook**
- Listens to published.blocks only — no draft preview from public hook
- Returns `{ data, loading, error }` — `data` is the full page document or `null` if page doesn't exist
- `null` return lets consumers handle their own 404 rendering

### Claude's Discretion
- Exact esbuildOptions config for JSX transform in tsup.config.js
- Internal URL parsing logic for YouTube/Vimeo/Loom detection in `<Video>`
- isomorphic-dompurify integration details
- Image block alt text fallback behavior (empty alt or aria-hidden when no alt provided)
- Paragraph block wrapping element (likely `<p>`)

### Deferred Ideas (OUT OF SCOPE)
- Gallery carousel layout
- Gallery lightbox / click-to-expand
- `jeeby-cms/blocks` as a separate entry point
- Background video mode for `<Video>`
- Admin-configurable Video.js controls
- Page-level metadata admin UI
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FRONT-01 | `getCMSContent(slug)` fetches published page content for use in Server Components | Firebase Admin Firestore pattern, `getAdminFirestore()` extension to admin.js |
| FRONT-02 | `useCMSContent(slug)` provides real-time Firestore listener for Client Components | Firestore `onSnapshot` in useEffect with cleanup, `{ data, loading, error }` shape |
| FRONT-03 | `<Blocks>` component renders an array of block objects into the correct block components | Static `BLOCK_REGISTRY`, `components` prop merge, silently skip unknown types |
| FRONT-04 | `<Block>` wrapper applies max-width, vertical spacing, and optional anchor id via CSS custom properties | CSS vars `--jeeby-cms-max-width`, `--jeeby-cms-block-spacing`, `id` prop passthrough |
| FRONT-05 | `<Title>` block renders text with configurable heading level (h1–h6) | Level restricted to h2–h6; h1 → h2; default h3; semantic heading element |
| FRONT-06 | `<Paragraph>` block renders plain text | Wraps in `<p>` tag; semantic HTML |
| FRONT-07 | `<RichText>` block renders sanitized HTML | isomorphic-dompurify 3.1.0; `DOMPurify.sanitize(html)`; `dangerouslySetInnerHTML` |
| FRONT-08 | `<Image>` block renders an image from Firebase Storage URL or external URL with alt and caption | `<figure>/<figcaption>` with caption; `alt=""` for decorative fallback; WCAG 1.1.1 |
| FRONT-09 | `<Video>` block renders an embedded iframe (YouTube, Vimeo, Loom) or Firebase Storage video | URL parsing regex; `title` attribute on iframe; Video.js 8.23.7 React pattern |
| FRONT-10 | `<Gallery>` block renders a collection of images in grid or masonry layout | CSS Grid with `--jeeby-cms-gallery-columns`; `<ul>/<li>` semantic structure |
</phase_requirements>

---

## Summary

Phase 3 introduces the first JSX-based React components into the package. The primary technical challenge is enabling JSX transform in the TSUP build pipeline (trivial via `esbuildOptions`) and then implementing six block components plus two data-fetching primitives with full WCAG AA compliance.

The Firestore layer is largely defined: `getCMSContent` uses the Admin SDK pattern already established in `src/firebase/admin.js`, and `useCMSContent` uses Firestore's `onSnapshot` with the existing `useCMSFirebase()` hook to get `db`. Both return the `published` sub-object of the page document (a locked decision from Phase 2's Firestore schema).

The accessibility requirements are non-trivial. Three blocks have specific WCAG obligations: Image blocks require alt text handling with an empty-alt fallback for decorative images (WCAG 1.1.1); Video blocks require a `title` attribute on every iframe element (WCAG 4.1.2); and the Title block must never emit `<h1>` inside `<Blocks>` since h1 is reserved for the page-level title. All other blocks are static, keyboard-inert display components — no focus management or live region requirements.

**Primary recommendation:** Enable JSX with `loader: { '.js': 'jsx' }` + `esbuildOptions(opts) { opts.jsx = 'automatic'; opts.jsxImportSource = 'react' }` in tsup config; implement blocks in `src/blocks/` with one component per file; test with `renderToStaticMarkup` from `react-dom/server` (no DOM needed).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| esbuild (via tsup) | 0.27.3 (bundled) | JSX transform | Already present; `jsx: 'automatic'` confirmed working |
| React | >=18 (peer) | UI components | Project standard; automatic JSX runtime |
| firebase/firestore | >=10 (peer) | `onSnapshot` real-time listener | Existing peer dep |
| firebase-admin/firestore | >=12 (dev+peer) | Server-side page fetch | Existing peer dep; already in admin.js |
| isomorphic-dompurify | ^3.1.0 | HTML sanitization (server + client) | Works in both environments; simple API |
| video.js | ^8.23.7 | Firebase Storage video playback | Video.js is the dominant HTML5 video player library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dom/server | >=18 (peer) | `renderToStaticMarkup` for tests | Wave 0 test stubs only; no browser needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| isomorphic-dompurify | sanitize-html | sanitize-html is heavier and more complex to configure; isomorphic-dompurify is a thin DOMPurify wrapper |
| video.js | plyr, react-player | Context decision is Video.js; enables future background video mode and admin controls |
| CSS Grid | CSS Flex | Grid is the right tool for 2D image layout; simpler than masonry |

**Installation (new peer deps):**
```bash
# Consumer-facing optionals — add to peerDependencies in package.json
npm install isomorphic-dompurify video.js
```

---

## Architecture Patterns

### Recommended Project Structure

New files introduced in Phase 3:
```
src/
├── blocks/
│   ├── index.js         # <Blocks>, <Block>, BLOCK_REGISTRY
│   ├── Title.js         # <Title> component
│   ├── Paragraph.js     # <Paragraph> component
│   ├── RichText.js      # <RichText> component
│   ├── Image.js         # <Image> component
│   ├── Video.js         # <Video> component + URL parsing
│   └── Gallery.js       # <Gallery> component
├── firebase/
│   └── admin.js         # ADD: getAdminFirestore() alongside getAdminAuth()
├── server/
│   └── index.js         # IMPLEMENT: getCMSContent(slug) using Admin Firestore
└── index.js             # IMPLEMENT: useCMSContent(slug); convert createElement to JSX
```

Test files (Wave 0 stubs, one per implementation file):
```
src/
├── blocks/
│   ├── index.test.js
│   ├── Title.test.js
│   ├── Paragraph.test.js
│   ├── RichText.test.js
│   ├── Image.test.js
│   ├── Video.test.js
│   └── Gallery.test.js
└── server/
    └── index.test.js
```

### Pattern 1: TSUP JSX Transform Configuration

**What:** Enable JSX automatic runtime in all `.js` files via TSUP `esbuildOptions` + `loader`.
**When to use:** All three TSUP entries in the array config that involve React components (index + admin entries). NOT the server entry (no JSX there in Phase 3).

```javascript
// tsup.config.js — apply to index and admin entries
{
  entry: { index: 'src/index.js' },
  format: ['esm', 'cjs'],
  loader: { '.js': 'jsx' },            // Tell esbuild to process .js as JSX
  esbuildOptions(options) {
    options.jsx = 'automatic'           // React 17+ automatic runtime
    options.jsxImportSource = 'react'   // Imports from react/jsx-runtime
  },
  external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
  banner: { js: '"use client";' },
  // ... rest unchanged
}
```

**Verified:** Running `esbuild.transformSync('<div/>', { jsx: 'automatic', jsxImportSource: 'react', loader: 'jsx' })` produces `import { jsx } from "react/jsx-runtime"` — confirmed against local esbuild 0.27.3.

**Note on loader:** Without `loader: { '.js': 'jsx' }`, esbuild does not process JSX in `.js` files (only `.jsx`/`.tsx`). This option is required because the project uses `.js` extension throughout.

### Pattern 2: Block Registry + Blocks Component

**What:** Static lookup registry mapping `block.type` strings to React components. `components` prop merges custom types.
**When to use:** `<Blocks>` component implementation.

```javascript
// src/blocks/index.js
import { Title } from './Title.js'
import { Paragraph } from './Paragraph.js'
import { RichText } from './RichText.js'
import { Image } from './Image.js'
import { Video } from './Video.js'
import { Gallery } from './Gallery.js'

const BLOCK_REGISTRY = {
  title: Title,
  paragraph: Paragraph,
  richtext: RichText,
  image: Image,
  video: Video,
  gallery: Gallery,
}

export function Blocks({ data, components }) {
  if (!data?.blocks) return null
  const registry = components ? { ...BLOCK_REGISTRY, ...components } : BLOCK_REGISTRY
  return (
    <>
      {data.blocks.map((block, i) => {
        const Component = registry[block.type]
        if (!Component) return null  // silently skip unknown types
        return (
          <Block key={block.id ?? i}>
            <Component data={block.data} />
          </Block>
        )
      })}
    </>
  )
}
```

### Pattern 3: Block Wrapper (FRONT-04)

**What:** CSS custom property-driven wrapper for max-width, spacing, and optional anchor.
**When to use:** Every block rendered by `<Blocks>`.

```javascript
// src/blocks/index.js (continued)
export function Block({ id, className, children }) {
  return (
    <div
      id={id}
      className={['jeeby-cms-block', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
```

The `jeeby-cms-block` class is styled in Phase 8 (CSS & Theming), but the class name must be consistent now. CSS custom properties (`--jeeby-cms-max-width`, `--jeeby-cms-block-spacing`) are applied in `styles/cms.css`.

### Pattern 4: getCMSContent — Admin Firestore

**What:** Server-side async function using Firebase Admin SDK to fetch published page content.
**When to use:** Next.js Server Components, `getServerSideProps`, RSC async functions.

```javascript
// src/firebase/admin.js — ADD this function
import { getFirestore } from 'firebase-admin/firestore'

export function getAdminFirestore() {
  return getFirestore(getAdminApp())  // getAdminApp() already defined in this file
}
```

```javascript
// src/server/index.js
import { getAdminFirestore } from '../firebase/admin.js'

export async function getCMSContent(slug) {
  const db = getAdminFirestore()
  const snap = await db.doc('cms/pages/' + slug).get()
  if (!snap.exists) return null
  const pageData = snap.data()
  return pageData?.published ?? null
}
```

**Admin SDK API difference from client SDK:**
| Client SDK | Admin SDK |
|-----------|-----------|
| `doc(db, 'a', 'b', 'c')` | `db.doc('a/b/c')` |
| `await getDoc(ref)` | `await ref.get()` |
| `snap.exists()` (method) | `snap.exists` (boolean property) |
| `snap.data()` | `snap.data()` |

### Pattern 5: useCMSContent — Firestore onSnapshot

**What:** React hook providing real-time Firestore listener. Uses existing `useCMSFirebase()` for `db`.
**When to use:** Client Components needing live CMS content updates.

```javascript
// src/index.js
import { onSnapshot, doc } from 'firebase/firestore'

export function useCMSContent(slug) {
  const { db } = useCMSFirebase()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug || !db) return
    setLoading(true)
    const ref = doc(db, 'cms', 'pages', slug)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setLoading(false)
        setData(snap.exists() ? (snap.data()?.published ?? null) : null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe  // Firestore returns the unsubscribe function directly
  }, [db, slug])

  return { data, loading, error }
}
```

**Key:** `onSnapshot` returns an unsubscribe function. Returning it directly from `useEffect` (rather than wrapping in an arrow function) is correct and idiomatic.

### Pattern 6: isomorphic-dompurify Integration

**What:** HTML sanitization that works identically in Node.js (SSR) and browser.
**When to use:** `<RichText>` block only.

```javascript
// src/blocks/RichText.js
import DOMPurify from 'isomorphic-dompurify'

export function RichText({ data, className }) {
  // Graceful error if peer dep not installed
  if (typeof DOMPurify === 'undefined') {
    throw new Error(
      '[jeeby-cms] <RichText> requires isomorphic-dompurify. ' +
      'Run: npm install isomorphic-dompurify'
    )
  }
  const clean = DOMPurify.sanitize(data?.html ?? '')
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
```

**Note:** isomorphic-dompurify uses jsdom for server-side. The `clearWindow()` export is available for long-running processes but not needed for typical Next.js SSR request lifecycles.

### Pattern 7: Video URL Parsing (YouTube/Vimeo/Loom)

**What:** Pure transform function detecting platform and converting share URLs to embed URLs.
**When to use:** Inside `<Video>` component before rendering iframe.

```javascript
// src/blocks/Video.js
function toEmbedUrl(url) {
  if (!url) return null

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  // Loom: loom.com/share/ID
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`

  // Not a known platform — assume already an embed URL or raw storage URL
  return url
}

function isStorageUrl(url) {
  return (
    url?.includes('firebasestorage.googleapis.com') ||
    url?.includes('storage.googleapis.com')
  )
}
```

### Pattern 8: Video.js React Integration

**What:** Video.js player wrapped in React functional component using two refs and two effects.
**When to use:** When `block.data.url` is a Firebase Storage URL.

```javascript
// src/blocks/Video.js (Firebase Storage path)
// Source: https://legacy.videojs.org/guides/react/
function VideoJSPlayer({ url, options }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!playerRef.current) {
      const el = document.createElement('video-js')
      videoRef.current.appendChild(el)
      playerRef.current = videojs(el, {
        sources: [{ src: url, type: 'video/mp4' }],
        controls: true,
        responsive: true,
        ...options,
      })
    }
  }, [url, options])

  useEffect(() => {
    const player = playerRef.current
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return <div data-vjs-player><div ref={videoRef} /></div>
}
```

### Anti-Patterns to Avoid

- **`import React from 'react'` in component files:** With the automatic JSX runtime configured, this import is unnecessary and adds dead weight. The transform inserts `react/jsx-runtime` automatically.
- **Using `doc(db, ...)` in `getCMSContent`:** The Admin SDK does NOT export the standalone `doc()` function from the client SDK. Use `db.doc('path')` (Admin SDK method chaining).
- **`snap.exists()` with parentheses in Admin SDK:** Admin SDK's `exists` is a boolean property, not a method. `snap.exists` (no parentheses) — calling it as a function always returns `true` (truthy function object).
- **Skipping `title` attribute on iframes:** Every `<iframe>` MUST have a non-empty `title` for WCAG 4.1.2 compliance. This is a hard accessibility requirement.
- **Emitting `<h1>` from Title block:** h1 is reserved for the page. Block-level h1 breaks heading hierarchy. Clamp to h2–h6.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML sanitization | Custom regex/allowlist | isomorphic-dompurify | XSS attack surface is enormous; DOMPurify handles hundreds of known vectors |
| Video player UI | Custom HTML5 video wrapper | Video.js (for storage) | Accessibility, captions, keyboard controls are handled by Video.js |
| YouTube/Vimeo embed detection | Custom URL parser | Simple regex patterns (well-known formats) | These platforms have stable URL patterns; regex is sufficient and lightweight |
| JSX transform | Manual `React.createElement` | esbuild `jsx: 'automatic'` | JSX automatic runtime handles `key`, fragments, and optimizations correctly |

**Key insight:** Custom HTML sanitization and custom video players both have critical accessibility and security implications that would require months of hardening to match what the established libraries provide.

---

## Common Pitfalls

### Pitfall 1: `.js` Files Not Processed as JSX

**What goes wrong:** esbuild silently passes `.js` files through without JSX transformation, producing syntax errors at runtime.
**Why it happens:** esbuild only auto-processes `.jsx`/`.tsx` extensions unless explicitly told otherwise.
**How to avoid:** Add `loader: { '.js': 'jsx' }` to each TSUP entry that contains JSX. Without this, the `esbuildOptions` JSX settings have no effect on `.js` files.
**Warning signs:** Build succeeds but runtime throws "Unexpected token '<'" or similar.

### Pitfall 2: Admin SDK `snap.exists` vs Client SDK `snap.exists()`

**What goes wrong:** `snap.exists` in Admin SDK is a boolean property; `snap.exists()` in client SDK is a method. Calling `snap.exists()` in Admin SDK code returns a truthy function reference (always `true`), breaking null-page detection.
**Why it happens:** The two SDKs have diverged API surfaces.
**How to avoid:** In `getCMSContent` (Admin SDK path), always use `snap.exists` (no parentheses). In `useCMSContent` (client SDK path), use `snap.exists()` (with parentheses).
**Warning signs:** `getCMSContent` never returns `null` even for nonexistent pages.

### Pitfall 3: Missing `title` Attribute on Iframes

**What goes wrong:** Screen readers cannot describe the iframe's purpose, failing WCAG 4.1.2.
**Why it happens:** Developers focus on the `src` and forget the accessibility attribute.
**How to avoid:** Every `<iframe>` in `<Video>` must include `title={block.data.title || 'Embedded video'}`. If `block.data.title` is not stored, use a sensible fallback.
**Warning signs:** Automated accessibility scanners (axe, Lighthouse) flag "iframe-title" violation.

### Pitfall 4: Video.js Memory Leak

**What goes wrong:** Video.js player persists after component unmount, causing errors on re-mount.
**Why it happens:** The player creates DOM nodes outside React's control; React doesn't clean them up.
**How to avoid:** The cleanup `useEffect` MUST call `player.dispose()` with the `!player.isDisposed()` guard. Without this, Hot Module Replacement (HMR) and React Strict Mode double-invoke will create multiple players.
**Warning signs:** Console errors "Cannot read property of null" or duplicate video elements.

### Pitfall 5: isomorphic-dompurify Not in External Array

**What goes wrong:** TSUP bundles isomorphic-dompurify into the output, which then tries to import `jsdom` (a heavyweight Node.js-only dep) on the client, causing browser build failures.
**Why it happens:** isomorphic-dompurify is a peer dep and must be externalized.
**How to avoid:** Add `'isomorphic-dompurify'` to the `external` array in all three TSUP entries. Also add `'video.js'` to external.
**Warning signs:** Build warnings about externalized deps; browser bundle includes jsdom.

### Pitfall 6: Gallery CSS Variable Cannot Replace `auto-fill` Keyword Directly in Some Contexts

**What goes wrong:** Some CSS engines may not interpolate a CSS custom property containing `auto-fill` as the first argument to `repeat()`.
**Why it happens:** CSS custom property substitution happens at computed value time; `auto-fill` is a keyword, not a number.
**How to avoid:** Default the custom property to a fixed column count (e.g., `3`) and let consumers set it. If responsive behavior is needed, document the use of `auto-fill` as a valid value: `--jeeby-cms-gallery-columns: auto-fill`.
**Warning signs:** Gallery renders as a single column even with the custom property set.

---

## Code Examples

Verified patterns from official sources and local testing:

### JSX Automatic Runtime (esbuild — verified locally)
```javascript
// Input (src/blocks/Title.js):
export function Title({ data }) {
  // No 'import React' needed
  return <h2>{data.text}</h2>
}

// Output after esbuild with jsx:'automatic', jsxImportSource:'react':
import { jsx } from "react/jsx-runtime";
export function Title({ data }) {
  return jsx("h2", { children: data.text });
}
```

### Firestore onSnapshot Cleanup (Source: firebase.google.com/docs/firestore/query-data/listen)
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      setData(snapshot.data())
    }
  })
  return () => unsubscribe()  // or just: return unsubscribe
}, [])
```

### isomorphic-dompurify — Named Import (Source: github.com/kkomelin/isomorphic-dompurify)
```javascript
import { sanitize } from 'isomorphic-dompurify'
const clean = sanitize(dirtyHtml)
// OR default import:
import DOMPurify from 'isomorphic-dompurify'
const clean = DOMPurify.sanitize(dirtyHtml)
```

### Video.js React Cleanup (Source: legacy.videojs.org/guides/react/)
```javascript
useEffect(() => {
  const player = playerRef.current
  return () => {
    if (player && !player.isDisposed()) {
      player.dispose()
      playerRef.current = null
    }
  }
}, [playerRef])
```

### Admin Firestore Document Read (Source: firebase.google.com/docs/admin/setup)
```javascript
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(app)
const snap = await db.doc('cms/pages/' + slug).get()
if (!snap.exists) return null          // NOTE: exists is a property, not a method
const data = snap.data()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import React from 'react'` in every file | Automatic JSX runtime — no import needed | React 17 (2020) | Cleaner files, smaller bundles |
| `React.createElement('div', null, ...)` | JSX syntax with esbuild | Always available in bundlers | Matches the rest of the JS ecosystem |
| Firebase v8 compat (`firebase.firestore()`) | Firebase v9 modular SDK (`onSnapshot`, `doc`, etc.) | Firebase 9 (2021) | Tree-shakeable; must use v9 API (already done in Phase 2) |
| Class-based Video.js React wrapper | Functional component with two refs + two effects | Video.js 7+ | Strict Mode and HMR safe |

**Deprecated/outdated:**
- `React.createElement` in src/index.js: to be converted to JSX during Phase 3 per locked decision
- `import videojs from 'video.js'` (old class-based): replaced by functional component pattern per legacy.videojs.org guide

---

## Accessibility Requirements

This section is MANDATORY for all block components. The project enforces WCAG AA (WCAG 2.2).

### Applicable Specialists (from CLAUDE.md Decision Matrix)
New components trigger: aria-specialist, keyboard-navigator, alt-text-headings. Image/Gallery also trigger alt-text-headings. Video triggers live-region-controller (loading state) and aria-specialist (iframe).

### Block-by-Block Requirements

#### Title Block (FRONT-05)
**WCAG SC:** 1.3.1 (Info and Relationships), 2.4.6 (Headings and Labels)

| Rule | Implementation |
|------|----------------|
| Never emit `<h1>` inside `<Blocks>` | Clamp: if `level === 'h1'` or level is absent/invalid → use `h3` (default) |
| Allowed values | `h2`, `h3`, `h4`, `h5`, `h6` |
| Semantic HTML | Use the actual heading element (`<h2>`, `<h3>`, etc.) — never `<div role="heading" aria-level="2">` |
| No heading level skipping | Warn consumers in docs: do not configure blocks in a way that skips levels |

```jsx
// Correct implementation
const VALID_LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6']
const Tag = VALID_LEVELS.includes(data?.level) ? data.level : 'h3'
return <Tag className={className}>{data.text}</Tag>
```

#### Paragraph Block (FRONT-06)
**WCAG SC:** 1.3.1 (Info and Relationships)

| Rule | Implementation |
|------|----------------|
| Use `<p>` element | Semantic paragraph — never `<div>` or `<span>` for paragraph content |
| No ARIA needed | Native semantics are sufficient |

```jsx
return <p className={className}>{data?.text}</p>
```

#### RichText Block (FRONT-07)
**WCAG SC:** 1.1.1, 1.3.1, 4.1.1

| Rule | Implementation |
|------|----------------|
| Preserve alt attributes | DOMPurify preserves `alt` on `<img>` by default — verify config does not strip it |
| Preserve ARIA attributes | DOMPurify by default strips `aria-*` — use `ADD_ATTR: ['aria-*']` if CMS admins write accessible HTML |
| Preserve `role` attributes | Add `ADD_ATTR: ['role']` if needed |
| Link text quality | Cannot control from component level; document in consumer guide |

**Recommended DOMPurify config:**
```javascript
const clean = DOMPurify.sanitize(data?.html ?? '', {
  ADD_ATTR: ['aria-label', 'aria-describedby', 'role', 'tabindex'],
})
```

#### Image Block (FRONT-08)
**WCAG SC:** 1.1.1 (Non-text Content), 1.4.5 (Images of Text)

| Rule | Implementation |
|------|----------------|
| Alt text from `block.data.alt` | Use verbatim when provided |
| Decorative image (no alt provided) | `alt=""` — empty string signals decorative; screen readers skip |
| Caption support | Use `<figure>` + `<figcaption>` when `block.data.caption` is present |
| Width/height attributes | Include when `block.data.width` and `block.data.height` are available to prevent CLS |
| Never omit `alt` attribute entirely | Missing `alt` attribute (not empty string) causes screen readers to read the filename |

```jsx
// Correct alt fallback: CONTEXT.md delegates this to Claude's discretion
// Recommendation: empty string (not aria-hidden) since it's the standard for decorative images
export function Image({ data, className }) {
  const img = (
    <img
      src={data?.src}
      alt={data?.alt ?? ''}           // empty alt = decorative
      width={data?.width}
      height={data?.height}
      className={className}
    />
  )
  if (data?.caption) {
    return (
      <figure className={className}>
        <img src={data.src} alt={data?.alt ?? ''} width={data?.width} height={data?.height} />
        <figcaption>{data.caption}</figcaption>
      </figure>
    )
  }
  return img
}
```

#### Video Block (FRONT-09)
**WCAG SC:** 4.1.2 (Name, Role, Value), 1.2.2 (Captions), 2.1.1 (Keyboard)

| Rule | Implementation |
|------|----------------|
| `title` attribute on `<iframe>` | REQUIRED. Use `block.data.title` or fallback `"Embedded video"` |
| `allowFullScreen` attribute | Include for user experience; does not affect a11y |
| Keyboard access to iframe content | YouTube/Vimeo/Loom embed players are keyboard-accessible by default |
| Firebase Storage videos | Video.js has built-in keyboard controls and caption support |
| Native `<video>` fallback | Native `<video controls>` is keyboard-accessible; `controls` attribute is required |
| Caption tracks | Video.js supports `<track>` elements; document in Phase 9 (Media Handling) |

```jsx
// Iframe pattern (YouTube/Vimeo/Loom)
<iframe
  src={embedUrl}
  title={data?.title || 'Embedded video'}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  style={{ border: 0, width: '100%', aspectRatio: '16/9' }}
/>
```

#### Gallery Block (FRONT-10)
**WCAG SC:** 1.1.1 (Non-text Content), 1.3.1 (Info and Relationships)

| Rule | Implementation |
|------|----------------|
| Semantic list structure | Use `<ul>` / `<li>` for the collection (a gallery IS a list of items) |
| Per-image alt text | Each `<img>` within the gallery requires `alt` (same rules as Image block) |
| `<figure>/<figcaption>` per item | Use when caption is present on individual gallery items |
| No keyboard navigation required (Phase 3) | Gallery is static display — no lightbox, no interaction |
| Gallery container label | Consider `aria-label="Gallery"` on the `<ul>` if no visible heading precedes it |

```jsx
export function Gallery({ data, className }) {
  const items = data?.items ?? []
  return (
    <ul
      className={['jeeby-cms-gallery', className].filter(Boolean).join(' ')}
      aria-label="Gallery"
      style={{ listStyle: 'none', padding: 0 }}
    >
      {items.map((item, i) => (
        <li key={item.id ?? i}>
          <figure>
            <img src={item.src} alt={item.alt ?? ''} loading="lazy" />
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        </li>
      ))}
    </ul>
  )
}
```

**Gallery CSS:**
```css
/* Controlled by --jeeby-cms-gallery-columns (default: auto-fill) */
.jeeby-cms-gallery {
  display: grid;
  grid-template-columns: repeat(var(--jeeby-cms-gallery-columns, auto-fill), minmax(200px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
```

### Non-Negotiable Accessibility Standards (from CLAUDE.md)
- Semantic HTML before ARIA: `<h2>` not `<div role="heading">`
- `alt=""` for decorative images (empty alt, not missing alt)
- Every iframe has a non-empty `title` attribute
- `<video controls>` for native video fallback
- `<ul>/<li>` for gallery items (they are a list)

---

## Open Questions

1. **Firestore path: `doc(db, 'cms', 'pages', slug)` creates a 3-segment path**
   - What we know: The client-side `firestore.js` uses `doc(db, 'cms', 'pages', slug)` → path `cms/pages/{slug}` → 3 segments (odd = collection path in Firestore's schema)
   - What's unclear: A 3-segment path is technically a collection reference, not a document reference. Firestore client SDK should throw "Invalid document path" on odd-segment paths.
   - Recommendation: This is a Phase 2 concern (Phase 2 plans 02-03 through 02-05 implement Firestore CRUD). The planner should flag this for Phase 2 verification. For Phase 3, match whatever path Phase 2 finalizes. The Admin SDK equivalent is `db.doc('cms/pages/' + slug)` regardless of the final path.

2. **RichText: Optional peer dep missing in server render context**
   - What we know: isomorphic-dompurify is added as optional peer dep
   - What's unclear: If the consumer uses `getCMSContent` + `<Blocks>` in an RSC but doesn't have isomorphic-dompurify installed, the import will fail at module load time (not just at render)
   - Recommendation: Use a dynamic import with try/catch for isomorphic-dompurify and throw a clear error message at render time; this prevents hard module-not-found errors from crashing the entire page.

3. **Block data `type` casing convention**
   - What we know: BLOCK_REGISTRY keys will be `{ title, paragraph, richtext, image, video, gallery }`
   - What's unclear: Phase 6 (Block Editor) will create block objects — the `type` string must match exactly
   - Recommendation: Document the lowercase convention in code comments now; planner should ensure Phase 6 uses these exact strings.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (no external test runner) |
| Config file | None — test command in `package.json` scripts |
| Quick run command | `node --experimental-test-module-mocks --test 'src/blocks/*.test.js'` |
| Full suite command | `node --experimental-test-module-mocks --test 'src/**/*.test.js'` |

### Component Test Strategy
React component tests use `renderToStaticMarkup` from `react-dom/server` — this works in Node.js without a browser DOM and is available since `react-dom` is a peer dep (installed during development).

```javascript
// Pattern for all block component test files (Wave 0 stub)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let Title
try {
  const mod = await import('./Title.js')
  Title = mod.Title
} catch {
  // Implementation does not exist yet — all tests skip
}

test('Title renders h3 by default', { skip: !Title }, () => {
  const html = renderToStaticMarkup(createElement(Title, { data: { text: 'Hello' } }))
  assert.ok(html.includes('<h3>'), 'should render h3')
  assert.ok(html.includes('Hello'), 'should include text')
})
```

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRONT-01 | `getCMSContent(slug)` returns `published` object or `null` | unit (async) | `node --experimental-test-module-mocks --test 'src/server/index.test.js'` | ❌ Wave 0 |
| FRONT-02 | `useCMSContent(slug)` exports `{ data, loading, error }` shape | unit (export shape) | `node --experimental-test-module-mocks --test 'src/index.test.js'` | ❌ Wave 0 |
| FRONT-03 | `<Blocks>` renders known types, skips unknown | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/index.test.js'` | ❌ Wave 0 |
| FRONT-04 | `<Block>` applies `jeeby-cms-block` class, accepts `className` and `id` | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/index.test.js'` | ❌ Wave 0 |
| FRONT-05 | `<Title>` renders h2–h6; h1 falls back to h3; default is h3 | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/Title.test.js'` | ❌ Wave 0 |
| FRONT-06 | `<Paragraph>` renders content in `<p>` tag | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/Paragraph.test.js'` | ❌ Wave 0 |
| FRONT-07 | `<RichText>` sanitizes HTML; removes XSS vectors; preserves safe markup | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/RichText.test.js'` | ❌ Wave 0 |
| FRONT-08 | `<Image>` renders `alt` attribute; uses `<figure>/<figcaption>` when caption present | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/Image.test.js'` | ❌ Wave 0 |
| FRONT-09 | URL parsing: YouTube/Vimeo/Loom → correct embed URL; iframe has `title` | unit (pure function + renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/Video.test.js'` | ❌ Wave 0 |
| FRONT-10 | `<Gallery>` renders `<ul>/<li>` structure; each image has `alt` | unit (renderToStaticMarkup) | `node --experimental-test-module-mocks --test 'src/blocks/Gallery.test.js'` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --experimental-test-module-mocks --test 'src/blocks/*.test.js' 'src/server/index.test.js'`
- **Per wave merge:** `node --experimental-test-module-mocks --test 'src/**/*.test.js'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps (all test files must be created before implementation)
- [ ] `src/server/index.test.js` — covers FRONT-01
- [ ] `src/blocks/index.test.js` — covers FRONT-03 and FRONT-04
- [ ] `src/blocks/Title.test.js` — covers FRONT-05
- [ ] `src/blocks/Paragraph.test.js` — covers FRONT-06
- [ ] `src/blocks/RichText.test.js` — covers FRONT-07
- [ ] `src/blocks/Image.test.js` — covers FRONT-08
- [ ] `src/blocks/Video.test.js` — covers FRONT-09
- [ ] `src/blocks/Gallery.test.js` — covers FRONT-10
- [ ] `src/index.test.js` (or `src/hooks/useCMSContent.test.js`) — covers FRONT-02
- [ ] Verify `react` and `react-dom` are available as devDependencies for test-time SSR rendering

---

## Sources

### Primary (HIGH confidence)
- esbuild local binary (0.27.3) — JSX automatic runtime transform verified by running `esbuild.transformSync` locally
- `node_modules/tsup/dist/index.d.ts` — `esbuildOptions` function signature confirmed; `loader` option confirmed
- `node_modules/esbuild/lib/main.d.ts` — `jsx: 'transform' | 'preserve' | 'automatic'` and `jsxImportSource` confirmed
- firebase.google.com/docs/firestore/query-data/listen — `onSnapshot` React pattern with useEffect cleanup
- firebase.google.com/docs/admin/setup — Admin SDK Firestore `db.doc().get()` pattern
- WCAG 2.2 SC 1.1.1, 1.3.1, 2.4.6, 4.1.2 — well-established, stable criteria

### Secondary (MEDIUM confidence)
- github.com/kkomelin/isomorphic-dompurify README — API confirmed (default + named import, `clearWindow`)
- legacy.videojs.org/guides/react — Video.js React functional component pattern with two refs/two effects
- npm registry — isomorphic-dompurify@3.1.0 and video.js@8.23.7 are confirmed as latest versions

### Tertiary (LOW confidence — needs validation when Phase 2 completes)
- Firestore path `cms/pages/{slug}` (3 segments): derived from existing `src/firebase/firestore.js` code; must be validated against a live Firestore instance in Phase 2

---

## Metadata

**Confidence breakdown:**
- JSX transform config: HIGH — verified with local esbuild binary
- isomorphic-dompurify API: HIGH — verified via GitHub README
- Video.js React pattern: HIGH — from official Video.js React guide
- Firebase Admin Firestore: HIGH — from official Firebase docs
- Firestore onSnapshot: HIGH — from official Firebase docs
- Accessibility requirements: HIGH — WCAG 2.2 is stable; patterns are well-established
- Firestore schema path: LOW — see Open Questions item 1

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable libraries; re-check if Video.js or isomorphic-dompurify release major versions)
