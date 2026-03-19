# Phase 8: CSS & Theming - Research

**Researched:** 2026-03-18
**Domain:** CSS authoring, build pipeline integration, inline style migration, dark theme, CSS custom properties
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dark theme is the default (Notion dark palette: warm near-black ~#191919, warm dark gray surfaces)
- Accent color: soft blue (~#4A90D9 range)
- Light mode deferred — Phase 8 does NOT implement light mode styles
- Mechanism for future light mode: `data-theme="light"` attribute on `.jeeby-cms-admin` wrapper — structure CSS to support it but no light styles
- Four CSS vars exposed: `--jeeby-cms-accent`, `--jeeby-cms-focus-ring`, `--jeeby-cms-bg-surface`, `--jeeby-cms-text-primary` — all scoped under `.jeeby-cms-admin { ... }`
- Consumer overrides by targeting: `.jeeby-cms-admin { --jeeby-cms-accent: #your-color; }`
- Block layout vars from prior phases also declared in this file: `--jeeby-cms-max-width`, `--jeeby-cms-block-spacing`, `--jeeby-cms-gallery-columns`
- Migration strategy: migrate visual styles to CSS, keep accessibility-critical inline styles in place
- Inline styles to KEEP: `style={{ display: 'none' }}` on live regions and screen-reader-only elements, ARIA-related conditional display, any inline style where value is dynamic/runtime
- Inline styles to MIGRATE: hardcoded colors, font sizes, padding/margin values, max-width, cursor, background — anything static that belongs in CSS
- While touching admin component files, clean up stale duplicate files in `src/admin/` subdirectory
- Add theming section to README.md documenting all CSS vars and how to override them
- Aesthetic: functional & clean, Linear/Notion style — tighter spacing, considered hierarchy
- Phase 8 establishes the foundation; visual polish pass with pbakaus/impeccable is planned as follow-up

### Claude's Discretion
- Exact typographic scale (font sizes, line heights, font-weight choices)
- Specific spacing values beyond "tighter, Linear-style"
- CSS file organization / section order
- Whether to use CSS nesting syntax or flat selectors
- Build integration approach for `dist/styles.css` (copy step, tsup plugin, or postbuild script)
- Exact Notion dark palette values (use ~#191919 and warm grays as the palette direction)

### Deferred Ideas (OUT OF SCOPE)
- Light mode styles — Phase 8 adds the `data-theme="light"` mechanism but does not implement light colors
- Visual polish pass with pbakaus/impeccable — planned as follow-up after Phase 8 lands
- Togglable light/dark mode UI control in the admin panel — future phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CSS-01 | Admin panel UI styles are scoped under `.jeeby-cms-admin` | All 38 class names already carry `jeeby-cms-` prefix; CSS file nests everything under `.jeeby-cms-admin { }` wrapper |
| CSS-02 | CSS custom properties `--jeeby-cms-max-width` and `--jeeby-cms-block-spacing` are exposed for consumer override | Declared as defaults under `.jeeby-cms-admin { }` — consumers override with same selector |
| CSS-03 | Block components accept `className` prop for consumer-applied styles | Confirmed satisfied structurally (Title.js verified, pattern consistent across blocks) — no CSS work needed |
| CSS-04 | No color, typography, or visual opinions are applied to content blocks | Block components have zero CSS — confirmed by source inspection. `styles/cms.css` must not target block elements |
</phase_requirements>

---

## Summary

Phase 8 is a CSS authoring and inline-style migration phase. The build pipeline already handles CSS distribution: `package.json` build script runs `cp styles/cms.css dist/styles.css` after tsup, and `package.json` exports already declare `"./dist/styles.css": "./dist/styles.css"`. The source file `styles/cms.css` is a stub waiting to be populated.

There are 38 unique CSS class names across admin components and 107 inline `style={{}}` occurrences. Approximately 80+ are visual (migrate to CSS); a smaller set are accessibility-critical or runtime-dynamic (keep inline). The migration touches every admin component file. Component files also contain a handful of hardcoded hex values (`#1f2937`, `#f9fafb`, `#fff`) that must be replaced with CSS vars or moved into the stylesheet.

CSS-03 and CSS-04 are structurally satisfied from prior phases. Block components already accept `className` and carry no CSS. Phase 8 must only ensure `styles/cms.css` does not introduce styles targeting block elements. No stale duplicate files were found in `src/admin/` — the directory is clean; the CONTEXT.md mention of cleanup appears precautionary.

**Primary recommendation:** Write `styles/cms.css` with all admin styles nested under `.jeeby-cms-admin`, declare all CSS vars with dark-theme defaults, migrate the ~80+ visual inline styles to CSS classes, keep accessibility-critical inline styles in place, and add the `data-theme="light"` selector stub.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plain CSS | N/A | Single `styles/cms.css` stylesheet | No build-time CSS processor needed; tsup is not in the CSS pipeline |
| Node.js `cp` (shell) | Built-in | Copy `styles/cms.css` → `dist/styles.css` at build time | Already wired in `package.json` build script — no additional tooling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS custom properties | CSS spec | Consumer theming surface + internal design tokens | All color and spacing values — never hardcoded hex in CSS rules |
| CSS nesting (native) | Modern browsers | Scoping all rules under `.jeeby-cms-admin` | Reduces repetition; supported by all modern browsers; no preprocessor needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain CSS | CSS Modules or styled-components | Not viable — this is a published package, consumers import a static CSS file |
| Shell `cp` | tsup CSS entry or postcss plugin | cp already works and is already in the build script; no reason to change |
| CSS nesting | Flat selectors with `.jeeby-cms-admin .classname` | Flat is more compatible but verbose; nesting is cleaner and all target browsers support it |

**Installation:** No additional packages required. Build mechanism already in place.

---

## Architecture Patterns

### Source CSS Location
```
styles/
└── cms.css          # Source — populated in Phase 8

dist/
└── styles.css       # Output — produced by `cp styles/cms.css dist/styles.css` in build script
```

### CSS File Organization (recommended section order)
```css
/* 1. CSS Custom Properties (all vars under .jeeby-cms-admin) */
/* 2. Reset / Base (scoped — only what the admin UI needs) */
/* 3. Layout Shell (.jeeby-cms-admin, .jeeby-cms-nav, .jeeby-cms-shell-content) */
/* 4. Skip Link (.jeeby-cms-skip-link) */
/* 5. Login Page (.jeeby-cms-login-page, .jeeby-cms-login-card, etc.) */
/* 6. Page Manager (.jeeby-cms-page-manager, .jeeby-cms-pages-table, etc.) */
/* 7. Page Editor / Editor Header (.jeeby-cms-page-editor, .jeeby-cms-editor-header, etc.) */
/* 8. Block Canvas (.jeeby-cms-block-canvas, block card patterns) */
/* 9. Editors (toolbar, fields, TitleEditor, TextEditor, etc.) */
/* 10. Modals (.jeeby-cms-modal-backdrop, .jeeby-cms-modal-card) */
/* 11. Toasts (.jeeby-cms-publish-toast, .jeeby-cms-undo-toast) */
/* 12. Buttons (.jeeby-cms-btn-primary, .jeeby-cms-btn-ghost, .jeeby-cms-btn-destructive) */
/* 13. Form elements (.jeeby-cms-field, inputs, labels, .jeeby-cms-inline-error) */
/* 14. Spinner / Loading (.jeeby-cms-spinner, @keyframes jeeby-spin) */
/* 15. data-theme="light" stub (empty selector, documented comment) */
```

### Pattern 1: All Rules Nested Under Root Scope
**What:** Every admin CSS rule lives inside `.jeeby-cms-admin { }`. No rule targets anything outside this scope.
**When to use:** All admin UI rules without exception.
**Example:**
```css
/* Source: CSS spec — CSS nesting */
.jeeby-cms-admin {
  /* CSS vars */
  --jeeby-cms-accent: #4a90d9;
  --jeeby-cms-focus-ring: #4a90d9;
  --jeeby-cms-bg-surface: #1f1f1d;
  --jeeby-cms-text-primary: #e8e6e1;

  /* Shell */
  min-height: 100vh;
  background-color: var(--jeeby-cms-bg-surface);
  color: var(--jeeby-cms-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  box-sizing: border-box;
}

.jeeby-cms-admin *,
.jeeby-cms-admin *::before,
.jeeby-cms-admin *::after {
  box-sizing: inherit;
}
```

### Pattern 2: CSS Vars for All Color and Spacing Tokens
**What:** Never write a hex color or hardcoded spacing value directly in a selector rule. Always declare it as a CSS var default under `.jeeby-cms-admin`.
**When to use:** Every color value, every layout dimension that is a "design decision."
**Example:**
```css
.jeeby-cms-admin {
  --jeeby-cms-accent: #4a90d9;
  --jeeby-cms-bg-card: #252521;
  --jeeby-cms-border: rgba(255, 255, 255, 0.08);
  --jeeby-cms-nav-height: 56px;
}

.jeeby-cms-nav {
  background: var(--jeeby-cms-bg-surface);
  border-bottom: 1px solid var(--jeeby-cms-border);
  height: var(--jeeby-cms-nav-height);
}
```

### Pattern 3: data-theme Hook for Future Light Mode
**What:** A stub selector at the bottom of the CSS file that overrides color vars when `data-theme="light"` is set.
**When to use:** Include the selector now (Phase 8), leave it empty with a comment. Wired but not implemented.
**Example:**
```css
/* Future light mode — override vars here when implemented */
.jeeby-cms-admin[data-theme="light"] {
  /* --jeeby-cms-bg-surface: #ffffff; */
  /* --jeeby-cms-text-primary: #1a1a1a; */
}
```

The `data-theme` attribute is added to the root `.jeeby-cms-admin` div in `src/admin/index.js`. No dark-theme value is needed (dark is the default), so no `data-theme="dark"` attribute is required.

### Pattern 4: Keep Accessibility-Critical Inline Styles
**What:** Certain inline styles are intentionally kept out of the CSS file.
**When to use:** Always defer to inline for these cases.

Styles to KEEP inline (confirmed from source scan):
- `style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}` on `.jeeby-cms-admin` loading/login wrappers — these are layout states controlled by render branches, migrating saves little
- `style={{ opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}` on BlockCanvas drag/delete row — value is dynamic (hovered state), cannot be static CSS
- `style={{ cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer' }}` on publish button — cursor depends on runtime state; keep inline
- `style={{ pointerEvents: ... ? 'none' : undefined }}` — conditional runtime value
- `@keyframes jeeby-spin` injected via `<style>` tag in index.js — MOVE this to `styles/cms.css`; it does not need to be a `<style>` tag

### Anti-Patterns to Avoid
- **Targeting block elements from the CSS file:** Never add rules for `.jeeby-cms-block`, `p`, `h2`, etc. outside `.jeeby-cms-admin` scope — this violates CSS-04
- **Hardcoding hex values in CSS rules:** Use CSS vars for all colors — consumer must be able to override
- **Adding visual styles to block component class names:** Block components use consumer-provided `className` — never define visual rules for those in `styles/cms.css`
- **Using `!important` to fight specificity:** The `.jeeby-cms-admin` scope provides sufficient specificity without it

---

## Complete CSS Class Inventory

All 38 class names found via source scan that need styles authored:

| Class | Component | Notes |
|-------|-----------|-------|
| `.jeeby-cms-admin` | index.js | Root scope — holds all CSS vars |
| `.jeeby-cms-nav` | AdminNav.js | Top nav bar, `height: 56px` |
| `.jeeby-cms-nav-brand` | AdminNav.js | Logo/name text |
| `.jeeby-cms-shell-content` | index.js | Main content area below nav |
| `.jeeby-cms-skip-link` | index.js | Off-screen until focused |
| `.jeeby-cms-loading` | index.js | Loading state wrapper |
| `.jeeby-cms-spinner` | index.js | Animated spin element, references `@keyframes jeeby-spin` |
| `.jeeby-cms-login-page` | LoginPage.js | Full-page login wrapper |
| `.jeeby-cms-login-card` | LoginPage.js | Card: `max-width: 400px; min-width: 320px` |
| `.jeeby-cms-login-heading` | LoginPage.js | H1 inside login card |
| `.jeeby-cms-login-form` | LoginPage.js | Form element |
| `.jeeby-cms-field` | LoginPage.js, modals | Label + input wrapper |
| `.jeeby-cms-auth-error` | LoginPage.js | Error message paragraph |
| `.jeeby-cms-page-manager` | PageManager.js | Page list view |
| `.jeeby-cms-page-list-header` | PageManager.js | Header row above table |
| `.jeeby-cms-pages-empty` | PageManager.js | Empty state |
| `.jeeby-cms-pages-table` | PageManager.js | Table: `width: 100%; border-collapse: collapse` |
| `.jeeby-cms-inline-edit-input` | PageManager.js | Inline slug/name edit input |
| `.jeeby-cms-live-region` | PageManager.js | Visually hidden live region (KEEP `display: none` or sr-only inline) |
| `.jeeby-cms-page-editor` | PageEditor.js | Page editor shell |
| `.jeeby-cms-editor-header` | EditorHeader.js | Top header bar: flex, space-between |
| `.jeeby-cms-editor-title` | EditorHeader.js | H1 inside header: `margin: 0` |
| `.jeeby-cms-editor-main` | PageEditor.js | Editor content area: `min-height: calc(100vh - 120px)` |
| `.jeeby-cms-slug-prefix` | EditorHeader.js | The "/" before slug input |
| `.jeeby-cms-slug-input` | EditorHeader.js | Inline slug edit input |
| `.jeeby-cms-slug-hint` | EditorHeader.js | "Press Enter to rename" hint |
| `.jeeby-cms-publish-controls` | EditorHeader.js | Right side of editor header: flex, gap |
| `.jeeby-cms-publish-status` | EditorHeader.js | "Last published: ..." text |
| `.jeeby-cms-draft-indicator` | EditorHeader.js | "Unpublished changes" indicator |
| `.jeeby-cms-block-canvas` | BlockCanvas.js | Canvas wrapper: `max-width: 720px; margin: 0 auto` |
| `.jeeby-cms-publish-toast` | PublishToast.js | Fixed toast: bottom-center, dark bg |
| `.jeeby-cms-undo-toast` | UndoToast.js | Fixed toast: same pattern as publish toast |
| `.jeeby-cms-modal-backdrop` | All modals | Fixed overlay: `position: fixed; inset: 0; z-index: 1000` |
| `.jeeby-cms-modal-card` | All modals | Modal card: `max-width` varies per instance |
| `.jeeby-cms-inline-error` | PublishConfirmModal.js | Inline error in modal |
| `.jeeby-cms-btn-primary` | Many | Primary action button |
| `.jeeby-cms-btn-ghost` | Many | Ghost/text button |
| `.jeeby-cms-btn-destructive` | PageManager.js | Destructive action button |
| `.jeeby-cms-gallery-preview` | GalleryEditor.js | Gallery thumbnail preview area |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS distribution from package | Custom webpack plugin | Shell `cp` in build script | Already working — `cp styles/cms.css dist/styles.css` in package.json |
| Focus management in modals | New focus trap logic | Existing code in PublishConfirmModal, UnsavedChangesWarning, CreatePageModal, DeletePageModal | Focus traps are already implemented and tested |
| Skip link | New implementation | Existing `.jeeby-cms-skip-link` in index.js | Already in DOM — just needs CSS to make it visible on focus |
| Spinner animation | Inline `<style>` tag | Move `@keyframes jeeby-spin` to `styles/cms.css` | Cleaner; `<style>` tag in JSX is the one thing to migrate from index.js |

**Key insight:** This phase is "write the CSS that was always intended to exist." The component structure, class naming, and build pipeline were designed for this phase. There is almost nothing to architect — just implement.

---

## Common Pitfalls

### Pitfall 1: Migrating Accessibility-Critical Inline Styles to CSS
**What goes wrong:** Developer migrates all inline styles to CSS, including `display: 'none'` on live regions, which causes screen reader announcements to break or WCAG violations.
**Why it happens:** The scan shows `display: 'none'` appearing in `PageManager.js` live region divs — these look like layout styles but are accessibility-functional.
**How to avoid:** The rule is simple: if an inline style is on an element with `aria-live`, `role="status"`, `role="alert"`, or is a screen-reader-only element, do NOT migrate it to CSS. Keep it inline.
**Warning signs:** Any `style` prop on an element that also has `aria-*` attributes.

### Pitfall 2: Hardcoded Colors Remaining After Migration
**What goes wrong:** `PublishToast.js` and `UndoToast.js` have `background: '#1f2937'` and `color: '#f9fafb'` hardcoded. `UnsavedChangesWarning.js` has `background: '#fff'` (a light color that would look wrong on dark theme). These must all move to CSS vars.
**Why it happens:** These were written as placeholders before Phase 8.
**How to avoid:** After writing CSS classes for these elements, do a final grep for hex color literals in admin component files and remove any that survived.
**Warning signs:** `grep -r '#[0-9a-fA-F]' src/admin/ --include="*.js"` showing results after migration.

### Pitfall 3: CSS Specificity Leaking to Consumer Pages
**What goes wrong:** A selector like `.jeeby-cms-btn-primary` (without the `.jeeby-cms-admin` ancestor) would match any element on the consumer's page that happened to use that class name.
**Why it happens:** Writing flat selectors instead of nesting under `.jeeby-cms-admin`.
**How to avoid:** Every selector in `styles/cms.css` must start with `.jeeby-cms-admin` (or use CSS nesting inside `.jeeby-cms-admin { }` block). No exceptions.
**Warning signs:** Any selector in `styles/cms.css` that does not begin with `.jeeby-cms-admin`.

### Pitfall 4: Declaring Block Layout Vars Without Defaults
**What goes wrong:** `--jeeby-cms-max-width` and `--jeeby-cms-block-spacing` are referenced by block components in prior phases but may not have defaults declared — `CSS-02` requires they be present and overridable.
**Why it happens:** Block vars were established in Phase 3 but `styles/cms.css` was a stub.
**How to avoid:** Declare all block layout vars with sensible defaults under `.jeeby-cms-admin`:
```css
.jeeby-cms-admin {
  --jeeby-cms-max-width: 720px;
  --jeeby-cms-block-spacing: 1.5rem;
  --jeeby-cms-gallery-columns: 3;
}
```
**Warning signs:** CSS-02 verification step fails if these vars are absent from `dist/styles.css`.

### Pitfall 5: The `@keyframes jeeby-spin` Living in JSX
**What goes wrong:** `src/admin/index.js` currently injects spinner animation via `<style>{`@keyframes jeeby-spin { ... }`}</style>`. This is the one inline style pattern that SHOULD move to CSS, but it's easy to overlook because it's not a `style={{}}` prop.
**Why it happens:** It was a practical workaround before the CSS file existed.
**How to avoid:** Move `@keyframes jeeby-spin { to { transform: rotate(360deg) } }` to `styles/cms.css`, then remove the `<style>` JSX element from `index.js`.
**Warning signs:** `grep -r '@keyframes' src/admin/` still showing results after migration.

### Pitfall 6: CSS Nesting Browser Compatibility
**What goes wrong:** CSS nesting is a newer syntax; older tooling (PostCSS without nesting plugin, older cssnano) may not handle it.
**Why it happens:** The package ships raw CSS with no build transform.
**How to avoid:** Since this package ships plain CSS (no PostCSS), use flat selectors as the safe default. Reserve CSS nesting only for the top-level `.jeeby-cms-admin { }` vars block plus immediate descendants. For all component-level rules, use explicit `.jeeby-cms-admin .classname` selectors.
**Warning signs:** If targeting legacy browser support is a future requirement, switch to flat selectors throughout.

---

## Code Examples

### Skip Link Pattern
```css
/* Accessible skip link — off-screen until focused */
.jeeby-cms-admin .jeeby-cms-skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 1000;
  background: var(--jeeby-cms-accent);
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
}

.jeeby-cms-admin .jeeby-cms-skip-link:focus {
  left: 0;
}
```

### Button Variants
```css
/* All buttons get minimum 44px touch target (WCAG 2.5.8) */
.jeeby-cms-admin .jeeby-cms-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  background: var(--jeeby-cms-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.jeeby-cms-admin .jeeby-cms-btn-primary:focus-visible {
  outline: 2px solid var(--jeeby-cms-focus-ring);
  outline-offset: 2px;
}

.jeeby-cms-admin .jeeby-cms-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 12px;
  background: none;
  border: none;
  color: var(--jeeby-cms-text-primary);
  cursor: pointer;
  border-radius: 6px;
}

.jeeby-cms-admin .jeeby-cms-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
}

.jeeby-cms-admin .jeeby-cms-btn-destructive {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

### Modal Backdrop + Card
```css
.jeeby-cms-admin .jeeby-cms-modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
}

.jeeby-cms-admin .jeeby-cms-modal-card {
  width: 100%;
  background: var(--jeeby-cms-bg-card);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--jeeby-cms-border);
}
```

### Toast (shared pattern)
```css
.jeeby-cms-admin .jeeby-cms-publish-toast,
.jeeby-cms-admin .jeeby-cms-undo-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 200;
  background: #2a2a27;
  color: var(--jeeby-cms-text-primary);
  border: 1px solid var(--jeeby-cms-border);
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
}
```

### Spinner + Keyframes
```css
/* Migrate from JSX <style> tag in src/admin/index.js */
@keyframes jeeby-spin {
  to { transform: rotate(360deg); }
}

.jeeby-cms-admin .jeeby-cms-spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--jeeby-cms-accent);
  border-radius: 50%;
  animation: jeeby-spin 0.75s linear infinite;
}
```

### Future Light Mode Stub
```css
/* Future light mode — override color vars here when implemented */
/* Triggered by: <div class="jeeby-cms-admin" data-theme="light"> */
.jeeby-cms-admin[data-theme="light"] {
  /* --jeeby-cms-bg-surface: #f5f5f3; */
  /* --jeeby-cms-bg-card: #ffffff; */
  /* --jeeby-cms-text-primary: #1a1918; */
  /* --jeeby-cms-border: rgba(0, 0, 0, 0.08); */
}
```

---

## Inline Style Migration Map

Categorized from source scan of all 107 `style={{}}` occurrences:

### Migrate to CSS (remove from component, style via class)

| Component | Inline Style | Migrate to Class |
|-----------|-------------|-----------------|
| index.js | `<style>{@keyframes jeeby-spin}</style>` | `styles/cms.css` @keyframes block |
| index.js | `style={{ minHeight: '100vh' }}` on root div | `.jeeby-cms-admin` CSS |
| index.js | `style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: 1000 }}` on skip link | `.jeeby-cms-skip-link` CSS |
| AdminNav.js | `style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}` | `.jeeby-cms-nav` CSS |
| AdminNav.js | `style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}` on Sign out button | `.jeeby-cms-btn-ghost` CSS |
| LoginPage.js | `style={{ maxWidth: '400px', minWidth: '320px', width: '100%' }}` on login card | `.jeeby-cms-login-card` CSS |
| LoginPage.js | `style={{ display: 'block' }}` on labels | `.jeeby-cms-field label` CSS |
| LoginPage.js | `style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}` on inputs | `.jeeby-cms-field input` CSS |
| LoginPage.js | `style={{ display: 'block', width: '100%', minHeight: '44px' }}` on submit button | `.jeeby-cms-btn-primary` CSS (already covers `min-height`) |
| BlockCanvas.js | `style={{ maxWidth: '720px', margin: '0 auto' }}` | `.jeeby-cms-block-canvas` CSS |
| BlockCanvas.js | `style={{ listStyle: 'none', padding: 0, margin: 0 }}` | `.jeeby-cms-block-canvas ol` CSS |
| BlockCanvas.js | `style={{ background: 'none', border: 'none', cursor: 'grab', minHeight: '44px', minWidth: '44px' }}` on drag handle | drag handle button class (add `.jeeby-cms-drag-handle`) |
| BlockCanvas.js | `style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}` on delete button | `.jeeby-cms-btn-ghost` CSS |
| PublishToast.js | `style={{ position: 'fixed', bottom: '24px', ... background: '#1f2937', color: '#f9fafb' }}` | `.jeeby-cms-publish-toast` CSS |
| UndoToast.js | Same toast pattern + button style | `.jeeby-cms-undo-toast` CSS + `.jeeby-cms-btn-ghost` |
| UnsavedChangesWarning.js | `style={{ background: '#fff' }}` on modal card | `.jeeby-cms-modal-card` CSS (use dark theme var) |
| UnsavedChangesWarning.js | `style={{ position: 'fixed', inset: 0, ... background: 'rgba(0,0,0,0.5)' }}` | `.jeeby-cms-modal-backdrop` CSS |
| All modals | `style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}` on button row | add `.jeeby-cms-modal-actions` class or style via CSS |
| EditorHeader.js | `style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}` | `.jeeby-cms-editor-header` CSS |
| EditorHeader.js | `style={{ margin: 0 }}` on h1 | `.jeeby-cms-editor-title` CSS |
| BlockTypePicker.js | `style={{ position: 'absolute', top: '100%', ... zIndex: 100 }}` on ul | `.jeeby-cms-block-type-picker` class CSS |
| BlockTypePicker.js | `style={{ cursor: 'pointer' }}` on li items | `.jeeby-cms-block-type-picker li` CSS |
| AddBlockButton.js | Static layout styles on wrapper div and `+` button | Add `.jeeby-cms-add-block-btn` class |
| TextEditor.js | `style={{ minHeight: '120px' }}` on editor div | `.jeeby-cms-text-editor-content` class CSS |
| TextEditor.js | Toolbar button styles | `.jeeby-cms-toolbar-btn` class CSS |

### Keep Inline (do NOT migrate)

| Component | Inline Style | Reason to Keep |
|-----------|-------------|----------------|
| index.js | `display: 'flex', alignItems: 'center', justifyContent: 'center'` on loading/login wrappers | These are state-conditional render branches; acceptable to keep |
| BlockCanvas.js | `opacity: hovered ? 1 : 0, transition: 'opacity 150ms'` | Dynamic runtime value |
| EditorHeader.js | `cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer'` | Runtime conditional |
| EditorHeader.js | `pointerEvents: ... ? 'none' : undefined` | Runtime conditional |
| PublishConfirmModal.js | `cursor: publishing ? 'not-allowed' : 'pointer'` | Runtime conditional |
| CreatePageModal.js | Same cursor conditional | Runtime conditional |
| DeletePageModal.js | Same cursor conditional | Runtime conditional |
| PageManager.js | `style={{ ... }}` on `.jeeby-cms-live-region` divs | Accessibility-critical — live regions, do not move |
| PageManager.js | `role="status"` loading spinner div `display: 'flex'` | State-conditional render |
| Reorder.Item | `style={{ listStyle: 'none' }}` | Applied by Framer Motion component prop |

---

## Build Integration — What Already Exists

The build pipeline is complete. No changes to `tsup.config.js` or `package.json` are needed.

Current `package.json` build script (confirmed):
```bash
tsup && cp styles/cms.css dist/styles.css && node -e "..."
```

The `cp` command copies `styles/cms.css` to `dist/styles.css` after tsup runs. `styles/cms.css` is the source file. It is a stub. Phase 8 populates it.

Export is already declared in `package.json`:
```json
"./dist/styles.css": "./dist/styles.css"
```

`sideEffects` in `package.json` already includes `"dist/styles.css"` so bundlers won't tree-shake it.

No action needed on build infrastructure. Phase 8 is purely CSS authoring + component inline style migration.

---

## Accessibility Requirements for CSS

The CSS file itself must satisfy these WCAG criteria:

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| WCAG 1.4.3 (Contrast — text) | 4.5:1 for normal text, 3:1 for large text | `--jeeby-cms-text-primary` on `--jeeby-cms-bg-surface` must pass. #e8e6e1 on #191919 = ~11:1. |
| WCAG 1.4.11 (Contrast — UI components) | 3:1 for interactive element borders/icons | Button borders, input borders vs background must be verified |
| WCAG 2.4.7 (Focus Visible) | Focus indicators must be visible | `:focus-visible` on all interactive elements using `--jeeby-cms-focus-ring` |
| WCAG 2.5.8 (Target Size — AA 2.2) | Minimum 24px, recommended 44px | All buttons: `min-height: 44px; min-width: 44px` already enforced in inline styles, must be in CSS |
| WCAG 1.4.4 (Resize Text) | Text must reflow at 200% zoom | Use relative units (rem/em) for font sizes and spacing where practical |

Focus ring pattern (already used in inline styles, must survive in CSS):
```css
/* Applies to all interactive elements inside .jeeby-cms-admin */
.jeeby-cms-admin :focus-visible {
  outline: 2px solid var(--jeeby-cms-focus-ring);
  outline-offset: 2px;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline styles for all component layout | CSS file + classes | Phase 8 | Enables consumer theming, reduces bundle size |
| `<style>` JSX tag for @keyframes | `@keyframes` in `styles/cms.css` | Phase 8 | Removes runtime style injection |
| Hardcoded hex in JS | CSS vars + `styles/css` | Phase 8 | Consumer can override 4 theme vars |

**Nothing deprecated** — this is a greenfield CSS authoring task.

---

## Open Questions

1. **CSS nesting vs flat selectors**
   - What we know: CSS nesting is supported in all modern browsers (Chrome 112+, Firefox 117+, Safari 16.5+). The package ships raw CSS with no transform.
   - What's unclear: Whether any consumer environment will serve the CSS through a tool that does not support nesting (e.g. very old PostCSS setup).
   - Recommendation: Use flat selectors (`.jeeby-cms-admin .classname`) throughout for maximum compatibility. Reserve nesting only for the root vars block and `:hover`/`:focus-visible` pseudo-classes on the same element.

2. **BlockCanvas drag-handle button — class name**
   - What we know: The drag handle button in `BlockCanvas.js` has no class name — only inline styles.
   - What's unclear: Whether to add `jeeby-cms-drag-handle` class or style it differently.
   - Recommendation: Add `className="jeeby-cms-drag-handle"` to the button element, add CSS for it. No functional change.

3. **Modal card `max-width` differs per instance**
   - What we know: `PublishConfirmModal` uses `maxWidth: '480px'`, `UnsavedChangesWarning` uses `maxWidth: '420px'`, `CreatePageModal` uses `maxWidth: '480px'`.
   - What's unclear: Whether to standardize to one value or keep per-instance.
   - Recommendation: Standardize to `max-width: 480px` in CSS for `.jeeby-cms-modal-card`. The 420px vs 480px difference is cosmetically insignificant.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | `scripts/test-register.js` (JSX transform hook) |
| Quick run command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js'` |
| Full suite command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/**/*.test.js'` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CSS-01 | `dist/styles.css` exists after build and all selectors are under `.jeeby-cms-admin` | build + structural | `node scripts/verify-exports.js` + grep on built file | ❌ Wave 0 (new test) |
| CSS-02 | `dist/styles.css` contains `--jeeby-cms-max-width` and `--jeeby-cms-block-spacing` var declarations | structural | grep on `dist/styles.css` | ❌ Wave 0 (new test) |
| CSS-03 | Block components accept `className` prop | unit (source inspection) | `node --import ./scripts/test-register.js --test 'src/blocks/*.test.js'` | ✅ Existing test pattern |
| CSS-04 | `styles/cms.css` contains no color/typography rules for block elements | structural | grep/parse on `styles/cms.css` | ❌ Wave 0 (new test) |

The existing test pattern for this project uses source-inspection (`readFileSync`) for structural checks rather than DOM rendering. CSS validation tests follow the same pattern: read the built CSS file and assert on its contents.

### Sampling Rate
- Per task commit: `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js'`
- Per wave merge: `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/**/*.test.js'`
- Phase gate: Full suite green + `dist/styles.css` contains expected selectors before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/admin/css-theming.test.js` — covers CSS-01 (dist/styles.css scoping), CSS-02 (var declarations), CSS-04 (no block element styles)
- [ ] Test verifies `dist/styles.css` exists (requires running `npm run build` first, or test reads `styles/cms.css` directly)

Note: CSS-03 is already covered by existing block component tests (block components accept className). The new test file should verify the CSS artifact, not the components.

---

## Sources

### Primary (HIGH confidence)
- Direct source scan of `/Users/joseph/Documents/Web Dev/jeeby-cms/src/admin/` — all component files read
- `package.json` build script — confirmed `cp styles/cms.css dist/styles.css` is already wired
- `styles/cms.css` — confirmed to be a stub file waiting to be populated
- `tsup.config.js` — confirmed CSS is not processed by tsup; copy step handles it

### Secondary (MEDIUM confidence)
- CONTEXT.md phase decisions — locked choices documented verbatim
- REQUIREMENTS.md CSS section — CSS-01 through CSS-04 requirements

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from build script; no external tools needed
- Architecture: HIGH — 38 class names catalogued from source, migration map built from source scan
- Pitfalls: HIGH — all pitfalls identified from actual code (hardcoded hex found in 3 files, @keyframes in JSX confirmed)
- Build integration: HIGH — confirmed working from package.json

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable domain — CSS/build pipeline)
