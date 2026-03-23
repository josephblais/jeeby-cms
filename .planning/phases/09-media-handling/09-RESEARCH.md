# Phase 9: Media Handling - Research

**Researched:** 2026-03-23
**Domain:** Firebase Storage upload UI, React file input patterns, inline progress feedback
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Dual affordance: URL text input and Upload button appear side by side, always visible — no mode toggle/tabs
- Applies to ImageEditor and each GalleryEditor item row
- Gallery additionally gets an "Upload multiple" button that opens a file picker accepting multiple files at once
- Multiple gallery uploads run in parallel (not sequential)
- While uploading: inline progress bar appears below the URL input area
- Upload button becomes disabled with a spinner/clock indicator during upload
- Progress shows percentage (0-100%) filling left-to-right
- On success: download URL auto-fills the URL input; preview renders immediately
- On failure: inline error message replaces the progress bar with a Retry button
- No toast notifications for upload state — feedback is inline within the editor
- Storage path format: `cms/media/{type}/{uuid}.{ext}` where type is `images`
- UUID generated at upload time via `crypto.randomUUID()`
- Extension preserved from original filename
- No auto-delete — Storage files are never deleted by the CMS

### Claude's Discretion

- Accepted file types for image upload (e.g. image/*, or specific: jpg/png/gif/webp)
- Max file size client-side validation (if any)
- Exact styling of the progress bar and error state within existing CSS class system
- How the Upload button's accessible label changes during upload state

### Deferred Ideas (OUT OF SCOPE)

- MEDIA-02: Raw video file upload to Firebase Storage — deferred post-v1
- VideoEditor remains embed-URL only (YouTube, Vimeo, Loom via toEmbedUrl())
- Storage file auto-deletion on block delete — consumer manages lifecycle
- Upload cancellation (cancel in-progress upload)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MEDIA-01 | Video editor supports embed URL input (YouTube, Vimeo, Loom) and generates iframe src | Already complete per CONTEXT.md — VideoEditor.js implements toEmbedUrl(); this phase only marks it done |
| MEDIA-03 | Gallery editor supports adding items via Firebase Storage upload or external URL paste | GalleryEditor.js + uploadFile() already exist; research confirms integration approach |
| MEDIA-04 | Image editor supports Firebase Storage upload or external URL | ImageEditor.js + uploadFile() already exist; research confirms integration approach |
</phase_requirements>

---

## Summary

Phase 9 is narrowly scoped: wire the existing `uploadFile(storage, file, path, onProgress)` helper into ImageEditor and GalleryEditor. The Firebase Storage helper is fully implemented and tested. The editors already handle the URL-input flow. This phase adds a file picker trigger, a path-construction step, progress state, and inline feedback UI alongside the existing inputs.

The implementation pattern is straightforward React state management: a `uploadProgress` state per upload slot (null = idle, 0-100 = uploading, 'error' = failed), a hidden `<input type="file">` triggered by a visible button, and a CSS progress bar. No new libraries are needed — everything required is already in the project.

The primary risk is accessibility: upload state changes must be announced via `role="alert"` or `aria-live` regions (consistent with the pattern used throughout the codebase). The Upload button's accessible name must change during upload to communicate state to screen reader users. File type and size validation should be client-side defensive rather than strict to preserve the "quiet, polished" aesthetic.

Primary recommendation: implement a reusable upload state machine (idle / uploading / error) inside each editor component using local React state, wired to the existing `uploadFile` helper. CSS-only progress bar (no Framer Motion required for this use case).

---

## Standard Stack

### Core (all already present — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/storage | >=10 (peer dep) | `uploadBytesResumable`, `getDownloadURL` | Already used; `uploadFile()` wraps this cleanly |
| React (useState, useRef) | >=18 (peer dep) | Upload state, file input ref | Established pattern in all editors |
| crypto.randomUUID() | Node/browser built-in | UUID for storage path | Already used for block IDs in GalleryEditor |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Framer Motion | >=11 (peer dep) | Progress bar animation (optional) | Only if subtle fill animation is desired; plain CSS transition is sufficient |

No new packages need to be installed. This phase is purely additive JavaScript + CSS.

---

## Architecture Patterns

### Upload State Machine (per upload slot)

Each upload slot (ImageEditor has one; each GalleryItem has one) holds local state:

```javascript
// Source: pattern inferred from CONTEXT.md + existing codebase conventions
const [uploadProgress, setUploadProgress] = useState(null)
// null   = idle
// 0-100  = uploading (integer percent)
// 'error' = failed; file ref kept for retry
```

The file object is held in a ref so retry can reuse it without reopening the file picker:

```javascript
const pendingFileRef = useRef(null)
```

### Path Construction

```javascript
// Source: locked decision in CONTEXT.md
function buildStoragePath(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const uuid = crypto.randomUUID()
  return `cms/media/images/${uuid}.${ext}`
}
```

### Upload Trigger Pattern

The native file input is hidden; a styled button triggers it via a ref:

```javascript
const fileInputRef = useRef(null)

// Button onClick:
fileInputRef.current?.click()

// Hidden input:
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  style={{ display: 'none' }}
  aria-hidden="true"
  tabIndex={-1}
  onChange={handleFileSelect}
/>
```

This pattern avoids custom ARIA on the hidden input (accessibility lives on the visible button) and is the established browser-native approach for styled file pickers. The hidden input must have `tabIndex={-1}` and `aria-hidden="true"` so it is not reachable by keyboard or announced by screen readers.

### Gallery Batch Upload

```javascript
// multiple file picker, runs uploads in parallel
<input type="file" accept="image/*" multiple ... />

// On change: start all uploads in parallel
const files = Array.from(e.target.files)
const uploadStates = Object.fromEntries(files.map((_, i) => [i, 0]))
// Run Promise.allSettled — collect all results before appending to items
// Partial success is fine: append only the succeeded URLs, surface errors for failed ones
```

### Inline Progress Bar (CSS only)

```css
/* No Framer Motion needed — CSS transition is sufficient for a quiet aesthetic */
.jeeby-cms-admin .jeeby-cms-upload-progress {
  height: 3px;
  background: var(--jeeby-cms-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}

.jeeby-cms-admin .jeeby-cms-upload-progress-fill {
  height: 100%;
  background: var(--jeeby-cms-accent);
  border-radius: 2px;
  transition: width 150ms ease-out;
  /* Width set via inline style: style={{ width: `${percent}%` }} */
  /* Inline style is justified: runtime-dynamic value — consistent with project rule */
}
```

The `width` is the only inline style — it is runtime-dynamic (changes every progress callback), which is the established project exception for inline styles (see STATE.md decisions).

### Recommended Project Structure

No new files are required. Changes are additive to:

```
src/
├── admin/editors/
│   ├── ImageEditor.js         # add upload state + button + progress UI
│   └── GalleryEditor.js       # add upload state per item + batch picker
└── styles/
    └── cms.css                # add upload-progress, upload-btn CSS classes
```

### Anti-Patterns to Avoid

- **Sharing upload state across items in GalleryEditor:** Each GalleryItem should own its own uploadProgress state. Lifting to GalleryEditor and indexing by position creates stale closure bugs when items reorder.
- **Calling `uploadFile` directly in GalleryEditor's parent:** Pass the `storage` instance and `uploadFile` function down as props to GalleryItem, or read storage from `useCMSFirebase()` inside GalleryItem. The existing `useCMSFirebase()` hook is context-provided and safe to call in any component inside `<CMSProvider>`.
- **Using `Promise.all` for batch gallery uploads:** Use `Promise.allSettled` instead — partial success should append successful URLs without blocking on one failed upload.
- **Reinitializing the file input on every render:** Keep the hidden `<input type="file">` always mounted; reset its value via `fileInputRef.current.value = ''` after use so the same file can be re-uploaded after an error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Firebase Storage upload | Custom fetch/XMLHttpRequest to Storage | `uploadFile()` in `src/firebase/storage.js` | Already handles resumable upload, progress callbacks, download URL retrieval, and error propagation |
| UUID generation | Custom random string | `crypto.randomUUID()` | Already used in GalleryEditor for item IDs; browser built-in, no install |
| Storage instance | Direct `getStorage()` call in editor | `useCMSFirebase().storage` | Matches established pattern in PageEditor, PageManager, etc. |
| Progress animation | Custom JS timer / Framer Motion | CSS `transition: width` | Quieter, no JS overhead, fits aesthetic |

---

## Common Pitfalls

### Pitfall 1: Upload state lives in wrong component

What goes wrong: Putting `uploadProgress` state in GalleryEditor (parent) and passing it down by index. When items reorder via drag, indices shift but state does not follow the items.

Why it happens: Natural instinct to centralize state.

How to avoid: Each `GalleryItem` owns its own `uploadProgress` state. State is local to the item, not indexed. Reordering items does not affect upload state.

Warning signs: Upload bar appears on wrong item after drag.

### Pitfall 2: File input not reset after success or error

What goes wrong: After a successful upload, clicking "Upload" again with the same file does nothing — the browser sees the same file already selected and does not fire `onChange`.

Why it happens: `<input type="file">` does not fire `onChange` if value hasn't changed.

How to avoid: After each upload attempt (success or error), set `fileInputRef.current.value = ''`.

### Pitfall 3: `onBlur` dismisses edit mode during upload

What goes wrong: ImageEditor exits edit mode when the user clicks "Upload" — the file dialog opens and browser focus moves, triggering `handleContainerBlur`.

Why it happens: The `onBlur` handler checks `e.relatedTarget` and collapses the editor if focus leaves the container. Opening a native file dialog may not keep focus within the container.

How to avoid: When upload state is active (uploadProgress !== null), suppress the blur-to-dismiss behavior. Gate the `setIsEditing(false)` call with a check: `if (uploadProgress !== null) return`.

Warning signs: Edit fields collapse immediately after clicking Upload.

### Pitfall 4: No accessibility announcement for upload completion

What goes wrong: Upload completes silently — screen reader users get no feedback that the image was added.

Why it happens: Progress bar is visual-only.

How to avoid: Use `role="alert"` on the error message (already the project pattern). For success, the URL auto-filling the input and image preview rendering is sufficient visual feedback; additionally set the success state briefly with a descriptive `role="status"` element or rely on the image appearing. Use `aria-live="polite"` on a status region, consistent with the existing `jeeby-cms-live-region` pattern.

Warning signs: VoiceOver / NVDA silent after upload completes.

### Pitfall 5: File type validation too strict breaks foreign files

What goes wrong: An editor pastes a URL to a .webp image; the file type validator rejects it.

Why it happens: Conflating URL-input validation with file-upload validation.

How to avoid: File type validation applies only to the file picker (`accept="image/*"` attribute). The URL input continues to accept any value. Do not validate URL input against image MIME types.

### Pitfall 6: Batch gallery upload blocks on slowest item

What goes wrong: One large image stalls the others — the entire batch appears to hang.

Why it happens: `Promise.all` rejects on the first failure; sequential await blocks on each upload.

How to avoid: Use `Promise.allSettled`. Start all uploads simultaneously. Append fulfilled URLs when all settle. Show per-item progress independently.

---

## Code Examples

### Upload handler for ImageEditor

```javascript
// Source: pattern derived from storage.js + existing ImageEditor conventions
import { uploadFile } from '../../firebase/storage.js'
import { useCMSFirebase } from '../../index.js'

// Inside ImageEditor component:
const { storage } = useCMSFirebase()
const [uploadProgress, setUploadProgress] = useState(null) // null | 0-100 | 'error'
const fileInputRef = useRef(null)
const pendingFileRef = useRef(null)

async function handleUpload(file) {
  pendingFileRef.current = file
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
  setUploadProgress(0)
  try {
    const url = await uploadFile(storage, file, path, (pct) => setUploadProgress(pct))
    onChange({ ...data, src: url })
    setUploadProgress(null)
  } catch {
    setUploadProgress('error')
  } finally {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
}

function handleRetry() {
  if (pendingFileRef.current) handleUpload(pendingFileRef.current)
}
```

### Upload trigger button (accessible)

```jsx
// Source: project patterns + WCAG 2.5.3 (label matches accessible name)
<button
  type="button"
  className="jeeby-cms-btn-ghost jeeby-cms-upload-btn"
  aria-label={uploadProgress !== null && uploadProgress !== 'error' ? 'Uploading…' : 'Upload image from device'}
  aria-disabled={uploadProgress !== null && uploadProgress !== 'error'}
  disabled={uploadProgress !== null && uploadProgress !== 'error'}
  onClick={() => fileInputRef.current?.click()}
>
  {uploadProgress !== null && uploadProgress !== 'error' ? <SpinnerIcon /> : <UploadIcon />}
</button>
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  style={{ display: 'none' }}
  aria-hidden="true"
  tabIndex={-1}
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }}
/>
```

### Inline progress bar

```jsx
// Source: project CSS conventions + runtime-dynamic inline style exception
{uploadProgress !== null && uploadProgress !== 'error' && (
  <div className="jeeby-cms-upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
    <div className="jeeby-cms-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
  </div>
)}
{uploadProgress === 'error' && (
  <div className="jeeby-cms-upload-error-row">
    <p role="alert" className="jeeby-cms-inline-error">Upload failed — check Storage permissions</p>
    <button type="button" className="jeeby-cms-btn-ghost" onClick={handleRetry}>Retry</button>
  </div>
)}
```

### Gallery batch upload (Upload multiple)

```jsx
// Source: project patterns + CONTEXT.md batch decision
const batchInputRef = useRef(null)

async function handleBatchUpload(files) {
  const fileArray = Array.from(files)
  // Start all in parallel, collect results
  const results = await Promise.allSettled(
    fileArray.map(file => {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `cms/media/images/${crypto.randomUUID()}.${ext}`
      return uploadFile(storage, file, path)
    })
  )
  const newItems = results
    .filter(r => r.status === 'fulfilled')
    .map(r => ({ src: r.value, alt: '', id: crypto.randomUUID() }))
  if (newItems.length > 0) {
    onChange({ ...data, items: [...items, ...newItems] })
  }
}
```

---

## Integration with Existing Editors

### ImageEditor integration points

The existing ImageEditor has two render paths (empty state, loaded state) and two sub-modes (view, edit). Upload UI appears only in edit mode alongside the URL input. Upload state is a third internal state within edit mode, not a new top-level mode.

The `onBlur` / blur-to-dismiss logic must be protected against upload: while `uploadProgress !== null`, do not collapse the editor.

The `handleContainerBlur` function currently checks `e.relatedTarget`. When the native file dialog opens, `relatedTarget` may be null (focus went to OS). The guard should be: if upload is in progress, skip dismissal regardless of blur event.

### GalleryEditor integration points

`GalleryItem` currently has no local state. Adding `uploadProgress` state to `GalleryItem` is the right level of granularity. The `storage` instance from `useCMSFirebase()` can be called directly inside `GalleryItem` (it is a React component inside the CMSProvider tree).

The batch "Upload multiple" button lives in `GalleryEditor` (not in `GalleryItem`), below the item list, alongside the existing "+ Add image" button. It needs its own hidden multi-file input and its own batch progress state (optional — batch may show a simple "Uploading N images..." text while pending).

---

## CSS Classes Required

New classes to add to `styles/cms.css` (all scoped under `.jeeby-cms-admin`):

| Class | Purpose |
|-------|---------|
| `.jeeby-cms-upload-btn` | Upload button modifier on top of `jeeby-cms-btn-ghost`; consistent sizing |
| `.jeeby-cms-image-url-row` | Wrapper for [URL input + Upload button] side by side in ImageEditor |
| `.jeeby-cms-upload-progress` | Progress bar track (full width, height 3px) |
| `.jeeby-cms-upload-progress-fill` | Progress bar fill (CSS transition on width) |
| `.jeeby-cms-upload-error-row` | Flex row: error text + Retry button |
| `.jeeby-cms-gallery-upload-btn` | Per-item upload button variant |
| `.jeeby-cms-gallery-batch-btn` | "Upload multiple" button at bottom of gallery edit mode |

The `width` percentage on `.jeeby-cms-upload-progress-fill` is the only runtime-dynamic value — stays as inline style per project convention.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None — discovered via glob in npm test script |
| Quick run command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/ImageEditor.test.js' 'src/admin/editors/GalleryEditor.test.js'` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MEDIA-01 | VideoEditor has embed URL input and produces iframe src | Static source check | `npm test` (VideoEditor.test.js already covers this) | Yes |
| MEDIA-03 | GalleryEditor source-checks for upload button, progress state, batch picker | Static source check | `node ... --test 'src/admin/editors/GalleryEditor.test.js'` | Yes (needs new tests) |
| MEDIA-04 | ImageEditor source-checks for upload button, progress state, useCMSFirebase, uploadFile | Static source check | `node ... --test 'src/admin/editors/ImageEditor.test.js'` | Yes (needs new tests) |

The project uses source-text assertions (readFileSync + assert.ok(src.includes(...))) for editor tests, not DOM rendering. New tests for this phase follow the same pattern.

### Sampling Rate

- Per task commit: `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/editors/ImageEditor.test.js' 'src/admin/editors/GalleryEditor.test.js'`
- Per wave merge: `npm test`
- Phase gate: `npm test` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/admin/editors/ImageEditor.test.js` — add tests for: upload button present, uploadFile import present, useCMSFirebase import present, progress state class present, role=alert on error
- [ ] `src/admin/editors/GalleryEditor.test.js` — add tests for: per-item upload button present, batch upload button present, uploadFile import present, useCMSFirebase import present
- [ ] `styles/cms.css` — add `.jeeby-cms-upload-progress`, `.jeeby-cms-upload-error-row`, `.jeeby-cms-image-url-row` classes

---

## Open Questions

1. **File size limit for client-side validation**
   - What we know: CONTEXT.md marks max file size as Claude's discretion
   - What's unclear: Firebase Storage default max is 5TB per object; network timeout is the practical limit
   - Recommendation: No hard client-side size block — warn if file exceeds 20MB (practical upload time concern for editors), but do not reject. Implement as a non-blocking hint, not an error.

2. **Accepted file types — `image/*` vs specific list**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Whether to allow `.gif` (may be large), `.svg` (security risk in `<img>`)
   - Recommendation: `accept="image/jpeg,image/png,image/gif,image/webp"` — explicit list excludes SVG (XSS risk in some browsers), avoids camera RAW files that browsers cannot preview, covers the four formats editors will actually use.

3. **Batch gallery upload progress UX**
   - What we know: Per-item progress shown in each GalleryItem row; batch button is at the gallery level
   - What's unclear: Whether the batch button needs aggregate progress or per-file progress
   - Recommendation: Show per-file progress inline in newly-created item rows as they are appended. For simplicity in Wave 1, batch upload creates placeholder items immediately (with `src: ''`) and fills them as each upload resolves. This gives editors visual confirmation that items were added.

---

## Sources

### Primary (HIGH confidence)

- `src/firebase/storage.js` — confirmed `uploadFile(storage, file, path, onProgress)` signature, Promise-based, 0-100 percent callback
- `src/admin/editors/ImageEditor.js` — confirmed existing URL/alt state structure, blur-to-dismiss pattern, render paths
- `src/admin/editors/GalleryEditor.js` — confirmed item shape `{src, alt, id}`, `Reorder.Item` structure, `useCMSFirebase` not yet called here
- `src/index.js` — confirmed `useCMSFirebase()` hook returns `{ storage, db, auth }`
- `styles/cms.css` — confirmed existing class names, CSS token system, `--jeeby-cms-error`, `--jeeby-cms-accent`
- `.planning/phases/09-media-handling/09-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Existing test files (`ImageEditor.test.js`, `GalleryEditor.test.js`, `storage.test.js`) — confirmed test pattern (readFileSync + source assertion), test runner invocation

### Tertiary (LOW confidence)

- None — all claims in this document are verifiable from project source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all required libraries already installed, confirmed in source
- Architecture: HIGH — uploadFile signature confirmed, integration points confirmed from reading existing editors
- Pitfalls: HIGH — blur-to-dismiss and file input reset issues are documented, deterministic failure modes
- CSS approach: HIGH — project CSS conventions confirmed from STATE.md and styles/cms.css

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (stable domain; Firebase Storage API is not fast-moving)
