# Project State: JeebyCMS

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Developers can drop a fully functional CMS into any Next.js project in minutes, with zero lock-in to a specific design system
**Current focus:** Phase 1 — Package Scaffolding

## Phase Status

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Package Scaffolding | ○ Pending | — |
| 2 | Firebase Layer | ○ Pending | — |
| 3 | Front-End Block System | ○ Pending | — |
| 4 | Admin Auth | ○ Pending | — |
| 5 | Page Manager | ○ Pending | — |
| 6 | Block Editor | ○ Pending | — |
| 7 | Draft / Publish | ○ Pending | — |
| 8 | CSS & Theming | ○ Pending | — |
| 9 | Media Handling | ○ Pending | — |
| 10 | Polish & Publish | ○ Pending | — |

## Key Decisions Log

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Two TSUP entry points | 1 | Prevents "use client" from contaminating server utilities |
| Peer deps for Firebase + Framer Motion | 1 | Avoids double-bundling |
| Firestore doc-per-page | 2 | Simple; 1MB limit acceptable |
| CSS custom properties | 8 | Theme-agnostic theming |
| JavaScript (not TypeScript) | — | Faster v1 iteration |

---
*Initialized: 2026-03-10*
