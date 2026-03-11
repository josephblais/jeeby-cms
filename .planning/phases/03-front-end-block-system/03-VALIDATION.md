---
phase: 3
slug: front-end-block-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` (no external test runner required) |
| **Config file** | none — Wave 0 creates all test stubs |
| **Quick run command** | `node --experimental-test-module-mocks --test 'src/blocks/*.test.js' 'src/server/index.test.js'` |
| **Full suite command** | `node --experimental-test-module-mocks --test 'src/**/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

Component tests use `renderToStaticMarkup` from `react-dom/server` — works in Node.js without a browser DOM.

---

## Sampling Rate

- **After every task commit:** Run quick run command (block tests only)
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | FRONT-01–10 | setup | `node --experimental-test-module-mocks --test 'src/**/*.test.js' 2>&1; echo "exit:$?"` | ❌ W0 creates | ⬜ pending |
| 3-02-01 | 02 | 1 | FRONT-01 | unit | `node --experimental-test-module-mocks --test 'src/server/index.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | FRONT-02 | unit | `node --experimental-test-module-mocks --test 'src/index.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | FRONT-03/04 | unit | `node --experimental-test-module-mocks --test 'src/blocks/index.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | FRONT-05 | unit | `node --experimental-test-module-mocks --test 'src/blocks/Title.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | FRONT-06 | unit | `node --experimental-test-module-mocks --test 'src/blocks/Paragraph.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-04-03 | 04 | 2 | FRONT-07 | unit | `node --experimental-test-module-mocks --test 'src/blocks/RichText.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-05-01 | 05 | 2 | FRONT-08 | unit | `node --experimental-test-module-mocks --test 'src/blocks/Image.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-05-02 | 05 | 2 | FRONT-09 | unit | `node --experimental-test-module-mocks --test 'src/blocks/Video.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |
| 3-05-03 | 05 | 2 | FRONT-10 | unit | `node --experimental-test-module-mocks --test 'src/blocks/Gallery.test.js' 2>&1; echo "exit:$?"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/server/index.test.js` — stub for FRONT-01 (getCMSContent)
- [ ] `src/index.test.js` — stub for FRONT-02 (useCMSContent export shape)
- [ ] `src/blocks/index.test.js` — stubs for FRONT-03 (Blocks renderer) and FRONT-04 (Block wrapper)
- [ ] `src/blocks/Title.test.js` — stub for FRONT-05
- [ ] `src/blocks/Paragraph.test.js` — stub for FRONT-06
- [ ] `src/blocks/RichText.test.js` — stub for FRONT-07
- [ ] `src/blocks/Image.test.js` — stub for FRONT-08
- [ ] `src/blocks/Video.test.js` — stub for FRONT-09
- [ ] `src/blocks/Gallery.test.js` — stub for FRONT-10
- [ ] Add `react-dom` to devDependencies if not present (needed for `renderToStaticMarkup` in tests)

*All stubs use try/catch dynamic import — tests skip if implementation files don't exist yet, then activate automatically as each plan's implementation lands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `<Video>` renders working embed iframe visually (YouTube, Vimeo) | FRONT-09 | Requires live iframe in browser; embed URL parsing is automated but visual check needs browser | Open test Next.js page, verify video plays |
| `<Gallery>` masonry layout renders correctly across viewport widths | FRONT-10 | Visual layout check requires browser | Open test page at various widths, verify grid/masonry layout |
| `<RichText>` renders consumer-supplied HTML with intended formatting | FRONT-07 | Visual rich text rendering needs browser | Add RichText block with bold/italic/list, confirm visual output |
| Accessibility: screen reader announces heading levels correctly | FRONT-05 | Requires screen reader (VoiceOver/NVDA) | Navigate page with screen reader, confirm h2–h6 levels announced |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
