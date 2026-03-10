# Phase 1: Package Scaffolding - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Init repo, TSUP build config, package.json exports, and stub exports for all three entry points. Goal is a working build pipeline that validates tree-shaking and dual-entry (plus server entry) bundling before any real code is written.

</domain>

<decisions>
## Implementation Decisions

### Package Identity
- Package name: `jeeby-cms` (hyphenated)
- Starting version: `0.1.0`
- License: MIT

### Entry Points
- Three entry points scaffolded in Phase 1:
  1. `jeeby-cms` — frontend client components (`"use client"` banner applied at entry level)
  2. `jeeby-cms/admin` — admin panel components (no banner at entry; individual files mark themselves)
  3. `jeeby-cms/server` — server-safe utilities only (no `"use client"` banner)
- `"use client"` banner applied to the index entry only via TSUP config
- Admin and server entries have no entry-level banner

### Server Entry
- `jeeby-cms/server` exports `getCMSContent` only at stub stage
- `useCMSContent` lives in the client entry (it uses hooks, requires `"use client"`)
- This separation prevents server components from accidentally importing client-only code

### Stub Behavior
- All stubs return `null` (components) or return `undefined` / no-op (functions)
- Silent stubs — nothing breaks, nothing renders during scaffold validation
- Verification: import package into a local Next.js app via `npm link` or relative path and confirm all three entry points resolve without errors

### Claude's Discretion
- Exact TSUP config structure and options beyond what's specified
- package.json fields beyond `exports`, `peerDependencies`, `files`, `version`, `license`
- Whether to include a `types` field (JavaScript-only for v1, so minimal)

</decisions>

<specifics>
## Specific Ideas

- Import pattern to validate: `import { CMSProvider } from 'jeeby-cms'`, `import { AdminPanel } from 'jeeby-cms/admin'`, `import { getCMSContent } from 'jeeby-cms/server'`
- Consumer should be able to import from `jeeby-cms/dist/styles.css` for the CSS bundle

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — this phase establishes the patterns for all subsequent phases

### Integration Points
- TSUP config established here is the foundation all subsequent phases build on
- Entry file locations (`src/index.js`, `src/admin/index.js`, `src/server/index.js`) established here must be consistent with Phase 2+ file structure

</code_context>

<deferred>
## Deferred Ideas

- Accessibility agents integration (https://github.com/Community-Access/accessibility-agents) — noted for a later phase; will need to determine where in the build/test pipeline these fit
- TypeScript types — post-v1 addition
- Fourth entry or additional exports beyond the three defined

</deferred>

---

*Phase: 01-package-scaffolding*
*Context gathered: 2026-03-10*
