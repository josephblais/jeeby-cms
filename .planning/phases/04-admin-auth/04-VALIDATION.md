---
phase: 4
slug: admin-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none — invoked via `npm test` script |
| **Quick run command** | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js' 'src/index.test.js'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command above
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | AUTH-01/03 | unit stub | quick run | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | AUTH-01 | unit stub | quick run | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | AUTH-03 | unit (mock) | quick run | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | AUTH-03 | unit (mock) | quick run | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | AUTH-01 | unit (renderToStaticMarkup) | quick run | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 2 | AUTH-01 | unit (renderToStaticMarkup) | quick run | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 3 | AUTH-01 | unit (renderToStaticMarkup) | quick run | ❌ W0 | ⬜ pending |
| 4-04-02 | 04 | 3 | AUTH-02 | manual | — | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/admin/AdminPanel.test.js` — stubs for AUTH-01 (three render states: loading, unauthenticated, authenticated)
- [ ] `src/admin/LoginPage.test.js` — stubs for AUTH-01 (form renders, error display, button disabled state)
- [ ] additions to `src/index.test.js` — stubs for AUTH-03 cookie write/clear behavior

*Existing `src/firebase/auth.test.js` covers Firebase helpers — no new test file needed there.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `__session` cookie is set after successful sign-in and received by `withCMSAuth` middleware | AUTH-02 | Requires running Next.js server + real Firebase Auth instance — cannot be automated with node:test runner | 1. Install package in test repo. 2. Visit `/admin`. 3. Sign in with valid credentials. 4. Check browser DevTools > Application > Cookies for `__session`. 5. Verify protected `/admin` page loads (middleware accepted token). 6. Sign out and verify `__session` is cleared. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
