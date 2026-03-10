# Phase 1: Package Scaffolding - Research

**Researched:** 2026-03-10
**Domain:** TSUP bundler, npm package exports, tree-shaking, "use client" strategy
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Package name: `jeeby-cms` (hyphenated)
- Starting version: `0.1.0`
- License: MIT
- Three entry points scaffolded in Phase 1:
  1. `jeeby-cms` — frontend client components (`"use client"` banner applied at entry level)
  2. `jeeby-cms/admin` — admin panel components (no banner at entry; individual files mark themselves)
  3. `jeeby-cms/server` — server-safe utilities only (no `"use client"` banner)
- `"use client"` banner applied to the index entry only via TSUP config
- Admin and server entries have no entry-level banner
- `jeeby-cms/server` exports `getCMSContent` only at stub stage
- `useCMSContent` lives in the client entry (it uses hooks, requires `"use client"`)
- All stubs return `null` (components) or return `undefined` / no-op (functions)
- Silent stubs — nothing breaks, nothing renders during scaffold validation
- Verification: import package into a local Next.js app via `npm link` or relative path and confirm all three entry points resolve without errors

### Claude's Discretion
- Exact TSUP config structure and options beyond what's specified
- package.json fields beyond `exports`, `peerDependencies`, `files`, `version`, `license`
- Whether to include a `types` field (JavaScript-only for v1, so minimal)

### Deferred Ideas (OUT OF SCOPE)
- Accessibility agents integration — noted for a later phase
- TypeScript types — post-v1 addition
- Fourth entry or additional exports beyond the three defined
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PKG-01 | Package is installable via `npm install jeeby-cms` and exports `jeeby-cms` and `jeeby-cms/admin` entry points | TSUP multi-entry config + package.json `exports` subpath map documented below; third `./server` entry also required per CONTEXT.md |
| PKG-02 | TSUP builds ESM and CJS outputs for both entry points with tree-shaking | `format: ['esm', 'cjs']` + `treeshake: true` + `splitting: true` per verified TSUP 8.5.1 docs |
| PKG-03 | `dist/styles.css` is exported and importable by consumers | CSS must be produced via PostCSS + tsup or cp build step; exposed via `exports` field |
| PKG-04 | Firebase, React, Next.js, and Framer Motion are peer dependencies (not bundled) | `external` array in TSUP config + `peerDependencies` field in package.json |
</phase_requirements>

---

## Summary

Phase 1 establishes the build pipeline foundation for the entire project. The primary tool is TSUP (currently at version 8.5.1), which wraps esbuild and provides dual ESM/CJS output, tree-shaking, code splitting, and banner injection. The `defineConfig` API accepts an array of separate config objects, enabling per-entry-point settings — this is the key mechanism for applying the `"use client"` banner to the index entry only.

The three-entry architecture (`index`, `admin`, `server`) is well-supported by TSUP's array config pattern and aligns with standard React library practices for Next.js App Router. The `package.json` `exports` field maps all three subpaths with conditional `import`/`require` conditions, and `sideEffects: ["dist/styles.css"]` prevents the CSS from being tree-shaken away.

The main friction point in this phase is CSS bundling (TSUP's CSS support is experimental) and the `npm link` duplicate-React pitfall. Both have clear, documented workarounds: use a PostCSS-configured tsup build or a simple `cp` fallback for CSS; and use a direct path reference or pnpm workspaces instead of `npm link` to avoid duplicate React.

**Primary recommendation:** Use `tsup.config.js` exporting an array of three `defineConfig` entries (index with banner, admin without, server without), PostCSS for CSS output, and direct file reference (`"file:../jeeby-cms"`) in the consumer app for local verification.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsup | ^8.5.1 | Bundle TypeScript/JavaScript to ESM + CJS | esbuild-powered, minimal config, array-config for per-entry options |
| esbuild | (bundled with tsup) | Underlying bundler — handles banner, external, splitting | Fastest JS bundler; tsup is its primary wrapper |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| postcss | ^8 | Process CSS for dist/styles.css output | Required for tsup to emit CSS without raw-copy fallback |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsup | rollup directly | More control, but much more config for ESM+CJS dual output |
| tsup | tsdown | Newer, rolldown-based replacement; still immature as of 2026-03 |
| postcss for CSS | `cp styles/cms.css dist/` in build script | Simpler but no processing; fine for Phase 1 stubs since no real CSS yet |

**Installation:**
```bash
npm install --save-dev tsup
# For CSS bundling (optional in Phase 1 — stub CSS):
npm install --save-dev postcss
```

---

## Architecture Patterns

### Recommended Project Structure

```
jeeby-cms/
├── src/
│   ├── index.js            # client entry — "use client" banner applied by TSUP
│   ├── admin/
│   │   └── index.js        # admin entry — no entry banner
│   └── server/
│       └── index.js        # server entry — NO "use client"
├── styles/
│   └── cms.css             # source CSS — copied/processed to dist/styles.css
├── dist/                   # build output — git-ignored
│   ├── index.mjs
│   ├── index.js
│   ├── admin.mjs
│   ├── admin.js
│   ├── server.mjs
│   ├── server.js
│   └── styles.css
├── tsup.config.js
└── package.json
```

### Pattern 1: Array defineConfig for Per-Entry Banners

**What:** Export an array from `defineConfig` so each entry gets its own settings including its own `banner` option.

**When to use:** Any time different entry points require different directives. This is the standard approach for React libraries targeting Next.js App Router.

**Example:**
```javascript
// tsup.config.js
// Source: tsup 8.5.1 docs + verified against egoist/tsup GitHub issue #866 pattern
import { defineConfig } from 'tsup'

export default defineConfig([
  // Entry 1: client components — "use client" banner
  {
    entry: { index: 'src/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
    banner: { js: '"use client";' },
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  // Entry 2: admin components — no entry-level banner (files self-mark)
  {
    entry: { admin: 'src/admin/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  // Entry 3: server utilities — no "use client", no React client deps
  {
    entry: { server: 'src/server/index.js' },
    format: ['esm', 'cjs'],
    splitting: false,
    treeshake: true,
    external: ['firebase'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
])
```

### Pattern 2: package.json exports Field with Three Subpaths

**What:** The `exports` field maps package entry points to their compiled files, including conditional `import`/`require` for ESM vs CJS resolution.

**When to use:** Always — this is required for subpath imports (`jeeby-cms/admin`) to work.

**Example:**
```json
{
  "name": "jeeby-cms",
  "version": "0.1.0",
  "license": "MIT",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./admin": {
      "import": "./dist/admin.mjs",
      "require": "./dist/admin.js"
    },
    "./server": {
      "import": "./dist/server.mjs",
      "require": "./dist/server.js"
    },
    "./dist/styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "sideEffects": ["dist/styles.css"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "next": ">=14",
    "firebase": ">=10",
    "framer-motion": ">=11"
  }
}
```

### Pattern 3: Minimal Stub Exports

**What:** Each entry point exports its named symbols as stubs. Components return `null`, functions return `undefined`.

**When to use:** Phase 1 — validates the build pipeline before any real implementation.

**Example:**
```javascript
// src/index.js — client entry stub
export function CMSProvider({ children }) {
  return children ?? null
}
export function Blocks() { return null }
export function Block() { return null }
export function useCMSContent() { return null }

// src/admin/index.js — admin entry stub
export function AdminPanel() { return null }
export function withCMSAuth() { return function middleware() {} }

// src/server/index.js — server entry stub (no "use client")
export async function getCMSContent(slug) { return null }
```

### Pattern 4: CSS Output for Phase 1

**What:** Phase 1 only needs the `dist/styles.css` to exist (even empty or minimal). Two approaches:

Option A — TSUP with PostCSS (preferred for Phase 2+, where CSS grows):
```javascript
// tsup.config.js — fourth entry for CSS (add to array)
{
  entry: { styles: 'styles/cms.css' },
  // tsup emits styles.css when PostCSS is configured
}
```

Option B — Build script copy (simplest for Phase 1 stubs):
```json
{
  "scripts": {
    "build": "tsup && cp styles/cms.css dist/styles.css"
  }
}
```

**Recommendation for Phase 1:** Option B (copy) keeps the TSUP config clean. TSUP CSS bundling is marked experimental and adds PostCSS dependency unnecessarily before any real CSS exists. Phase 8 (CSS & Theming) is the right place to introduce PostCSS if needed.

### Anti-Patterns to Avoid

- **Single TSUP config for all three entries with one banner:** The `banner` field applies to every output file in that config block. A single config cannot selectively apply `"use client"` to index only — it would contaminate admin and server bundles.
- **"use client" in server entry:** The server entry (`src/server/index.js`) must never have `"use client"` at any level. Server Components import from `jeeby-cms/server` specifically to avoid the client directive.
- **Putting Firebase / React in `dependencies` instead of `peerDependencies`:** This bundles two copies of Firebase in the consumer's app. All heavy libraries used by consumers must be in `peerDependencies` + TSUP `external`.
- **`sideEffects: false` without CSS exemption:** If `sideEffects: false` globally, bundlers may tree-shake the CSS import. The value must be `["dist/styles.css"]` (array) not `false`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ESM + CJS dual output | Custom rollup/esbuild pipeline | tsup | Handles output extensions, splitting, externals, banners in one config |
| "use client" injection per entry | Post-build sed/awk script | tsup `banner` option per config block | tsup's `banner.js` is injected at the top of every output file in that config reliably |
| Tree-shaking verification | Manual bundle inspection | `@next/bundle-analyzer` with `ANALYZE=true npm run build` | Visual treemap shows whether admin bundle appears when only index is imported |
| peerDependency external exclusion | Manual esbuild `external` plugin | tsup `external` array | One-liner excludes all peers from bundle |

**Key insight:** The only custom code needed is the stub source files and the `tsup.config.js` array config. Everything else (output formats, extensions, externals, splitting) is handled by tsup's built-in options.

---

## Common Pitfalls

### Pitfall 1: Duplicate React with npm link

**What goes wrong:** `npm link` creates symlinks, causing the consumer app and the linked package to each resolve to their own `node_modules/react`. React throws "Invalid hook call" because there are two React copies.

**Why it happens:** Node module resolution follows the real path of symlinks, finding `react` in the package's own `node_modules` rather than the consumer app's.

**How to avoid:** Use a direct file path reference instead of `npm link`:
```json
// In consumer app's package.json
{
  "dependencies": {
    "jeeby-cms": "file:../jeeby-cms"
  }
}
```
Then `npm install` in the consumer. This uses a symlink too, but npm's resolution typically works better than `npm link` for peerDependencies scenarios. If it still fails, add to consumer's `next.config.js`:
```javascript
const path = require('path')
module.exports = {
  webpack: (config) => {
    config.resolve.alias['react'] = path.resolve('./node_modules/react')
    config.resolve.alias['react-dom'] = path.resolve('./node_modules/react-dom')
    return config
  }
}
```
**Warning signs:** "Invalid hook call", "more than one copy of React", or "react-dom.default.preload is not a function".

### Pitfall 2: "use client" Banner Applied to All Entries

**What goes wrong:** If a single tsup config block covers all three entries and has `banner: { js: '"use client";' }`, the directive appears in the server bundle. Next.js will then refuse to use that module in Server Components.

**Why it happens:** tsup's `banner` is per-config-block, not per-file within a config.

**How to avoid:** Use the array config pattern (Pattern 1 above) — one config block per entry point, with `banner` only on the index config block.

**Warning signs:** Importing `jeeby-cms/server` in a Server Component throws "Server cannot import a module that has `use client`".

### Pitfall 3: Missing `outExtension` Causes .cjs/.mjs Mismatch

**What goes wrong:** Without `outExtension`, tsup defaults to outputting `.js` for CJS and `.mjs` for ESM, but some tsup versions output `.cjs` and `.js`. The `exports` field in `package.json` must exactly match the actual file extensions produced.

**Why it happens:** tsup's default output extensions changed across versions.

**How to avoid:** Explicitly set `outExtension` in the config and verify against the actual `dist/` output after first build. The `package.json` exports must match exactly.

**Warning signs:** "Cannot find module './dist/index.mjs'" at import time — means the file extension doesn't match what `exports` declares.

### Pitfall 4: CSS Not Emitted Without Source Entry

**What goes wrong:** Running `tsup` with only JS entry points produces no `dist/styles.css`. Consumers who try `import 'jeeby-cms/dist/styles.css'` get a module-not-found error.

**Why it happens:** TSUP only bundles files it's given as entries. CSS does not appear automatically.

**How to avoid:** Either include `styles/cms.css` as an explicit tsup entry (requires PostCSS config) or add `cp styles/cms.css dist/styles.css` to the build script. For Phase 1 (stub), the source CSS file can be empty — the file just needs to exist.

**Warning signs:** `dist/styles.css` missing after `npm run build`.

### Pitfall 5: `splitting: true` with CJS Causes Issues

**What goes wrong:** Code splitting (`splitting: true`) for CJS format creates multiple output chunks. Some consumers in Node.js environments may fail to resolve these chunks.

**Why it happens:** CJS code splitting is less standard than ESM splitting.

**How to avoid:** Set `splitting: true` only for ESM, or omit it from server entry (which has no components to split). The index and admin configs are React component bundles — splitting is safe for ESM; accept the trade-off or disable for CJS if needed. In practice tsup handles this correctly with `splitting: true` for mixed format configs.

**Warning signs:** CJS consumer gets "Cannot find module './chunks/chunk-XXXX.js'".

---

## Code Examples

Verified patterns from official sources and community confirmation:

### Complete tsup.config.js for Phase 1

```javascript
// tsup.config.js
// Pattern: Array of config objects — each entry gets isolated banner/options
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
    banner: { js: '"use client";' },
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  {
    entry: { admin: 'src/admin/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  {
    entry: { server: 'src/server/index.js' },
    format: ['esm', 'cjs'],
    splitting: false,
    treeshake: true,
    external: ['firebase'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
])
```

### Complete package.json for Phase 1

```json
{
  "name": "jeeby-cms",
  "version": "0.1.0",
  "license": "MIT",
  "description": "Block-based CMS for Next.js — Firebase, drag-and-drop, draft/publish",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./admin": {
      "import": "./dist/admin.mjs",
      "require": "./dist/admin.js"
    },
    "./server": {
      "import": "./dist/server.mjs",
      "require": "./dist/server.js"
    },
    "./dist/styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "sideEffects": ["dist/styles.css"],
  "scripts": {
    "build": "tsup && cp styles/cms.css dist/styles.css",
    "build:watch": "tsup --watch"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "next": ">=14",
    "firebase": ">=10",
    "framer-motion": ">=11"
  },
  "devDependencies": {
    "tsup": "^8.5.1"
  }
}
```

### Stub Source Files

```javascript
// src/index.js
// "use client" is NOT needed here in source — TSUP banner handles it at bundle level
export function CMSProvider({ children }) {
  return children ?? null
}
export function Blocks() { return null }
export function Block() { return null }
export function useCMSContent() { return null }
```

```javascript
// src/admin/index.js
export function AdminPanel() { return null }
export function withCMSAuth() {
  return function middleware(_req, _res, next) { if (next) next() }
}
```

```javascript
// src/server/index.js
// No "use client" — this is intentionally server-safe
export async function getCMSContent(_slug) { return null }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rollup + babel for dual output | tsup (esbuild-powered) | ~2021-2022 | 10-100x faster builds |
| Single entry CJS for npm packages | Dual ESM+CJS with `exports` field | ~2022 (Node 12 EOL) | Consumers get tree-shaking in ESM environments |
| `main`/`module` fields only | `exports` field with conditional exports | Node 12+, widely adopted 2022-2023 | Subpath imports (`pkg/admin`) require `exports` |
| `"use client"` in every file | Entry-level banner via tsup for fully-client entries | 2023+ (Next.js 13 RSC stable) | Cleaner — one banner on the bundle entry vs N files |
| `npm link` for local dev testing | `file:../path` in package.json or pnpm workspaces | Standard practice as of 2023 | Avoids duplicate peer dep issues reliably |

**Deprecated/outdated:**
- `"browser"` field in package.json: replaced by `exports` conditional `"browser"` condition
- `"types"` field pointing to `.d.ts`: not needed for Phase 1 (JS-only project)

---

## Open Questions

1. **Does tsup's `banner` option get applied before or after code splitting chunks?**
   - What we know: The `banner` applies at the entry point level. Code-split chunks may not receive the banner.
   - What's unclear: Whether a split chunk imported from a "use client" entry point needs its own directive in the RSC context.
   - Recommendation: Test post-build by inspecting `dist/index.mjs` and any `dist/chunks/` files. For Phase 1 stubs (no splitting happens with minimal exports), this is not an issue.

2. **Should `clean: true` be on all three configs or only the first?**
   - What we know: `clean: true` deletes the entire `dist/` directory before building. If all three configs run in parallel, only the first should have `clean: true` to avoid race conditions.
   - What's unclear: tsup's behavior when multiple array configs all have `clean: true`.
   - Recommendation: Set `clean: true` on the first config block only (index entry), omit from admin and server configs.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed yet — Wave 0 must set up |
| Config file | none — see Wave 0 |
| Quick run command | `node -e "const x = require('./dist/index.js'); console.log(Object.keys(x))"` (smoke, no framework) |
| Full suite command | `npm run build && node scripts/verify-exports.js` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PKG-01 | `import { CMSProvider } from 'jeeby-cms'` resolves without error | smoke | `node -e "require('./dist/index.js')"` | Wave 0 — needs dist |
| PKG-01 | `import { AdminPanel } from 'jeeby-cms/admin'` resolves | smoke | `node -e "require('./dist/admin.js')"` | Wave 0 — needs dist |
| PKG-01 | `import { getCMSContent } from 'jeeby-cms/server'` resolves | smoke | `node -e "require('./dist/server.js')"` | Wave 0 — needs dist |
| PKG-02 | `dist/index.mjs`, `dist/index.js`, `dist/admin.mjs`, `dist/admin.js`, `dist/server.mjs`, `dist/server.js` all exist | file existence | `ls dist/index.mjs dist/index.js dist/admin.mjs dist/admin.js dist/server.mjs dist/server.js` | Wave 0 — needs build |
| PKG-02 | Tree-shaking: importing index does not pull admin | manual | inspect with `@next/bundle-analyzer` in consumer | manual-only for Phase 1 |
| PKG-03 | `dist/styles.css` exists | file existence | `ls dist/styles.css` | Wave 0 — needs build |
| PKG-04 | Firebase, React, Next.js, Framer Motion NOT in bundle | file inspection | `grep -L "firebase" dist/index.mjs` (should not find it) | Wave 0 — needs build |

### Sampling Rate

- **Per task commit:** `npm run build && node -e "require('./dist/index.js'); require('./dist/admin.js'); require('./dist/server.js')"`
- **Per wave merge:** `npm run build && ls dist/*.mjs dist/*.js dist/styles.css`
- **Phase gate:** All dist files present, all three require() calls succeed, `dist/index.mjs` starts with `"use client"`, `dist/server.js` does NOT contain `"use client"`

### Wave 0 Gaps

- [ ] `scripts/verify-exports.js` — automates all dist file checks and string assertions
- [ ] `styles/cms.css` — stub CSS source file (can be empty comment) must exist before build script runs `cp`
- [ ] `package.json` + `tsup.config.js` — must exist before any build is possible

---

## Sources

### Primary (HIGH confidence)
- jsDocs.io/package/tsup (tsup 8.5.1) — confirmed version 8.5.1, Options type, banner/external/splitting/treeshake/clean/outExtension fields
- Node.js Packages docs (nodejs.org/api/packages.html) — confirmed `exports` field conditional exports syntax, subpath pattern

### Secondary (MEDIUM confidence)
- GitHub: egoist/tsup issues #866, #1106 — confirmed array config pattern works, banner applies per config block
- GitHub: egoist/tsup discussions #621 — confirmed CSS bundling is experimental; copy approach is community-recommended for simple cases
- Blog: dorshinar.me/posts/treeshaking-with-tsup — confirmed sideEffects + exports pattern for tree-shakable libraries
- Blog: skovy.dev/blog/build-component-libraries-with-tsup-tailwind — confirmed PostCSS integration approach

### Tertiary (LOW confidence)
- GitHub: egoist/tsup issue #835 (Next.js 13 "use client") — post-build sed injection as alternative; not recommended given array config approach works

---

## Metadata

**Confidence breakdown:**
- Standard stack (tsup 8.5.1, array config): HIGH — verified via jsDocs.io and GitHub issue patterns
- Architecture (three-entry split, banner-per-entry): HIGH — confirmed by tsup issue discussions and real-world packages (react-wrap-balancer pattern)
- Package.json exports pattern: HIGH — verified via Node.js official docs
- CSS strategy (copy fallback for Phase 1): HIGH — confirmed by tsup discussions
- npm link pitfall: HIGH — confirmed by multiple sources, workaround well-documented

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (tsup is moderately active; verify version before building)
