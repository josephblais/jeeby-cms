---
phase: 2
slug: firebase-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (no install needed) |
| **Config file** | none — Wave 0 creates test stubs |
| **Quick run command** | `node --test src/firebase/*.test.js` |
| **Full suite command** | `node --test src/firebase/*.test.js scripts/*.test.js` |
| **Estimated runtime** | ~5 seconds (unit tests only) |

---

## Sampling Rate

- **After every task commit:** Run `node --test src/firebase/*.test.js` (unit tests, no emulator)
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** All unit tests green + manual smoke test against real Firebase project
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | FIRE-01 | unit | `node --test src/firebase/init.test.js` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | FIRE-01 | unit | `node --test src/firebase/init.test.js` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | FIRE-02 | unit | `node --test src/firebase/firestore.test.js` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | FIRE-02 | unit | `node --test src/firebase/firestore.test.js` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | FIRE-02 | unit | `node --test src/firebase/firestore.test.js` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | FIRE-03 | unit | `node --test src/firebase/auth.test.js` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 2 | FIRE-03 | unit | `node --test src/firebase/auth.test.js` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 2 | FIRE-04 | unit | `node --test src/firebase/storage.test.js` | ❌ W0 | ⬜ pending |
| 2-04-02 | 04 | 2 | FIRE-04 | unit | `node --test src/firebase/storage.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/firebase/init.test.js` — unit test: multi-init guard, CMSProvider renders children
- [ ] `src/firebase/firestore.test.js` — unit test: null return for missing doc, draft/publish round-trip (mocked)
- [ ] `src/firebase/auth.test.js` — unit test: useAuth loading transitions (mock onAuthStateChanged)
- [ ] `src/firebase/storage.test.js` — unit test: onProgress callback called, resolves with URL string (mock uploadBytesResumable)

*Wave 0 creates test stubs with mocked Firebase calls. Full integration tests against Firebase Emulator are deferred to Phase 10 (Polish & Publish) where a real Firebase project is tested end-to-end.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Firebase initialises without error against a real Firebase project | FIRE-01 | Requires real Firebase config with valid credentials | Add real firebaseConfig to a test Next.js app, wrap with CMSProvider, confirm no console errors on load |
| Auth sign-in / sign-out with real Firebase Auth | FIRE-03 | Requires real Firebase Auth project | Use signIn(email, password) against real project, confirm user returned; signOut, confirm null |
| Storage upload returns real public URL | FIRE-04 | Requires real Firebase Storage bucket | Upload a test file, confirm returned URL loads in browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
