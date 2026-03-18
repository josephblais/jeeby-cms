---
status: diagnosed
trigger: "Investigate why the Video block in jeeby-cms renders an empty div instead of a YouTube embed iframe"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: Video component reads `data.src` but callers pass `data.url` — the property name mismatch causes `src` to be undefined, triggering the early `if (!src) return null` guard
test: Read Video.js source and compare the prop key it reads against the key the user passes
expecting: Confirmed mismatch — component returns null (empty div from wrapper) every time
next_action: DONE — root cause confirmed, diagnosis returned to caller

## Symptoms

expected: `<Video data={{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Test video' }}/>` renders a YouTube iframe
actual: Component renders an empty div — no iframe, no content
errors: none (silent failure)
reproduction: Pass data prop with `url` key instead of `src` key
started: presumably always broken for this call signature

## Eliminated

- hypothesis: toEmbedUrl() fails to parse the YouTube URL
  evidence: Regex `(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})` correctly matches the given URL and returns `https://www.youtube.com/embed/dQw4w9WgXcQ`. The function is not the problem.
  timestamp: 2026-03-11T00:00:00Z

- hypothesis: Video is not registered in BLOCK_REGISTRY
  evidence: src/blocks/index.js line 25 shows `video: Video` — the component is correctly wired.
  timestamp: 2026-03-11T00:00:00Z

- hypothesis: Built dist does not export Video correctly
  evidence: dist/index.js line 198 shows `video: Video` in the registry and lines 129-156 show the full Video function compiled correctly.
  timestamp: 2026-03-11T00:00:00Z

## Evidence

- timestamp: 2026-03-11T00:00:00Z
  checked: src/blocks/Video.js line 96
  found: `const src = data?.src` — component reads the `src` property from `data`
  implication: Any caller passing `data.url` will result in `src === undefined`

- timestamp: 2026-03-11T00:00:00Z
  checked: src/blocks/Video.js line 99
  found: `if (!src) return null` — early guard returns null when src is falsy
  implication: null returned from the component; the Block wrapper div renders empty

- timestamp: 2026-03-11T00:00:00Z
  checked: dist/index.js line 130
  found: `const src = data == null ? void 0 : data.src;` — compiled output confirms the same `data.src` read
  implication: The bug is in the source and faithfully reproduced in the built output

- timestamp: 2026-03-11T00:00:00Z
  checked: toEmbedUrl() regex in src/blocks/Video.js lines 22-23
  found: Regex correctly captures YouTube video ID from both watch?v= and youtu.be/ forms
  implication: URL parsing is not at fault — the function never gets called because src is undefined

## Resolution

root_cause: >
  src/blocks/Video.js line 96 reads `data?.src`, but the caller passes `data.url`.
  Because `data.src` is undefined, the guard on line 99 (`if (!src) return null`)
  fires immediately and the component returns null. The Block wrapper renders an empty
  <div class="jeeby-cms-block"> with no children. The iframe branch (line 134-144)
  is never reached.

fix: >
  In src/blocks/Video.js line 96, change:
    const src = data?.src
  to:
    const src = data?.url ?? data?.src
  This accepts the `url` key (which callers use) while keeping `src` as a fallback
  for any existing callers or Firebase Storage usage that already passes `data.src`.
  Alternatively, standardise on one key across all callers and the component.

verification: not applied (diagnose-only mode)
files_changed: []
