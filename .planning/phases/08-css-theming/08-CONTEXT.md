# Phase 8: CSS & Theming - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship `dist/styles.css` — a self-contained CSS file that styles the admin panel under `.jeeby-cms-admin` without leaking visual opinions onto consumer content. Expose CSS custom properties for consumer override. Block components already accept `className` and have no visual styles (CSS-03, CSS-04 structurally satisfied in prior phases).

</domain>

<decisions>
## Implementation Decisions

### Visual Polish Level
- Target aesthetic: functional & clean, Linear/Notion style — tighter spacing, considered hierarchy, no raw HTML aesthetic
- Not a showcase UI — readable, well-proportioned, and consistent but not polished to demo-video level
- Phase 8 establishes the foundation; a visual polish pass with pbakaus/impeccable is planned as a follow-up after Phase 8 lands

### Color Scheme — Dark Default
- Dark theme is the default (Notion dark palette: warm near-black ~#191919, warm dark gray surfaces)
- Accent color: soft blue (~#4A90D9 range) — readable on dark, not oversaturated
- Light mode is a future stretch goal — Phase 8 does NOT implement light mode styles
- Mechanism for future light mode: `data-theme="light"` attribute on `.jeeby-cms-admin` wrapper (CSS selector ready, styles deferred)

### Consumer Theming Surface
- CSS vars declared and defaulted under `.jeeby-cms-admin { ... }` — scoped, no global pollution
- Four admin color vars exposed for consumer override:
  - `--jeeby-cms-accent` — primary action color (buttons, links, active nav)
  - `--jeeby-cms-focus-ring` — focus indicator color (accessibility-important for brand matching)
  - `--jeeby-cms-bg-surface` — admin panel background
  - `--jeeby-cms-text-primary` — main admin UI text color
- Block layout vars (already established in prior phases): `--jeeby-cms-max-width`, `--jeeby-cms-block-spacing`, `--jeeby-cms-gallery-columns`
- Consumer overrides by targeting: `.jeeby-cms-admin { --jeeby-cms-accent: #your-color; }`
- A theming section is added to README.md in this phase documenting all CSS vars and how to override them

### Inline Style Migration
- Strategy: migrate visual styles (spacing, color, layout) to CSS; keep accessibility-critical inline styles in place
- Inline styles to KEEP: `style={{ display: 'none' }}` on live regions and screen-reader-only elements, ARIA-related conditional display, any inline style where the value is dynamic/runtime
- Inline styles to MIGRATE: hardcoded colors, font sizes, padding/margin values, max-width, cursor, background — anything static that belongs in CSS
- While touching admin component files, clean up stale duplicate files in the `src/admin/` subdirectory (e.g., old copies that exist alongside canonical files)

### Claude's Discretion
- Exact typographic scale (font sizes, line heights, font-weight choices)
- Specific spacing values beyond "tighter, Linear-style"
- CSS file organization / section order
- Whether to use CSS nesting syntax or flat selectors
- Build integration approach for `dist/styles.css` (copy step, tsup plugin, or postbuild script)
- Exact Notion dark palette values (use ~#191919 and warm grays as the palette direction)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CSS Requirements
- `.planning/REQUIREMENTS.md` §CSS — CSS-01 through CSS-04 define the four acceptance criteria for this phase
- `.planning/ROADMAP.md` §Phase 8 — Success criteria list (5 items including `dist/styles.css` build artifact, `.jeeby-cms-admin` scoping, no block style leaks, CSS vars working, `className` prop)

### Established CSS var contract (from prior phases)
- `.planning/phases/03-front-end-block-system/03-CONTEXT.md` — Established `--jeeby-cms-gallery-columns` as part of the custom property strategy; must be included in `dist/styles.css`
- `.planning/phases/01-package-scaffolding/01-CONTEXT.md` — `dist/styles.css` export declared as `"./dist/styles.css"` in package.json

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All admin components (`src/admin/*.js`): already use `jeeby-cms-*` class names and inline styles — both migrate to CSS in this phase
- `src/blocks/*.js`: `Gallery`, `Image`, `Paragraph`, `RichText`, `Title`, `Video` — already accept and apply `className` prop; no styling needed here
- `src/admin/index.js`: Admin root component that applies `.jeeby-cms-admin` wrapper — this is where `data-theme` attribute support may be wired

### Established Patterns
- Class naming: `jeeby-cms-` prefix for all admin classes (e.g., `jeeby-cms-btn-primary`, `jeeby-cms-login-card`, `jeeby-cms-page-manager`)
- All admin styles must nest under `.jeeby-cms-admin` to prevent leaking to consumer pages
- Inline styles are currently used heavily across admin (LoginPage, BlockCanvas, PageManager, modals) — targeted for migration
- Block components deliberately have no CSS — consumer applies their own styles via `className`

### Integration Points
- `tsup.config.js`: 3-entry array config; CSS must be output separately (tsup doesn't process CSS natively — a postbuild copy or separate mechanism is needed)
- `package.json` `exports`: `"./dist/styles.css"` entry already declared — just needs the file to exist at build time
- `dist/` is the output directory; `files: ["dist"]` in package.json means `dist/styles.css` will be included in the published package

</code_context>

<specifics>
## Specific Ideas

- Notion dark as the palette reference: warm near-black backgrounds (~#191919), warm dark gray cards/panels
- Soft blue accent (~#4A90D9) for buttons, focus rings, active states
- Linear/Notion tightness: compact nav, clear visual hierarchy without heavy borders or drop shadows
- `data-theme="light"` attribute on `.jeeby-cms-admin` is the hook for future light mode — structure the CSS to support it even if light styles aren't implemented in Phase 8

</specifics>

<deferred>
## Deferred Ideas

- Light mode styles — Phase 8 adds the `data-theme="light"` mechanism but does not implement light colors; full light theme is a future stretch goal
- Visual polish pass with pbakaus/impeccable — planned as a follow-up after Phase 8 lands, not part of Phase 8 scope
- Togglable light/dark mode UI control in the admin panel — future phase (depends on light styles existing)

</deferred>

---

*Phase: 08-css-theming*
*Context gathered: 2026-03-19*
