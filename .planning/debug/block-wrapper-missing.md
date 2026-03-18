---
status: diagnosed
trigger: "Block wrapper div missing / className not applied"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: Blocks renders Block correctly but never passes className down to Block — and Block itself never passes className to individual block components
test: read src/blocks/index.js lines 60-64 and dist/index.js lines 221-225
expecting: className is absent from the Block call-site inside Blocks.map
next_action: diagnosis complete

## Symptoms

expected: Each block renders as <div class="jeeby-cms-block [user className]">...</div>
actual: No jeeby-cms-block wrapper div visible in DevTools; className prop not applied
errors: none reported
reproduction: render <Blocks data={...} /> and inspect DOM
started: unknown

## Eliminated

- hypothesis: Block component itself is broken or missing
  evidence: Block is defined correctly in src/blocks/index.js (line 33-42) and compiled correctly in dist/index.js (lines 201-210). It renders a div with className: ['jeeby-cms-block', className].filter(Boolean).join(' ') — the component logic is sound.
  timestamp: 2026-03-11T00:00:00Z

- hypothesis: Block is not used by Blocks
  evidence: Blocks.map does call createElement(Block, ...) — Block IS used. Not the problem.
  timestamp: 2026-03-11T00:00:00Z

## Evidence

- timestamp: 2026-03-11T00:00:00Z
  checked: src/blocks/index.js lines 60-64 — createElement call inside Blocks.map
  found: |
    return createElement(
      Block,
      { key: block.id ?? i, id: block.id },   // <-- NO className here
      createElement(Component, { data: block.data })
    )
  implication: className is never passed to Block from Blocks. Block.className will always be undefined, so filter(Boolean) drops it and the class attribute is just "jeeby-cms-block" with no user extension — but more importantly there is no way for the consumer to attach a per-block className at all through Blocks.

- timestamp: 2026-03-11T00:00:00Z
  checked: Blocks function signature — src/blocks/index.js line 47
  found: export function Blocks({ data, components }) — no className prop accepted at all
  implication: The Blocks component does not accept a className prop, so even if Block's call-site was fixed, there is no API surface for the consumer to pass one in.

- timestamp: 2026-03-11T00:00:00Z
  checked: dist/index.js lines 211-228 — compiled Blocks
  found: Matches source exactly. No className propagation.
  implication: The bug is in source, compiled faithfully — not a build artifact.

- timestamp: 2026-03-11T00:00:00Z
  checked: DevTools wrapper div claim
  found: The wrapper div DOES render — Block is called and produces <div class="jeeby-cms-block">. The claim that no wrapper div is visible likely means the user expected the class to include their custom className, which is never passed, OR they are inspecting a stale build. The structure is present; it is the className forwarding that is absent.
  implication: The bug is className-forwarding only, not a missing wrapper div per se.

## Resolution

root_cause: |
  src/blocks/index.js — two coupled gaps:

  1. Blocks does not accept a className prop (line 47 signature).
  2. Even if it did, the createElement(Block, ...) call-site at lines 60-62 only passes
     { key, id } — no className — so Block.className is always undefined.

  Because filter(Boolean) drops undefined, the rendered div always gets exactly
  class="jeeby-cms-block" and nothing else. There is no consumer API to extend it.

fix: |
  1. Add className to Blocks signature: function Blocks({ data, components, className })
  2. Thread it into Block's call-site:
     createElement(Block, { key: block.id ?? i, id: block.id, className }, ...)
  These are the only two lines that need to change (src/blocks/index.js lines 47 and 61).

verification: not applied (diagnose-only mode)
files_changed: []
