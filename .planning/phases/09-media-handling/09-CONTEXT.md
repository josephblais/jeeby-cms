# Phase 9: Media Handling - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Firebase Storage upload capability to the Image and Gallery block editors. The URL-only path already works in both editors — this phase wires up file upload + progress UI alongside it. VideoEditor stays embed-URL only (raw video upload deferred). The front-end block rendering components are unchanged.

Scope:
- ImageEditor: add Upload button alongside existing URL input
- GalleryEditor: add per-item Upload button + batch "Upload multiple" picker
- Progress UI: inline progress bar, error state, retry
- Storage path convention established

Out of scope (deferred):
- VideoEditor file upload (MEDIA-02) — raw video upload deferred, embed URL already complete
- Storage file deletion / lifecycle management — consumer responsibility

</domain>

<decisions>
## Implementation Decisions

### Upload UI Pattern
- Dual affordance: URL text input and Upload button appear side by side, always visible
- No mode toggle / tabs — both affordances are always present
- Applies to ImageEditor and each GalleryEditor item row
- Gallery additionally gets a "Upload multiple" button that opens a file picker accepting multiple files at once
- Multiple gallery uploads run in parallel (not sequential)

### Upload Progress Display
- While uploading: inline progress bar appears below the URL input area
- Upload button becomes disabled with a spinner/clock indicator during upload
- Progress shows percentage (0–100%) filling left-to-right
- On success: download URL auto-fills the URL input; preview renders immediately (same as pasting a URL)
- On failure: inline error message replaces the progress bar (e.g. "Upload failed — check Storage permissions"); Retry button re-attempts with the same file
- No toast notifications for upload state — feedback is inline within the editor

### Firebase Storage Path Convention
- Path format: `cms/media/{type}/{uuid}.{ext}`
- Types: `images`, `videos` (future)
- UUID generated at upload time (`crypto.randomUUID()`)
- Extension preserved from original filename
- Examples:
  - `cms/media/images/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`
  - `cms/media/images/b2c3d4e5-f6a7-8901-bcde-f12345678901.png`

### Storage Lifecycle
- No auto-delete — Storage files are never deleted by the CMS
- Consumer manages Storage lifecycle (Firebase Storage cleanup rules, etc.)
- Rationale: avoids accidental deletion if a URL is copy-pasted or reused; keeps CMS logic simple

### MEDIA-02 Decision
- Raw video file upload to Firebase Storage is deferred
- VideoEditor remains embed-URL only (YouTube, Vimeo, Loom via toEmbedUrl())
- MEDIA-02 requirement marked deferred for post-v1 or a future phase

### Claude's Discretion
- Accepted file types for image upload (e.g. image/*, or specific: jpg/png/gif/webp)
- Max file size client-side validation (if any)
- Exact styling of the progress bar and error state within existing CSS class system
- How the Upload button's accessible label changes during upload state

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing upload infrastructure
- `src/firebase/storage.js` — `uploadFile(storage, file, path, onProgress)` and `deleteFile(storage, path)` — read signature before implementing; onProgress callback receives 0–100 integer

### Existing editor implementations
- `src/admin/editors/ImageEditor.js` — current URL + alt text implementation; upload integrates alongside, does not replace
- `src/admin/editors/GalleryEditor.js` — current per-item URL + alt + reorder; upload adds to each item row + batch picker
- `src/admin/editors/VideoEditor.js` — read to understand embed URL flow; NOT modified this phase

### Firebase context
- `src/firebase/init.js` — `useCMSFirebase()` hook that provides storage instance

### CSS class system
- `styles/cms.css` — all new UI elements must use `jeeby-cms-*` CSS classes, no inline styles except runtime-dynamic values

### Requirements
- `.planning/REQUIREMENTS.md` — MEDIA-01 through MEDIA-04 (note: MEDIA-01 complete, MEDIA-02 deferred, MEDIA-03 and MEDIA-04 are this phase's targets)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `uploadFile(storage, file, path, onProgress)` in `src/firebase/storage.js` — ready to use; handles resumable uploads and returns download URL
- `useCMSFirebase()` hook — provides `{ storage }` for passing to uploadFile
- `crypto.randomUUID()` — already used for block IDs; use same pattern for Storage UUID generation
- Framer Motion — already bundled; available for progress bar animation if desired (but not required)

### Established Patterns
- Inline styles banned except for runtime-dynamic values (opacity, z-index) — all new styling via CSS classes
- Accessibility: WCAG AA enforced; all interactive elements need labels, focus management, role=alert for status messages
- `jeeby-cms-btn-ghost` class for secondary/icon buttons (used by Gallery remove button — Upload button should follow same pattern or a new variant)
- Edit mode / view mode pattern already established in ImageEditor — upload state is a third state within edit mode, not a new mode

### Integration Points
- ImageEditor: add Upload button next to the URL input in edit mode; wire `uploadFile` with `src/firebase/init.js` storage
- GalleryEditor: add Upload button per item row + "Upload multiple" button below the item list
- Both editors: new `uploadProgress` state per upload (null = idle, 0–100 = uploading, 'error' = failed)
- No changes to BlockCanvas, PageEditor, or Firestore layer — upload is purely editor-level

</code_context>

<specifics>
## Specific Ideas

- Progress bar: inline thin bar below the URL input, consistent with the quiet/polished aesthetic (no flashy animations)
- Retry: re-uses the same `File` object from the original file picker selection — no need to re-open the file picker
- Gallery batch upload: after parallel uploads complete, all successful items are appended to the items array at once

</specifics>

<deferred>
## Deferred Ideas

- MEDIA-02: Raw video file upload to Firebase Storage — deferred post-v1
- Storage file auto-deletion on block delete — consumer manages lifecycle
- Upload cancellation (cancel in-progress upload) — not scoped

</deferred>

---

*Phase: 09-media-handling*
*Context gathered: 2026-03-23*
