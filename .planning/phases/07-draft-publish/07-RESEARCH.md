# Phase 7: Draft / Publish - Research

**Researched:** 2026-03-18
**Domain:** Admin UI publish workflow — Firestore field updates, modal/toast patterns, React state management
**Confidence:** HIGH

## Summary

Phase 7 is a thin integration phase. The core data structures (draft/published split, lastPublishedAt) are already in Firestore, and `publishPage()` already exists in `src/firebase/firestore.js`. The work is:
1. Extend two Firestore helpers (`saveDraft`, `publishPage`) with one extra field write each
2. Add publish state to `PageEditor` and pass it down through `EditorHeader`
3. Build two new files: `PublishConfirmModal.js` and `PublishToast.js`
4. Add source-inspection tests for all new and modified components
5. Add a source-inspection test asserting `getCMSContent` and `useCMSContent` return only `published` data (PUB-03 contract test)

All UI patterns (focus trap, toast, live region) are established in the codebase and must be reused exactly. No new libraries are required.

**Primary recommendation:** Implement as two plans — (1) Firestore layer + front-end contract tests, (2) Admin UI (EditorHeader extension + PublishConfirmModal + PublishToast + PageEditor wiring).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Extend `EditorHeader` — no separate bar component
- Right side of header: `Last published: Mar 18 · Unpublished changes  Saved  [ Publish ]`
- Save status and Publish button sit side by side in the right slot
- Last published date is always visible (not hidden in a tooltip)
- When never published: `Last published: Never · Unpublished changes  Saved  [ Publish ]`
- Use a `hasDraftChanges` boolean field on the Firestore page document
- `saveDraft()` sets `hasDraftChanges: true` on every write
- `publishPage()` clears `hasDraftChanges: false` on publish
- No block array comparison — simple, reliable, no extra reads
- Indicator is subtle text: `Unpublished changes` next to the last published date
- No colored dot, no button label change — plain text in the header
- Clicking Publish opens a confirmation modal — not a silent fire
- Modal copy: "Publish '[Page Name]'? This will replace the current live version with your latest draft. Visitors will see the new content immediately."
- Buttons: `[ Cancel ]` and `[ Publish now ]`
- On success: modal closes, header updates (date refreshes, "Unpublished changes" disappears), a brief toast fires: "Page published successfully." — auto-dismisses after 3s
- Toast uses the same pattern as `UndoToast` already in the editor
- On error: modal stays open, error message shown inside modal
- UnsavedChangesWarning is NOT extended for unpublished changes — the two concerns stay separate

### Claude's Discretion
- Exact modal focus trap implementation (reuse `CreatePageModal` pattern)
- Publish button disabled state while modal is open or publish is in-flight
- ARIA live region for toast announcement (same pattern as PageManager announcements)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PUB-01 | `PublishBar` shows last published date and unsaved indicator | Implemented by extending `EditorHeader` with `lastPublishedAt`, `hasDraftChanges` props and `jeeby-cms-publish-controls` right slot |
| PUB-02 | Admin can publish a page (copies `draft` → `published`, updates `lastPublishedAt`) | `publishPage()` in `firestore.js` already does the copy; needs `hasDraftChanges: false` added to its `updateDoc` call |
| PUB-03 | Front-end always reads from `published.blocks`; live site is unaffected until publish | Already implemented in Phase 3 (`useCMSContent` returns `snap.data()?.published` in `src/index.js`; `getCMSContent` returns `pageData?.published` in `src/server/index.js`); Phase 7 adds source-inspection tests asserting both contracts |
</phase_requirements>

## Standard Stack

### Core — already installed
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | peer dep | Hooks, JSX rendering | Project standard |
| firebase/firestore | peer dep | `updateDoc`, `serverTimestamp` | Already used for all Firestore writes |

No new packages are required for this phase. All UI patterns exist in the codebase.

**New files created this phase:**
- `src/admin/PublishConfirmModal.js`
- `src/admin/PublishToast.js`
- `src/admin/PublishConfirmModal.test.js`
- `src/admin/PublishToast.test.js`

**Modified files:**
- `src/firebase/firestore.js` — add `hasDraftChanges` field writes to `saveDraft` and `publishPage`
- `src/admin/EditorHeader.js` — add publish controls to right slot
- `src/admin/PageEditor.js` — add publish state management, load `hasDraftChanges`/`lastPublishedAt`, wire `handlePublish`
- `src/admin/EditorHeader.test.js` — add tests for new props/markup
- `src/admin/PageEditor.test.js` — add publish wiring tests
- `src/firebase/firestore.test.js` — add `hasDraftChanges` field assertions
- New test file for PUB-03 contract (e.g. `src/server/index.test.js` additions or standalone)

## Architecture Patterns

### Recommended Project Structure
No new folders. All new files follow the flat `src/admin/` pattern.

```
src/
├── admin/
│   ├── EditorHeader.js         ← extend (add publish controls)
│   ├── PageEditor.js           ← extend (add publish state + handler)
│   ├── PublishConfirmModal.js  ← NEW (modal, reuse CreatePageModal pattern)
│   ├── PublishToast.js         ← NEW (toast, reuse UndoToast pattern)
│   ├── PublishConfirmModal.test.js  ← NEW
│   └── PublishToast.test.js    ← NEW
└── firebase/
    └── firestore.js            ← extend saveDraft + publishPage
```

### Pattern 1: Firestore boolean flag for draft tracking
**What:** `saveDraft()` merges `hasDraftChanges: true` into the `updateDoc` payload. `publishPage()` merges `hasDraftChanges: false`. On `getPage()`, `PageEditor` reads both `lastPublishedAt` and `hasDraftChanges` into component state.
**When to use:** This is the only approach — no block comparison, no extra reads.

Current `saveDraft`:
```javascript
// src/firebase/firestore.js
export async function saveDraft(db, slug, blocks) {
  await updateDoc(pageRef(db, slug), {
    'draft.blocks': blocks,
    updatedAt: serverTimestamp(),
  })
}
```

Phase 7 change (add one line):
```javascript
export async function saveDraft(db, slug, blocks) {
  await updateDoc(pageRef(db, slug), {
    'draft.blocks': blocks,
    hasDraftChanges: true,       // ADD
    updatedAt: serverTimestamp(),
  })
}
```

Current `publishPage`:
```javascript
export async function publishPage(db, slug) {
  const page = await getPage(db, slug)
  if (!page) throw new Error(`Page "${slug}" not found`)
  await updateDoc(pageRef(db, slug), {
    'published.blocks': page.draft?.blocks ?? [],
    lastPublishedAt: serverTimestamp(),
  })
}
```

Phase 7 change (add one line):
```javascript
export async function publishPage(db, slug) {
  const page = await getPage(db, slug)
  if (!page) throw new Error(`Page "${slug}" not found`)
  await updateDoc(pageRef(db, slug), {
    'published.blocks': page.draft?.blocks ?? [],
    lastPublishedAt: serverTimestamp(),
    hasDraftChanges: false,      // ADD
  })
}
```

### Pattern 2: PageEditor publish state management
**What:** Load `lastPublishedAt` and `hasDraftChanges` from `getPage()` on mount. Store in state. Pass to `EditorHeader`. `handlePublish` calls `publishPage(db, slug)`, then updates local state on success.
**When to use:** Same load effect already in `PageEditor`. Extend — do not duplicate.

```javascript
// In PageEditor load effect
const page = await getPage(db, slug)
if (!cancelled) {
  setBlocks(page?.draft?.blocks ?? [])
  setPageName(page?.name ?? slug)
  setLastPublishedAt(page?.lastPublishedAt ?? null)  // ADD
  setHasDraftChanges(page?.hasDraftChanges ?? false) // ADD
  setLoading(false)
}
```

```javascript
// handlePublish in PageEditor
async function handlePublish() {
  setPublishStatus('publishing')
  try {
    await publishPage(db, slug)
    // serverTimestamp() is a sentinel; re-read to get the resolved value
    const updated = await getPage(db, slug)
    setLastPublishedAt(updated?.lastPublishedAt ?? null)
    setHasDraftChanges(false)
    setPublishStatus('idle')
    setShowPublishModal(false)
    setShowPublishToast(true)
  } catch {
    setPublishStatus('error')
    // modal stays open — error shown inside modal
  }
}
```

Auto-dismiss publish toast (same 3s pattern as UndoToast lifecycle):
```javascript
useEffect(() => {
  if (!showPublishToast) return
  const t = setTimeout(() => setShowPublishToast(false), 3000)
  return () => clearTimeout(t)
}, [showPublishToast])
```

### Pattern 3: PublishConfirmModal — reuse CreatePageModal focus trap
**What:** Identical focus trap implementation. `dialogRef` + `querySelectorAll` of focusable elements + Tab/Shift+Tab wrap + Escape close + `triggerRef.current?.focus()` on close.
**When to use:** Any modal in this codebase. Never hand-roll a custom trap.

Key difference from CreatePageModal: initial focus goes to Cancel button (not first input), because pressing Enter on an accidentally open modal should not publish.

```javascript
// Focus first focusable on open (Cancel button is rendered first in button row)
useEffect(() => {
  if (open) {
    const focusable = dialogRef.current?.querySelector(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusable) focusable.focus()
  } else {
    triggerRef?.current?.focus()
  }
}, [open])
```

### Pattern 4: PublishToast — reuse UndoToast structure, no action button
**What:** `role="status"` + `aria-live="polite"` + `aria-atomic="true"`. `position: fixed`, `bottom: 24px`, `left: 50%`, `transform: translateX(-50%)`, `zIndex: 200`. Background `#1f2937`, color `#f9fafb`. No Undo button.
**When to use:** Success-only notifications. The auto-dismiss is managed in PageEditor, not the toast itself (same as UndoToast — PageEditor controls `deletedBlock` state lifetime).

### Pattern 5: EditorHeader right slot extension
**What:** The right slot currently holds a single `<div role="status">` for save status. Phase 7 wraps it in a publish-controls div and adds the publish date, draft indicator, and Publish button.

New props accepted by EditorHeader:
- `lastPublishedAt` — Firestore Timestamp or null
- `hasDraftChanges` — boolean
- `onPublish` — function
- `publishStatus` — `'idle' | 'publishing'`

Right slot structure:
```jsx
<div className="jeeby-cms-publish-controls" style={{
  display: 'flex', alignItems: 'center', gap: '16px'
}}>
  <span className="jeeby-cms-publish-status">
    Last published: {lastPublishedAt ? formatDate(lastPublishedAt) : 'Never'}
  </span>
  {hasDraftChanges && (
    <>
      <span aria-hidden="true">·</span>
      <span className="jeeby-cms-draft-indicator">Unpublished changes</span>
    </>
  )}
  {/* Existing save status div unchanged */}
  <div role="status" aria-live={saveStatus === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
    ...
  </div>
  <button
    type="button"
    className="jeeby-cms-btn-primary"
    onClick={onPublish}
    disabled={publishStatus === 'publishing'}
    aria-busy={publishStatus === 'publishing' ? 'true' : undefined}
    style={{ minHeight: '44px', cursor: 'pointer' }}
  >
    {publishStatus === 'publishing' ? 'Publishing\u2026' : 'Publish'}
  </button>
</div>
```

Note: `formatDate` helper already exists in `PageManager.js` (formats Firestore Timestamp or Date). Either copy it into EditorHeader or extract to a shared utility.

### Anti-Patterns to Avoid
- **Block array comparison for hasDraftChanges:** Do not compare JSON.stringify of draft vs published arrays. The boolean flag is simpler, cheaper, and was the explicit decision.
- **Inline publish without confirmation:** The Publish button MUST open the modal. No direct call to `publishPage()` on button click.
- **`aria-live` on the "Unpublished changes" span:** It is static state text, not a dynamic announcement. Do not add a live region to it.
- **Toast with auto-dismiss stealing focus:** `setShowPublishToast(false)` after 3s must not call `.focus()` on anything. The toast has no interactive elements so there is no trap risk.
- **Separate PublishBar component:** CONTEXT.md locked the decision to extend EditorHeader. Do not create a new component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap for modal | Custom event listener logic | Copy `CreatePageModal.js` pattern exactly | Already tested, Escape + Tab wrap proven |
| Toast auto-dismiss | Animation library | `setTimeout` + `useEffect` cleanup | Same as UndoToast — consistent, no deps |
| Publish timestamp display | Moment.js or date-fns | `toLocaleDateString` or `toDate().toLocaleDateString(...)` | PageManager already uses this — stay consistent |
| "Differs from published" detection | Block array deep-compare | `hasDraftChanges` boolean field | Cheaper, no extra reads, explicit decision |

## Common Pitfalls

### Pitfall 1: Firestore serverTimestamp is not available for optimistic display
**What goes wrong:** After `publishPage()` succeeds, the locally-written `lastPublishedAt` field is `serverTimestamp()` — a sentinel value, not an actual Date. Reading it back from local state before Firestore resolves returns `null` or the sentinel object.
**Why it happens:** Firestore server timestamps are populated asynchronously on the server; the local write does not immediately reflect the real time.
**How to avoid:** After a successful `publishPage()` call, do a follow-up `getPage(db, slug)` to read the resolved timestamp. Alternatively, use `new Date()` as a client-side approximation for the display while the server resolves (acceptable for v1).
**Warning signs:** Header shows "Last published: Never" or displays "[object Object]" after publish.

### Pitfall 2: hasDraftChanges not set on existing pages
**What goes wrong:** Pages created before Phase 7 have no `hasDraftChanges` field. `getPage()` returns `undefined` for the field. Without a `?? false` default, `hasDraftChanges` could be `undefined`, which is falsy but could cause subtle rendering issues if passed to boolean-strict comparisons.
**How to avoid:** Always default: `page?.hasDraftChanges ?? false` when loading into state.
**Warning signs:** "Unpublished changes" never appears on pre-Phase-7 pages even after edits.

### Pitfall 3: publishPage() reads draft.blocks, but saveDraft() may be in-flight
**What goes wrong:** The debounce timer in `PageEditor` may have a pending save when the user clicks Publish. `publishPage()` reads `draft.blocks` from Firestore, which could be stale if the debounce hasn't fired yet.
**How to avoid:** Disable the Publish button when `saveStatus === 'saving'`. This prevents publishing mid-save and is a good UX decision regardless.
**Warning signs:** Published content is missing the most recent block edits.

### Pitfall 4: Modal error state — publishError stale on re-open
**What goes wrong:** If publish fails and the modal closes, then reopens, the old `publishError` is still in state. The user sees a stale error message on open.
**How to avoid:** Clear `publishError` (and reset `publishStatus` to `'idle'`) when the modal opens. Same pattern as CreatePageModal resetting form state on open.
**Warning signs:** Error message appears on a fresh modal open before any attempt.

### Pitfall 5: EditorHeader test file uses source inspection
**What goes wrong:** The existing `EditorHeader.test.js` tests use `readFileSync` to assert string presence. Adding new JSX to `EditorHeader.js` means the test file needs new assertions matching the exact strings added.
**How to avoid:** After extending `EditorHeader.js`, add corresponding source-inspection tests for: `hasDraftChanges`, `lastPublishedAt`, `onPublish`, `Unpublished changes`, `Last published:`, `Publish`.
**Warning signs:** Phase gate fails because new markup is not covered by tests.

### Pitfall 6: Pre-existing failing test in firestore.test.js
**What goes wrong:** `firestore.test.js` line 128 asserts `src.includes("collection(db, 'cms', 'pages')")` but the actual implementation uses `collection(db, 'pages')` (no `'cms'` segment). This test fails today.
**Why it matters:** Phase 7 must not accidentally fix or break this test. The plan should acknowledge it as pre-existing and leave it untouched (it will be fixed in a dedicated cleanup or Phase 2 completion task).
**Warning signs:** `npm test` shows a failure on `firestore.test.js` line 128 before any Phase 7 changes are made.

## Code Examples

Verified from codebase (source: `src/admin/CreatePageModal.js`, `src/admin/UndoToast.js`, `src/admin/PageManager.js`, `src/server/index.js`, `src/index.js`):

### Focus trap pattern (from CreatePageModal.js)
```javascript
function handleKeyDown(e) {
  if (e.key === 'Escape') { onClose(); return }
  if (e.key !== 'Tab') return
  const focusable = dialogRef.current.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus()
  }
}
```

### Toast structure (from UndoToast.js)
```javascript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="jeeby-cms-undo-toast"
  style={{
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: '12px',
    zIndex: 200,
    background: '#1f2937', color: '#f9fafb',
  }}
>
```

### Live region pattern (from PageManager.js)
```javascript
const [announcement, setAnnouncement] = useState('')

useEffect(() => {
  if (announcement) {
    const t = setTimeout(() => setAnnouncement(''), 3000)
    return () => clearTimeout(t)
  }
}, [announcement])

// In JSX:
<div className="jeeby-cms-live-region" aria-live="polite" aria-atomic="true" style={{
  position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
}}>
  {announcement}
</div>
```

### Modal dialog structure (from CreatePageModal.js)
```javascript
<div className="jeeby-cms-modal-backdrop" style={{
  position: 'fixed', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
}}>
  <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="create-modal-heading"
    className="jeeby-cms-modal-card" onKeyDown={handleKeyDown}
    style={{ maxWidth: '480px', width: '100%' }}>
    <h2 id="create-modal-heading">...</h2>
    ...
  </div>
</div>
```

### Date formatting helper (from PageManager.js)
```javascript
function formatDate(ts) {
  if (!ts) return 'Never'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
```

### PUB-03 front-end contract (confirmed in source)
```javascript
// src/index.js — useCMSContent (line 77)
setData(snap.exists() ? (snap.data()?.published ?? null) : null)

// src/server/index.js — getCMSContent (line 45)
return pageData?.published ?? null
```

### Source-inspection test pattern (from EditorHeader.test.js)
```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./EditorHeader.js', import.meta.url), 'utf8')

test('EditorHeader includes Publish button', () => {
  assert.ok(src.includes('Publish'), 'EditorHeader must include Publish button text')
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Block array comparison for "differs from published" | Boolean `hasDraftChanges` field | Phase 7 decision | No extra reads, no JSON.stringify overhead |
| publishPage() without hasDraftChanges reset | publishPage() sets hasDraftChanges: false | Phase 7 | Indicator disappears immediately on publish |
| EditorHeader with only save status in right slot | EditorHeader with publish controls + save status | Phase 7 | Single coherent right slot, no separate component |

**Deprecated/outdated:**
- Pre-existing: `firestore.test.js` line 128 asserts `collection(db, 'cms', 'pages')` but implementation uses `collection(db, 'pages')`. This test fails today. Not introduced by Phase 7 — leave untouched.

## Open Questions

1. **Publish button disabled when saveStatus === 'saving'**
   - What we know: CONTEXT.md does not explicitly lock this — it's Claude's discretion.
   - What's unclear: Whether to disable the button only during in-flight publish, or also while an auto-save is pending.
   - Recommendation: Disable Publish when `saveStatus === 'saving'` (flushes the debounce risk from Pitfall 3). This is a one-line addition and avoids a real data race.

*(No other open questions — all source files read, getCMSContent confirmed in `src/server/index.js`.)*

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | none — run via npm test script |
| Quick run command | `npm test -- --test-name-pattern "EditorHeader\|PublishConfirm\|PublishToast\|firestore"` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUB-01 | EditorHeader renders `lastPublishedAt` and `Unpublished changes` | unit (source inspection) | `npm test -- --test-name-pattern "EditorHeader"` | ✅ EditorHeader.test.js (needs new assertions) |
| PUB-01 | hasDraftChanges prop controls indicator visibility | unit (source inspection) | same | ✅ needs new assertions |
| PUB-02 | publishPage() sets hasDraftChanges: false | unit (source inspection) | `npm test -- --test-name-pattern "firestore"` | ✅ firestore.test.js (needs new assertion) |
| PUB-02 | saveDraft() sets hasDraftChanges: true | unit (source inspection) | same | ✅ firestore.test.js (needs new assertion) |
| PUB-02 | PageEditor imports publishPage and calls it in handlePublish | unit (source inspection) | `npm test -- --test-name-pattern "PageEditor"` | ✅ PageEditor.test.js (needs new assertions) |
| PUB-03 | useCMSContent returns published sub-object only | unit (source inspection) | `npm test -- --test-name-pattern "useCMSContent\|getCMSContent\|published"` | ❌ Wave 0 — new test needed |
| PUB-03 | getCMSContent returns published sub-object only | unit (source inspection) | same | ❌ Wave 0 — add to src/server/index.test.js |
| n/a | PublishConfirmModal has focus trap + Escape | unit (source inspection) | `npm test -- --test-name-pattern "PublishConfirmModal"` | ❌ Wave 0 — new file |
| n/a | PublishConfirmModal has role="dialog" aria-modal | unit (source inspection) | same | ❌ Wave 0 — new file |
| n/a | PublishToast has role="status" aria-live="polite" | unit (source inspection) | `npm test -- --test-name-pattern "PublishToast"` | ❌ Wave 0 — new file |
| n/a | PublishToast has position fixed + zIndex 200 | unit (source inspection) | same | ❌ Wave 0 — new file |

### Sampling Rate
- Per task commit: `npm test -- --test-name-pattern "EditorHeader|PublishConfirm|PublishToast|PageEditor|firestore"`
- Per wave merge: `npm test`
- Phase gate: Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/admin/PublishConfirmModal.test.js` — covers role="dialog", aria-modal, focus management, Escape close, error state, aria-labelledby, "Publish now" button text, "Cancel" button text, "use client" directive
- [ ] `src/admin/PublishToast.test.js` — covers role="status", aria-live="polite", aria-atomic="true", position fixed, "Page published successfully." text, "use client" directive
- [ ] New tests in `src/admin/EditorHeader.test.js` — covers hasDraftChanges prop, lastPublishedAt prop, onPublish prop, "Unpublished changes" text, "Last published:" text, "Publish" button text
- [ ] New tests in `src/admin/PageEditor.test.js` — covers publishPage import, showPublishModal state, handlePublish wiring
- [ ] New tests in `src/firebase/firestore.test.js` — covers `hasDraftChanges: true` in saveDraft source, `hasDraftChanges: false` in publishPage source
- [ ] PUB-03 tests in `src/server/index.test.js` — asserts `?.published` appears in getCMSContent source
- [ ] PUB-03 test for useCMSContent — asserts `?.published` appears in src/index.js source

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/firebase/firestore.js` — publishPage, saveDraft implementations confirmed
- Direct source read: `src/admin/EditorHeader.js` — current right slot structure, props list
- Direct source read: `src/admin/PageEditor.js` — load effect pattern, state management, scheduleSave
- Direct source read: `src/admin/CreatePageModal.js` — focus trap, Escape, triggerRef pattern
- Direct source read: `src/admin/UndoToast.js` — toast structure, ARIA pattern
- Direct source read: `src/admin/PageManager.js` — live region + announcement + formatDate patterns
- Direct source read: `src/index.js` — useCMSContent returns `snap.data()?.published` confirmed
- Direct source read: `src/server/index.js` — getCMSContent returns `pageData?.published` confirmed
- Direct source read: `.planning/phases/07-draft-publish/07-CONTEXT.md` — all locked decisions
- Direct source read: `.planning/phases/07-draft-publish/07-UI-SPEC.md` — component inventory, class names, copywriting contract

### Secondary (MEDIUM confidence)
- `src/admin/EditorHeader.test.js`, `src/admin/PageEditor.test.js`, `src/firebase/firestore.test.js` — test patterns verified, Wave 0 gap list derived from inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all patterns from codebase
- Architecture: HIGH — all integration points confirmed by direct source read
- Pitfalls: HIGH — derived from actual source code and established codebase patterns
- Test map: HIGH — existing test pattern (source inspection via readFileSync) confirmed; PUB-03 file paths confirmed

**Research date:** 2026-03-18
**Valid until:** Phase 7 implementation complete (stable codebase, no fast-moving dependencies)
