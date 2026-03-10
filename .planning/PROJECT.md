# JeebyCMS

## What This Is

A publishable npm package (`jeebycms`) that provides a block-based content rendering system for the front-end and a full `/admin` CMS panel for Next.js App Router projects. It uses Firebase (Auth, Firestore, Storage), supports drag-and-drop block reordering, draft/publish workflow, and multi-page support with nested sub-routes.

## Core Value

Developers can drop a fully functional CMS into any Next.js project in minutes, with zero lock-in to a specific design system — the package renders content using the site's own styles.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Package published to npm as `jeebycms` with two entry points (`jeebycms` and `jeebycms/admin`)
- [ ] Front-end: CMSProvider, Blocks, Block, getCMSContent, useCMSContent exports
- [ ] Admin panel: AdminPanel, withCMSAuth exports
- [ ] Block types: Title, Paragraph, RichText, Image, Video, Gallery
- [ ] Firebase Auth: email/password login, session management, withCMSAuth middleware
- [ ] Firestore data model: pages with draft/published blocks
- [ ] Admin routing: Page Manager, Page Editor, Settings
- [ ] Drag-and-drop block reordering via Framer Motion
- [ ] Draft/publish workflow with auto-save
- [ ] Multi-page support with slug-based routing and template registration
- [ ] Media handling: Firebase Storage uploads + embed URL support
- [ ] CSS strategy: scoped admin styles + CSS custom properties for consumer override
- [ ] TSUP build: ESM + CJS outputs, separate admin entry, tree-shaking

### Out of Scope

- User roles (editor vs admin) — post-v1 complexity
- Per-block draft toggle — stretch feature
- Page preview mode — post-v1
- Custom block registration API — post-v1
- Subcollection fallback for 1MB pages — stretch
- Webhooks on publish — post-v1
- Versioning / publish history — post-v1
- Real-time collaboration — not planned
- Mobile app — web-first

## Context

- **Stack:** Next.js (App Router, JavaScript), Firebase (Auth + Firestore + Storage), Framer Motion, Tailwind (consumer-applied), TSUP (bundler)
- **Two entry points:** `jeebycms` (frontend) and `jeebycms/admin` (admin panel) — tree-shaken via named exports
- **Firestore data model:** `/cms/pages/{pageId}` with `draft.blocks` and `published.blocks` arrays; 1MB document limit is acceptable for typical use
- **"use client" strategy:** Hooks and context components marked explicitly; `getCMSContent` is server-safe; Firebase SDK is a peer dependency (not bundled)
- **CSS:** Admin styles scoped under `.jeebycms-admin`; CSS custom properties (`--jeebycms-max-width`, `--jeebycms-block-spacing`) for consumer override; no visual opinions on content styles

## Constraints

- **Tech stack:** Next.js App Router + JavaScript (no TypeScript for v1)
- **Peer deps:** react, react-dom, next, firebase, framer-motion — all external (not bundled)
- **Bundle:** TSUP with ESM + CJS, separate entry files to avoid "use client" conflicts
- **Auth:** Firebase Admin SDK for SSR middleware requires consumer to configure service account env vars

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two TSUP entry points (index + admin) | Prevents "use client" banner from contaminating server utilities | — Pending |
| Peer dependencies for Firebase + Framer Motion | Avoids double-bundling; consumer already has these installed | — Pending |
| Firestore doc-per-page model | Simple; 1MB limit acceptable for typical page sizes | — Pending |
| CSS custom properties over Tailwind | Theme-agnostic; no Tailwind config required in consumer | — Pending |
| JavaScript (not TypeScript) | Faster iteration for v1; types can be added post-launch | — Pending |

---
*Last updated: 2026-03-10 after initialization from PLANNING.md*
