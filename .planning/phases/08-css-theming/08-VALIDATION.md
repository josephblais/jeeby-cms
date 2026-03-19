---
phase: 8
slug: css-theming
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `scripts/test-register.js` (JSX transform hook) |
| **Quick run command** | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js'` |
| **Full suite command** | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/**/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green + `dist/styles.css` contains expected selectors
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-W0-01 | 01 | 0 | CSS-01, CSS-02, CSS-04 | structural | `node --import ./scripts/test-register.js --test 'src/admin/css-theming.test.js'` | ❌ W0 | ⬜ pending |
| 8-01-01 | 01 | 1 | CSS-01 | build+structural | `npm run build && grep -c "jeeby-cms-admin" dist/styles.css` | ✅ after W0 | ⬜ pending |
| 8-01-02 | 01 | 1 | CSS-02 | structural | `grep "jeeby-cms-max-width" styles/cms.css` | ✅ after W0 | ⬜ pending |
| 8-01-03 | 01 | 1 | CSS-04 | structural | `node --import ./scripts/test-register.js --test 'src/admin/css-theming.test.js'` | ✅ after W0 | ⬜ pending |
| 8-02-01 | 02 | 2 | CSS-03 | unit | `node --import ./scripts/test-register.js --test 'src/blocks/*.test.js'` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/admin/css-theming.test.js` — structural tests for CSS-01 (scoping), CSS-02 (var declarations), CSS-04 (no block element styles)

*Test reads `styles/cms.css` directly (source file) rather than requiring a build step. Checks:*
- *`styles/cms.css` exists*
- *All selectors start with `.jeeby-cms-admin` or are custom property declarations*
- *`--jeeby-cms-max-width` and `--jeeby-cms-block-spacing` are declared*
- *No bare block element selectors (h1–h6, p, img, figure, ul, ol without `.jeeby-cms-admin` prefix)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin UI visually styled and functional | CSS-01 | Visual inspection required | Import `jeeby-cms/dist/styles.css` in a Next.js app, open `/admin`, verify all UI elements render with dark Notion theme |
| CSS vars override works | CSS-02 | Visual/computed style check | Add `.jeeby-cms-admin { --jeeby-cms-accent: red }` to consumer CSS, verify buttons turn red |
| No style leaks to consumer page | CSS-01 | Cross-context visual check | Render a page with both consumer content and admin panel, verify consumer content is unstyled |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
