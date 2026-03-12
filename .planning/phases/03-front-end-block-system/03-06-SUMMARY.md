---
phase: 03-front-end-block-system
plan: "06"
subsystem: blocks
tags: [bug-fix, dompurify, className, video, gap-closure]
dependency_graph:
  requires: [03-05]
  provides: [FRONT-03, FRONT-04, FRONT-07, FRONT-09]
  affects: [src/blocks/RichText.js, src/blocks/index.js, src/blocks/Video.js]
tech_stack:
  added: []
  patterns:
    - namespace import with defensive .default resolution for CJS/ESM interop
    - className forwarding via prop destructuring
    - field alias with nullish coalescing for backwards compatibility
key_files:
  created: []
  modified:
    - src/blocks/RichText.js
    - src/blocks/index.js
    - src/blocks/Video.js
decisions:
  - DOMPurify namespace import (import * as DOMPurifyModule) bypasses TSUP CJS interop double-.default chain
  - className forwarded from Blocks to Block via prop addition — Block join logic was already correct
  - data?.url ?? data?.src: url is canonical field; src fallback preserves backwards compatibility
metrics:
  duration_minutes: 10
  completed_date: "2026-03-11"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
  tests_before: 64
  tests_after: 64
  tests_failed: 0
---

# Phase 3 Plan 06: Block System Gap Closure Summary

**One-liner:** Fixed three UAT-diagnosed bugs: DOMPurify namespace import for Next.js ESM interop, className forwarding from Blocks to Block wrapper, and Video field name data.url with data.src fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix DOMPurify namespace import in RichText.js | f2c7e39 | src/blocks/RichText.js |
| 2 | Forward className prop through Blocks to Block | 37a09de | src/blocks/index.js |
| 3 | Fix Video block field name — data.src → data.url | cbb7bea | src/blocks/Video.js |

## Decisions Made

**DOMPurify import strategy:** Replaced `import DOMPurify from 'dompurify'` with `import * as DOMPurifyModule from 'dompurify'` followed by `const DOMPurify = DOMPurifyModule.default ?? DOMPurifyModule`. This bypasses TSUP's `_interopDefault` wrapper which produces a double `.default` access chain (`DOMPurify__default.default.sanitize`) that fails under Next.js/turbopack ESM interop. The namespace import with defensive resolution works correctly in both CJS and ESM environments.

**className forwarding approach:** Added `className` to the `Blocks` function destructured props and passed it through to the `createElement(Block, ...)` call. Block's internal class join logic (`['jeeby-cms-block', className].filter(Boolean).join(' ')`) was already correct — it simply never received the value because Blocks didn't accept or forward the prop.

**Video field alias:** Changed `data?.src` to `data?.url ?? data?.src`. The `url` field matches the schema definition and the BLOCK_REGISTRY wiring from Plan 05. The `?? data?.src` fallback preserves backwards compatibility for any existing data objects with a `src` field. The guard `if (!src) return null` was correct but always triggered because `data?.src` was consistently undefined when callers used `data.url`.

## Test Results

- Before: 64 tests, all passing (pre-fix state)
- After: 64 tests, all passing
- 0 regressions, 0 new failures
- All three individual file test suites verified independently before full suite run

## Deviations from Plan

None — plan executed exactly as written. All three fixes matched the described before/after lines precisely.

## Self-Check

- [x] src/blocks/RichText.js line 19-20: `import * as DOMPurifyModule` and `DOMPurifyModule.default ??` present
- [x] src/blocks/index.js: `Blocks({ data, components, className })` and `className` in Block createElement call
- [x] src/blocks/Video.js line 96: `data?.url ?? data?.src` present
- [x] Commits f2c7e39, 37a09de, cbb7bea exist in git log
- [x] 64/64 tests pass with exit code 0

## Self-Check: PASSED
