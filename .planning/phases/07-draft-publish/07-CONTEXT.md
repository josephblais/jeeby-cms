# Phase 7: Draft / Publish - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Give admins explicit control over when draft changes go live. The editor header shows publish status (last published date, unpublished changes indicator) and a Publish button. Clicking Publish copies `draft.blocks` → `published.blocks` and updates `lastPublishedAt`. The front-end already reads `published.blocks` only (implemented in Phase 3) — Phase 7 adds tests for that contract and the admin-side publish action.

</domain>

<decisions>
## Implementation Decisions

### PublishBar Placement
- Extend `EditorHeader` — no separate bar component
- Right side of header: `Last published: Mar 18 · Unpublished changes  Saved ✓  [ Publish ]`
- Save status and Publish button sit side by side in the right slot
- Last published date is always visible (not hidden in a tooltip)
- When never published: `Last published: Never · Unpublished changes  Saved ✓  [ Publish ]`

### "Differs from Published" Detection
- Use a `hasDraftChanges` boolean field on the Firestore page document
- `saveDraft()` sets `hasDraftChanges: true` on every write
- `publishPage()` clears `hasDraftChanges: false` on publish
- No block array comparison — simple, reliable, no extra reads
- Indicator is subtle text: `Unpublished changes` next to the last published date
- No colored dot, no button label change — plain text in the header

### Publish Confirmation UX
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/REQUIREMENTS.md` §Draft / Publish — PUB-01, PUB-02, PUB-03

### Existing editor (integration points)
- `src/admin/PageEditor.js` — PageEditor component; Phase 7 extends EditorHeader props and adds publish state here
- `src/admin/EditorHeader.js` — Current header: ← Pages link, page name, save status; Phase 7 adds publish controls to the right slot
- `src/admin/UndoToast.js` — Existing toast component and pattern; "Page published" toast reuses this

### Firestore helpers
- `src/firebase/firestore.js` — `publishPage(db, slug)` already exists (copies draft → published, writes `lastPublishedAt`); needs updating to also clear `hasDraftChanges`; `saveDraft()` needs to add `hasDraftChanges: true`; `getPage()` used to load `lastPublishedAt` and `hasDraftChanges` on editor open

### Admin patterns (reuse these)
- `src/admin/CreatePageModal.js` — Focus trap, Escape-to-close, `triggerRef` focus-return — reuse for the Publish confirmation modal
- `src/admin/PageManager.js` — Live region announcement pattern (`announcement` + `aria-live`) — reuse for toast

### Front-end contract (verify, don't reimplement)
- `src/firebase/firestore.js` `getCMSContent` — Must return `published.blocks` only; this was implemented in Phase 3 but Phase 7 should add a unit test asserting it
- `src/index.js` `useCMSContent` — Same — verify it reads `published` sub-object only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UndoToast.js` — Toast UI component with auto-dismiss; Phase 7 can fire "Page published successfully." through the same mechanism (or a new `PublishToast` if props differ)
- `CreatePageModal.js` — Full focus trap + Escape + triggerRef pattern; Publish confirmation modal reuses this entirely
- `EditorHeader.js` — Already renders the right slot with save status; Phase 7 extends its props to accept `lastPublishedAt`, `hasDraftChanges`, and `onPublish`
- `publishPage(db, slug)` in `firestore.js` — Already exists; needs one additional field write (`hasDraftChanges: false`)

### Established Patterns
- Modals: focus trap + Escape close + `triggerRef` for focus-return on close (see `CreatePageModal`)
- Toast announcements: `announcement` state + `aria-live="polite"` region + 3s auto-clear (see `PageManager`)
- Debounced saves: `useRef` + `clearTimeout` + async try/catch with status states (`saving`, `saved`, `error`)
- JavaScript only, no TypeScript; `"use client"` at top of every admin component

### Integration Points
- `PageEditor.js` — Add `lastPublishedAt`, `hasDraftChanges` to loaded page state; pass to `EditorHeader`; add `handlePublish` function
- `EditorHeader.js` — Add props: `lastPublishedAt`, `hasDraftChanges`, `onPublish`; render publish controls in right slot
- `firestore.js` `saveDraft()` — Add `hasDraftChanges: true` to the `updateDoc` payload
- `firestore.js` `publishPage()` — Add `hasDraftChanges: false` to the `updateDoc` payload

</code_context>

<specifics>
## Specific Ideas

- The confirmation modal copy is explicit about consequence: "This will replace the current live version with your latest draft. Visitors will see the new content immediately." — informative, not alarmist.
- Success feedback is dual: header updates (date changes, unpublished indicator disappears) AND a toast fires. Both together make the state change unambiguous.
- "Never published" as the default last-published text keeps the header layout consistent from the very first edit.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-draft-publish*
*Context gathered: 2026-03-18*
