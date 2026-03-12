---
status: complete
phase: 03-front-end-block-system
source: [03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-03-11T07:00:00Z
updated: 2026-03-11T07:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. getCMSContent returns published content
expected: In a Next.js Server Component, import getCMSContent from 'jeeby-cms/server' and call it with a slug that exists in Firestore. It should return the published blocks array (not draft data). For a slug that doesn't exist or has no published data, it should return null.
result: skipped
reason: Package not yet published; no Firestore instance set up

### 2. useCMSContent real-time updates
expected: In a Next.js Client Component wrapped in CMSProvider, call useCMSContent(slug). It should return { data, loading, error }. When loading, data is null and loading is true. After the first Firestore read, data updates to the published content. When Firestore data changes, the rendered content updates in real-time without a page refresh.
result: skipped
reason: Needs Firebase — will test after Firebase setup

### 3. Blocks renders all 6 block types
expected: Pass an array containing one block of each type (title, paragraph, richtext, image, video, gallery) to <Blocks data={blocks} />. Each block type renders its content without errors — no "unknown block type" warnings, no blank outputs for valid data.
result: pass

### 4. Block wrapper structure
expected: Each rendered block is wrapped in a div with the CSS class jeeby-cms-block. Passing an id prop puts that id on the wrapper div. Passing a className prop appends it to the wrapper div alongside jeeby-cms-block. Unknown block types are silently skipped (no error, no empty wrapper).
result: issue
reported: "The video block is rendering an empty div. There doesn't appear to be a wrapper div. Error: {imported module ./nodemodules/dompurify/dist/purify.es.mjs}.default.sanitize is not a function. className prop not appended to jeeby-cms-block."
severity: blocker

### 5. Title heading level enforcement
expected: A Title block with data.level="h2" renders as <h2>. A Title block with data.level="h1" renders as <h2> (never h1 — reserved for page title). A Title block with no level or an invalid level (e.g. "span") renders as <h3>. The Title component never outputs a <h1> tag regardless of input.
result: pass

### 6. Paragraph renders in p tag
expected: A Paragraph block renders data.text inside a <p> element. Inspect the rendered HTML — it should be <p>your text here</p>, not a div or span. className prop is applied to the <p> tag.
result: pass
note: User question logged as todo — design distinction between Paragraph and RichText blocks to clarify before Phase 6

### 7. RichText sanitizes HTML
expected: A RichText block with data.html containing a <script>alert('xss')</script> tag renders without executing or displaying the script — the script tag is stripped. A RichText block with an <a href="javascript:alert('xss')">click</a> link renders with the href stripped (link visible but href removed). ARIA attributes like aria-label on elements in the HTML are preserved after sanitization.
result: pass
note: Passed despite dompurify error logged in test 4 — error may be a console warning not blocking sanitization

### 8. Image renders with alt attribute
expected: An Image block always renders an <img> with an alt attribute present (even if empty string — never omitted). When data.caption is set, the image is wrapped in a <figure> with a <figcaption>. Without a caption, just an <img> (or a plain figure without figcaption).
result: pass

### 9. Video renders with embed iframe
expected: A Video block with a YouTube URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ) renders an iframe pointing to the YouTube embed URL (https://www.youtube.com/embed/dQw4w9WgXcQ). The iframe always has a non-empty title attribute (uses data.title if available, falls back to "Embedded video"). A Firebase Storage video URL renders a <video controls> element (or Video.js player if installed).
result: issue
reported: "yeah, it's empty"
severity: major

### 10. Gallery renders accessible list
expected: A Gallery block renders a <ul aria-label="Gallery"> with one <li> per item in data.items. Each item has an <img> with an empty alt fallback. Images have loading="lazy". When an item has a caption, it's wrapped in figure/figcaption. Inspect the rendered HTML to confirm ul > li > img structure.
result: pass

## Summary

total: 10
passed: 6
issues: 2
pending: 0
skipped: 2

## Gaps

- truth: "dompurify.sanitize() must work in Next.js App Router (browser environment)"
  status: failed
  reason: "User reported: Error: {imported module ./nodemodules/dompurify/dist/purify.es.mjs}.default.sanitize is not a function"
  severity: blocker
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Each rendered block is wrapped in a div with class jeeby-cms-block"
  status: failed
  reason: "User reported: There doesn't appear to be a wrapper div"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "className prop is appended to the wrapper div alongside jeeby-cms-block"
  status: failed
  reason: "User reported: className prop not appended to jeeby-cms-block"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Video block renders content (iframe for YouTube, video element for storage URLs)"
  status: failed
  reason: "User reported: The video block is rendering an empty div (confirmed in test 9)"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
