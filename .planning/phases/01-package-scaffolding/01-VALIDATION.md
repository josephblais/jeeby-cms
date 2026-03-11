---
phase: 1
slug: package-scaffolding
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — smoke tests via node -e and shell assertions |
| **Config file** | none — Wave 0 creates scripts/verify-exports.js |
| **Quick run command** | `npm run build && node -e "require('./dist/index.js'); require('./dist/admin.js'); require('./dist/server.js')"` |
| **Full suite command** | `npm run build && node scripts/verify-exports.js` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && node -e "require('./dist/index.js'); require('./dist/admin.js'); require('./dist/server.js')"`
- **After every plan wave:** Run `npm run build && node scripts/verify-exports.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | PKG-01/02 | smoke | `npm run build` exits 0 | ✅ W0 creates | ⬜ pending |
| 1-01-02 | 01 | 1 | PKG-01 | smoke | `node -e "require('./dist/index.js')"` | ✅ W0 creates | ⬜ pending |
| 1-01-03 | 01 | 1 | PKG-01 | smoke | `node -e "require('./dist/admin.js')"` | ✅ W0 creates | ⬜ pending |
| 1-01-04 | 01 | 1 | PKG-01 | smoke | `node -e "require('./dist/server.js')"` | ✅ W0 creates | ⬜ pending |
| 1-01-05 | 01 | 1 | PKG-02 | file | `ls dist/index.mjs dist/index.js dist/admin.mjs dist/admin.js dist/server.mjs dist/server.js` | ✅ W0 creates | ⬜ pending |
| 1-01-06 | 01 | 1 | PKG-03 | file | `ls dist/styles.css` | ✅ W0 creates | ⬜ pending |
| 1-01-07 | 01 | 1 | PKG-02 | content | `node -e "const f=require('fs').readFileSync('dist/index.mjs','utf8'); if(!f.startsWith('\"use client\"')) throw new Error('missing banner')"` | ✅ W0 creates | ⬜ pending |
| 1-01-08 | 01 | 1 | PKG-02 | content | `node -e "const f=require('fs').readFileSync('dist/server.js','utf8'); if(f.includes('use client')) throw new Error('server entry has use client!')"` | ✅ W0 creates | ⬜ pending |
| 1-01-09 | 01 | 1 | PKG-04 | content | `node scripts/verify-exports.js` | ✅ W0 creates | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/verify-exports.js` — automates all dist file checks, banner assertions, and peer dep verification
- [ ] `styles/cms.css` — stub CSS source file (can be an empty comment) must exist before build script runs `cp`
- [ ] `package.json` + `tsup.config.js` + `src/index.js` + `src/admin/index.js` + `src/server/index.js` — must exist before any build is possible

*Wave 0 creates the build infrastructure and source stubs that all verification tasks depend on.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tree-shaking: importing jeeby-cms does not pull admin bundle | PKG-02 | Requires bundle analyzer in consumer app | Install in test Next.js app, run `ANALYZE=true npm run build`, verify admin bundle absent from main bundle treemap |
| Consumer can import from jeeby-cms/dist/styles.css | PKG-03 | Requires Next.js App Router consumer | Add `import 'jeeby-cms/dist/styles.css'` to consumer layout, confirm no module-not-found error |
| Peer dependency warnings appear if packages missing | PKG-04 | Requires npm install in consumer without peers | Run `npm install jeeby-cms` without React/Firebase; confirm peer dep warning in output |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved — Phase 1 executed, all 16 verification checks passed (2026-03-10)
