---
phase: 11
slug: i18n-localization-for-admin-panel-and-block-components
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None — `package.json` script: `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/**/*.test.js'` |
| **Quick run command** | `npm test -- --test-name-pattern="resolveLocale"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --test-name-pattern="<feature under test>"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | I18N-01–04 | unit | `npm test -- --test-name-pattern="resolveLocale"` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 0 | I18N-08 | source-scan | `npm test -- --test-name-pattern="ADMIN_STRINGS"` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 0 | I18N-09–10 | source-scan | `npm test -- --test-name-pattern="LocaleSwitcher"` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | I18N-05 | source-scan | `npm test -- --test-name-pattern="CMSProvider"` | ✅ | ⬜ pending |
| 11-02-02 | 02 | 1 | I18N-06 | source-scan | `npm test -- --test-name-pattern="getCMSContent"` | ✅ | ⬜ pending |
| 11-02-03 | 02 | 1 | I18N-07 | source-scan | `npm test -- --test-name-pattern="Blocks"` | ✅ | ⬜ pending |
| 11-03-01 | 03 | 2 | I18N-13 | unit | `npm test -- --test-name-pattern="Title"` | ✅ | ⬜ pending |
| 11-03-02 | 03 | 2 | I18N-11–12 | source-scan | `npm test -- --test-name-pattern="TitleEditor"` | ✅ | ⬜ pending |
| 11-04-01 | 04 | 3 | I18N-09–10 | source-scan | `npm test -- --test-name-pattern="LocaleSwitcher"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/resolveLocale.test.js` — stubs for I18N-01 through I18N-04 (resolveLocale utility)
- [ ] `src/admin/i18n.test.js` — stub for I18N-08 (ADMIN_STRINGS EN/FR key set parity)
- [ ] `src/admin/LocaleSwitcher.test.js` — stubs for I18N-09, I18N-10 (tablist ARIA structure)

*Existing test files need new test cases added (not new files): `src/index.test.js`, `src/server/index.test.js`, `src/blocks/index.test.js`, `src/blocks/Title.test.js`, `src/admin/editors/TitleEditor.test.js`*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Language switcher keyboard navigation (arrow keys) | I18N-09 | DOM interaction not easily automated in node:test | Tab to switcher, press ArrowRight/ArrowLeft, verify focus moves between EN/FR tabs |
| EN fallback renders visually when FR content missing | I18N-03 | Requires visual inspection of rendered block | Set locale to FR, leave FR field empty, verify EN text renders in block |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
