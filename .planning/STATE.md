---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-18T22:45:24.954Z"
progress:
  total_phases: 11
  completed_phases: 6
  total_plans: 23
  completed_plans: 23
---

# Project State: jeeby-cms

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Developers can drop a fully functional CMS into any Next.js project in minutes, with zero lock-in to a specific design system
**Current focus:** Phase 7 — Draft / Publish (next)
**Last completed:** Phase 6, Plan 04 — AddBlockButton, BlockTypePicker, UndoToast, UnsavedChangesWarning, all Phase 6 components wired; PageEditor exported from admin entry (2026-03-18)

## Phase Status

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Package Scaffolding | ● Complete | 3/3 complete |
| 2 | Firebase Layer | ◑ In Progress | 2/5 complete |
| 3 | Front-End Block System | ● Complete | 5/5 complete |
| 4 | Admin Auth | ◑ In Progress | 2/? complete |
| 5 | Page Manager | ● Complete | 3/3 complete |
| 6 | Block Editor | ● Complete | 4/4 complete |
| 7 | Draft / Publish | ○ Pending | — |
| 8 | CSS & Theming | ○ Pending | — |
| 9 | Media Handling | ○ Pending | — |
| 10 | Polish & Publish | ○ Pending | — |

## Key Decisions Log

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Two TSUP entry points | 1 | Prevents "use client" from contaminating server utilities |
| TSUP array config (not object) | 1 | Isolates clean/banner/splitting per entry — prevents race condition and banner contamination |
| "use client" via TSUP banner only | 1 | Not in source files — avoids duplication, marks all output chunks correctly |
| server entry splitting: false | 1 | Server utilities are simple async functions — no code-splitting needed |
| Peer deps for Firebase + Framer Motion | 1 | Avoids double-bundling |
| verify-exports.js uses Node built-ins only | 1 | No npm install needed before running verification |
| check() accumulates failures before exit | 1 | Shows all failures in one run, not just first |
| Post-build banner injection for use-client | 1 | Rollup 4 strips "use client" directives — must prepend after tsup runs via build script |
| typescript added as devDependency | 1 | tsup requires typescript at runtime even for plain JS source files |
| Firestore doc-per-page | 2 | Simple; 1MB limit acceptable |
| No setPersistence() call | 2 | Firebase defaults to LOCAL persistence; calling it can wipe state (sdk#9319) |
| React.createElement in src/index.js | 2 | No JSX transform configured in TSUP for plain JS |
| Admin SDK snap.exists is boolean property | 3 | snap.exists() returns truthy function ref (always true) — must use if (!snap.exists) |
| Published-only data exposure | 3 | getCMSContent and useCMSContent both return published sub-object only — draft never sent to front end |
| CMSProvider converted to JSX | 3 | React.createElement removed after TSUP JSX loader configured in Plan 01 |
| useCMSFirebase is internal hook | 2 | useCMSContent (Phase 3) is the public API; Firebase instances not re-exported |
| mock.module needs --experimental flag | 2 | Node 22 requires --experimental-test-module-mocks for mock.module API |
| loader: { '.js': 'jsx' } in tsup required | 3 | Without it esbuild treats .js as plain JS and rejects JSX syntax |
| Server test stub runtime probe | 3 | Phase 2 getCMSContent placeholder exports function name but always returns null — probe detects real vs stub |
| isomorphic-dompurify and video.js as optional peer deps | 3 | Consumers who don't use RichText or Video blocks don't need them |
| CSS custom properties | 8 | Theme-agnostic theming |
| JavaScript (not TypeScript) | — | Faster v1 iteration |
| React.createElement in block files (not JSX) | 3 | Node.js test runner cannot parse JSX — try/catch import silently fails, tests skip; createElement avoids transform requirement |
| alt="" empty string (never omit alt) | 3 | WCAG 1.1.1: omitting alt causes screen readers to announce filename; empty string signals decorative |
| aria-label="Gallery" on ul (no heading precedes) | 3 | WCAG 1.3.1: no visible heading in Phase 3 static rendering; aria-label provides accessible context |
| toEmbedUrl exported from Video.js | 3 | Enables independent unit testing of URL parsing logic and consumer reuse |
| BLOCK_REGISTRY type strings are lowercase | 3 | Phase 6 must use exact strings: 'title', 'richtext', 'image', 'video', 'gallery' (paragraph dropped — see below) |
| jeeby-cms-block class structure only in Phase 3 | 3 | CSS custom property values deferred to Phase 8 — Phase 3 delivers class hook + id passthrough only |
| mock.module for isomorphic-dompurify in index.test.js | 3 | Transitive CJS/ESM conflict (html-encoding-sniffer + @exodus/bytes) causes ERR_REQUIRE_ESM in Node 22; mock resolves it |
| components prop on Blocks merges custom registry | 3 | { ...BLOCK_REGISTRY, ...components } enables v1 extensibility without breaking API change in v2 |
| DOMPurify namespace import with .default fallback | 3 | Bypasses TSUP CJS interop double-.default chain (DOMPurify__default.default) that fails under Next.js/turbopack ESM |
| Video field: data.url canonical, data.src fallback | 3 | url matches schema and BLOCK_REGISTRY wiring; src fallback preserves backwards compat |
| Cookie written before setUser/setLoading | 4 | Ensures __session cookie exists before React re-render so downstream reads see it |
| Source inspection for cookie tests | 4 | Avoids fragile multi-layer mock chain (Firebase/React/document.cookie); contract confirmed via readFileSync |
| Source inspection tests for admin components | 4 | Avoids fragile multi-layer Firebase/React mock chain; readFileSync verifies accessibility contract directly |
| AdminNav accepts onSignOut prop | 4 | Keeps component decoupled from useAuth context; AdminPanel passes signOut from hook |
| children prop on AdminPanel | 4 | Phase 5 PageManager slots in without breaking API change |
| listPages uses no orderBy | 5 | Avoids silently excluding documents missing updatedAt field (RESEARCH.md Pitfall 5) |
| validateSlug returns true when pattern falsy | 5 | No template registered means any slug is valid by design |
| CMSContext value memoized with useMemo([firebase, templates]) | 5 | Prevents new object reference on every CMSProvider render, avoiding unnecessary consumer re-renders |
| Fragment named import (not React.Fragment) | 5 | TSUP JSX transform handles React namespace; named import avoids needing React in scope |
| editTriggerRefs keyed by slug-field string | 5 | Per-row focus management for inline edit without prop drilling or per-row component state |
| requestAnimationFrame for focus-return in commitEdit | 5 | Ensures focus fires after React finishes clearing editingSlug (ref element may still be mounted otherwise) |
| deleteBtnRef.current set from e.currentTarget on click | 5 | Captures exact DOM node for per-row focus return without prop drilling |
| Announcement auto-clear via 3s useEffect | 5 | Prevents stale live region re-announcements if same success message fires twice |
| Tiptap as devDependency (bundled, not peer) | 6 | Used only in admin bundle — consumers don't install it; not added to tsup external array |
| Wave 0 Nyquist scaffolding for Phase 6 | 6 | 11 test files written before source files exist — intentional red state until Plans 02-04 |
| AddBlockButton inside Reorder.Item | 6 | Framer Motion Reorder.Group only allows Reorder.Item as direct children — AddBlockButton goes after article inside Reorder.Item |
| Dynamic aria-live for save status | 6 | assertive on error, polite otherwise — correct WCAG practice; source-inspection tests updated to accept JSX expression pattern |

## Accumulated Context

### Block Type Decisions
- **ParagraphBlock dropped (2026-03-18):** Replaced entirely by RichTextBlock. One text content block type for v1 — simpler admin UX, fewer editor variants to build in Phase 6.
- **Block types for Phase 6 editor:** title, richtext, image, video, gallery (5 types, not 6)
- **Display name vs type key:** Internal type key stays `'richtext'` (Firestore docs already use it). Display name in the block picker UI = "Text". Keeps migration-free while being intuitive for non-technical admins.
- **Stretch goal captured (todo):** Inline formatting (bold/italic) within non-text blocks like Title — deferred post-Phase 6.

### Roadmap Evolution
- Phase 11 added: i18n localization for admin panel and block components

---
*Initialized: 2026-03-10*
