# Phase 6: Block Editor - Research

**Researched:** 2026-03-18
**Domain:** React drag-and-drop block editor, Tiptap rich text, Framer Motion Reorder, Firestore auto-save
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page Editor Navigation**
- Consumer creates `/admin/pages/[slug]/page.js` that renders `<AdminPanel><PageEditor slug={slug} /></AdminPanel>`
- `PageEditor` is a standalone exported component — consumer wraps it in AdminPanel
- `PageManager` gets two access points: page name becomes a link AND an Edit button added to the Actions column
- Links point to `/admin/pages/[slug]`
- Browser back from the editor returns to `/admin` (standard Next.js App Router behavior)
- Editor renders inside the same AdminPanel shell — nav bar stays visible

**Page Editor Header**
- Header layout: `← Pages` link on the left, page name in the center, save status on the right
- No Publish button in Phase 6

**Canvas Layout (Notion-Style)**
- No block type labels on cards — fields mirror the output content directly
- Drag handle (⠿) and delete button appear on hover, hidden at rest
- Each block's fields are always visible inline (no click-to-expand)
- Empty canvas state: centered prompt "No blocks yet — click + to add your first block" with a visible + button

**Add Block UX**
- Floating `+` button appears between every block and after the last block
- Clicking `+` opens a dropdown list of all 5 block types: Title, Text, Image, Video, Gallery
- New block inserts at the clicked position (not always at the bottom)
- New block appears immediately with fields open and ready to edit

**Delete Block UX**
- Delete button on each block card (visible on hover)
- Clicking Delete is immediate on the canvas (block disappears)
- Firestore write deferred — delete held for a 5-second undo window before writing to Firestore
- If admin clicks Undo within 5 seconds: block re-inserted at original position, no Firestore write
- After 5 seconds: `saveDraft` fires with the updated blocks array

**Block Editor Forms (per type)**
- Title: `contenteditable`-style input at actual heading font size; heading level selector (h2–h6 dropdown)
- Text (RichText): Tiptap WYSIWYG with `@tiptap/starter-kit`; outputs raw HTML stored in `data.html`
- Image: URL text input + alt text input; actual image renders on canvas once URL entered
- Video: Embed URL input only; `toEmbedUrl()` handles conversion; no file upload
- Gallery: List of items with URL + alt per item; `+ Add image` button; remove per item

**Tiptap Bundling**
- `@tiptap/react` and `@tiptap/starter-kit` are bundled into the admin entry (not peer deps)
- Core open-source extensions only — no Tiptap Pro

**Block IDs and Ordering**
- Each block has `block.id` set to `crypto.randomUUID()` at creation time
- Array order in `draft.blocks` defines display order
- Drag-to-reorder updates the array and triggers auto-save

**Auto-save**
- Trigger: debounced, 1 second after the last change to any block field
- Each block manages its own debounce timer; the whole `draft.blocks` array is written on each save
- Save writes to `draft.blocks` only via the existing `saveDraft(db, slug, blocks)` helper
- Status indicator: "Saving..." while in-flight, "Saved" after success
- On error: "Save failed. Retry?" with a Retry button near the status indicator

**Back Navigation**
- If debounce timer still pending when admin clicks ← Pages: show "You have unsaved changes" warning
- If nothing is pending: navigate immediately

### Claude's Discretion
- Exact CSS for block cards, drag handles, dropdown, and canvas layout (Phase 8 handles full CSS — Phase 6 uses minimal inline styles sufficient for function)
- Specific dropdown open/close implementation for the + block picker
- Exact Framer Motion drag props for reorder (constraint axis, drag handle selector, animation spring)
- Error boundary or fallback for failed image URLs in the Image block editor preview

### Deferred Ideas (OUT OF SCOPE)
- Firebase Storage file upload for Image, Video, Gallery — Phase 9
- Inline formatting (bold/italic) within Title block — stretch goal, deferred post-Phase 6
- Publish button in the page editor header — Phase 7
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | Admin can view and edit blocks on a page in a drag-and-drop canvas | Framer Motion `Reorder.Group`/`Reorder.Item` confirmed as the pattern; `getPage` loads `draft.blocks` for initial state |
| EDIT-02 | Admin can add a new block of any supported type via `BlockToolbar` | `AddBlockButton` + `BlockTypePicker` dropdown pattern; `crypto.randomUUID()` for IDs; insert-at-position logic |
| EDIT-03 | Admin can reorder blocks via drag-and-drop (Framer Motion) | `Reorder.Group` with `dragListener={false}` + custom drag handle confirmed; `onReorder` callback fires with new array |
| EDIT-04 | Admin can delete a block | 5-second deferred `saveDraft` via `useRef` + `clearTimeout` undo timer pattern |
| EDIT-05 | Block edits auto-save to Firestore `draft.blocks` on change | Per-block debounce via `useRef`/`clearTimeout` (1s); `saveDraft(db, slug, blocks)` drop-in helper confirmed |
| EDIT-06 | Each block type has its own editor form (Title, Paragraph, RichText, Image, Video, Gallery) | TitleEditor (contenteditable), TextEditor (Tiptap), ImageEditor, VideoEditor, GalleryEditor — field schemas confirmed from block source files |
</phase_requirements>

---

## Summary

Phase 6 builds the block editor canvas inside the existing AdminPanel shell. The technical stack is entirely determined by prior decisions: Framer Motion (already a peer dep) for drag-and-drop reorder, Tiptap (to be bundled as devDependency) for rich text editing, and the existing `saveDraft`/`getPage` Firestore helpers for persistence. No new infrastructure is needed.

The most complex coordination problem is the interaction between three concurrent timers: per-block auto-save debounces (1s), the delete undo window (5s), and the unsaved-changes navigation gate. These must not conflict. The established pattern from PageManager and CreatePageModal — `useRef` + `clearTimeout` for debounce, `useEffect` for cleanup — scales directly to this phase.

A data schema discrepancy exists between CONTEXT.md (which states Image reads `data.url`) and the actual `Image.js` source (which uses `data.src`). Similarly, Gallery.js uses `item.src` but the block registry docs say `{ url, alt }`. The editor forms must write the field names the front-end components actually read, or Phase 7/front-end rendering will break silently.

**Primary recommendation:** Build the editor as a single `PageEditor` component containing `EditorHeader` + `BlockCanvas`, with each block type's editor as a thin leaf component. The `PageEditor` owns the `blocks` array state and all Firestore coordination; leaf editors receive `data` and an `onChange(data)` callback only.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.38.0 (peer dep, already installed by consumer) | Drag-and-drop reorder via `Reorder.Group`/`Reorder.Item` | Already a peer dep in this project; decision locked |
| @tiptap/react | 3.20.4 | React integration for Tiptap rich text editor | Decision locked — bundle in admin entry |
| @tiptap/starter-kit | 3.20.4 | Bold, italic, lists, links, headings in one extension bundle | Decision locked — core open-source only |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | Node built-in / browser built-in | Block ID generation | Call at block creation time; available in all modern browsers and Node 14.17+ |
| firebase/firestore `updateDoc` | peer dep | `saveDraft` already uses it | Called via existing helper — no direct import needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion Reorder | dnd-kit, react-beautiful-dnd | Framer Motion is already a peer dep — adding another DnD library is wasteful and a breaking-change risk |
| Tiptap starter-kit | ProseMirror raw, Quill, Slate | Decision locked; Tiptap is the most actively maintained ProseMirror wrapper |

**Installation (new devDependencies only):**
```bash
npm install --save-dev @tiptap/react @tiptap/starter-kit
```

Framer Motion is already declared as a peer dep. No changes to `package.json` peer deps needed.

**Version verification (npm registry, 2026-03-18):**
- `@tiptap/react`: 3.20.4 (latest)
- `@tiptap/starter-kit`: 3.20.4 (latest)
- `framer-motion`: 12.38.0 (latest)

---

## Architecture Patterns

### Recommended Project Structure
```
src/admin/
├── PageEditor.js           # Root exported component — owns blocks[] state + Firestore coordination
├── EditorHeader.js         # Back link + h1 page name + save status live region
├── BlockCanvas.js          # Framer Motion Reorder.Group wrapper + empty state
├── BlockCard.js            # Article wrapper + drag handle + delete button
├── AddBlockButton.js       # Floating + trigger between blocks
├── BlockTypePicker.js      # Dropdown listbox — 5 block types
├── UndoToast.js            # Fixed-position status toast after delete
├── UnsavedChangesWarning.js # alertdialog modal — reuses CreatePageModal focus trap pattern
├── editors/
│   ├── TitleEditor.js      # contenteditable div + heading level select
│   ├── TextEditor.js       # Tiptap editor with toolbar
│   ├── ImageEditor.js      # URL input + alt input + img preview
│   ├── VideoEditor.js      # URL input + iframe preview via toEmbedUrl()
│   └── GalleryEditor.js    # ol of URL+alt pairs + add/remove controls
└── index.js                # Add PageEditor to named exports
```

### Pattern 1: PageEditor owns all state, leaf editors are controlled

**What:** `PageEditor` holds the `blocks` array in `useState`. Each block editor receives `data` (the block's data object) and an `onChange(newData)` callback. The editor never writes to Firestore directly — it calls `onChange`, which updates the array, which schedules the debounced `saveDraft`.

**When to use:** Whenever multiple sub-components need to trigger a single coordinated side-effect (auto-save). Prevents race conditions where two editors independently fire `saveDraft` simultaneously.

```jsx
// Source: established project pattern (PageManager.js debounce)
function PageEditor({ slug }) {
  const { db } = useCMSFirebase()
  const [blocks, setBlocks] = useState([])
  const debounceRef = useRef(null)

  function handleBlockChange(id, newData) {
    const updated = blocks.map(b => b.id === id ? { ...b, data: newData } : b)
    setBlocks(updated)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveDraft(db, slug, updated).catch(handleSaveError)
    }, 1000)
  }

  // cleanup on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), [])
}
```

### Pattern 2: Framer Motion Reorder with custom drag handle

**What:** `Reorder.Group` wraps the block list as an `ol`. `Reorder.Item` wraps each `BlockCard`. The drag handle button uses `useDragControls` so only the handle initiates dragging (not the entire card, which would conflict with text inputs).

**When to use:** Any time a `Reorder.Item` contains interactive children (inputs, buttons) — without `dragListener={false}`, Framer Motion captures pointer events on those children.

```jsx
// Source: Framer Motion docs — useDragControls pattern
import { Reorder, useDragControls } from 'framer-motion'

function BlockCard({ block, onDelete, onChange }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={block} dragListener={false} dragControls={controls}>
      <article aria-label={`${displayName(block.type)} block`}>
        <button
          aria-label={`Drag to reorder ${displayName(block.type)} block`}
          aria-hidden="true"
          onPointerDown={e => controls.start(e)}
          style={{ cursor: 'grab', touchAction: 'none' }}
        >⠿</button>
        {/* editor form */}
      </article>
    </Reorder.Item>
  )
}
```

Note: `touchAction: 'none'` on the drag handle is required on iOS Safari — without it, touch scroll intercepts the drag gesture.

### Pattern 3: Deferred delete with undo window

**What:** On delete, the block is removed from local state immediately (canvas updates instantly). A `setTimeout` of 5000ms is set. If "Undo delete" is clicked before it fires, the block is re-spliced back at its original index and the timeout is cleared. If the timeout fires, `saveDraft` is called with the post-delete array.

**When to use:** Any delete action where immediate feedback + recovery is preferred over confirm dialogs.

```jsx
// Source: CONTEXT.md §Delete Block UX — project-defined pattern
const deleteTimerRef = useRef(null)
const [deletedBlock, setDeletedBlock] = useState(null) // { block, index }

function handleDelete(block) {
  const index = blocks.findIndex(b => b.id === block.id)
  setBlocks(prev => prev.filter(b => b.id !== block.id))
  setDeletedBlock({ block, index })
  clearTimeout(deleteTimerRef.current)
  deleteTimerRef.current = setTimeout(() => {
    saveDraft(db, slug, blocks.filter(b => b.id !== block.id))
    setDeletedBlock(null)
  }, 5000)
}

function handleUndo() {
  clearTimeout(deleteTimerRef.current)
  setBlocks(prev => {
    const next = [...prev]
    next.splice(deletedBlock.index, 0, deletedBlock.block)
    return next
  })
  setDeletedBlock(null)
}
```

Note: The `blocks` variable captured in the `setTimeout` callback will be stale if the user edits other blocks during the undo window. Use a `useRef` to hold the current blocks array, or pass the array explicitly at timeout-set time.

### Pattern 4: Tiptap integration

**What:** `useEditor` hook initializes the editor with `StarterKit`. The `onUpdate` callback calls `onChange({ html: editor.getHTML() })` which feeds into the parent debounce. `useEffect` with editor content sync is needed when the block data changes externally (e.g., on initial load).

```jsx
// Source: Tiptap docs — React integration
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function TextEditor({ data, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: data?.html ?? '',
    onUpdate({ editor }) {
      onChange({ html: editor.getHTML() })
    },
  })
  // Sync content when data.html changes externally (page load)
  useEffect(() => {
    if (editor && data?.html !== editor.getHTML()) {
      editor.commands.setContent(data?.html ?? '', false)
    }
  }, [data?.html]) // eslint-disable-line react-hooks/exhaustive-deps

  return <EditorContent editor={editor} />
}
```

Tab key behavior: Tiptap's StarterKit does not trap Tab by default. Verify this in testing — if Tab is trapped inside the editor, override with a custom keymap extension.

### Pattern 5: Insert-at-position for AddBlockButton

**What:** Each `AddBlockButton` knows its insertion index. When a block type is selected, the new block is spliced into the array at that index.

```jsx
// Source: project-defined pattern
function createBlock(type) {
  return { id: crypto.randomUUID(), type, data: defaultData(type) }
}

function handleAddBlock(type, insertAfterIndex) {
  const newBlock = createBlock(type)
  setBlocks(prev => {
    const next = [...prev]
    next.splice(insertAfterIndex + 1, 0, newBlock)
    return next
  })
  // schedule auto-save for the insertion
  scheduleSave()
  // focus first input in the new block via requestAnimationFrame
  requestAnimationFrame(() => {
    document.getElementById(`block-first-input-${newBlock.id}`)?.focus()
  })
}
```

### Anti-Patterns to Avoid

- **Each editor manages its own Firestore writes:** Causes race conditions where two rapid-fire writes from different blocks can arrive out of order, resulting in the earlier write overwriting the later one's data in `draft.blocks`.
- **Calling `saveDraft` inside the `onReorder` callback without debounce:** Drag-end fires once, but do not add a debounce here — fire `saveDraft` immediately on drop completion (user has committed the reorder).
- **Using `value={data.html}` on a textarea for Tiptap content:** Tiptap manages its own DOM. The editor div is not a controlled input. Use `editor.commands.setContent()` for external content sync.
- **Omitting `dragListener={false}` on Reorder.Item:** Without it, clicking inside a text input inside the card will start a drag gesture, making inputs unusable.
- **Capturing stale `blocks` state in `setTimeout` callback:** Use a `useRef` mirror of the blocks array or compute the post-delete array at delete-time and capture that explicitly in the closure.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contenteditable WYSIWYG | Tiptap + StarterKit | ProseMirror edge cases: cursor positioning, IME input, paste normalization, undo stack, selection across formatted runs — months of work |
| Drag-and-drop sort | Custom pointer event reorder | Framer Motion Reorder | Touch support, accessibility announcements, animation physics, scroll-while-dragging — all handled |
| HTML sanitization (Tiptap output) | Custom regex strip | Tiptap's StarterKit only emits safe HTML; DOMPurify on the consumer side (already in RichText.js) | Tiptap output is not untrusted HTML — it comes from the StarterKit extension's own serializer. Only the front-end renderer needs to sanitize (already does). |

**Key insight:** The editor is a thin layer over existing infrastructure. Every hard problem (DnD physics, rich text editing, Firestore writes) has an existing solution in this codebase or as a vetted dependency.

---

## Common Pitfalls

### Pitfall 1: Stale closure in deferred saveDraft
**What goes wrong:** `setTimeout(() => saveDraft(db, slug, blocks), 5000)` captures the `blocks` array from the render when the delete fired. If the user edits another block during the 5-second window, `blocks` is stale and the save will overwrite those edits with the old state.
**Why it happens:** JavaScript closures capture variables by reference to their binding, but `useState` values are re-bound each render — the `setTimeout` callback holds the old binding.
**How to avoid:** At delete time, compute `blocksAfterDelete = blocks.filter(...)` and pass that explicit value into the closure, OR mirror `blocks` in a `useRef` and read `blocksRef.current` inside the callback.
**Warning signs:** User edits a field, then sees it revert 5 seconds after a delete.

### Pitfall 2: Framer Motion Reorder item identity
**What goes wrong:** Using `index` as the `value` prop on `Reorder.Item` instead of the block object. Framer Motion uses `value` for identity tracking during animation — if you pass the index, it re-creates items on every reorder.
**Why it happens:** Developers assume `value` is just a key.
**How to avoid:** Always pass the full block object (or at minimum a stable unique ID wrapper) as the `value` prop on `Reorder.Item`. The `onReorder` callback on `Reorder.Group` receives the new ordered array of those values.
**Warning signs:** Drag animation flickers; blocks lose focus after drop.

### Pitfall 3: Tiptap content sync on initial load
**What goes wrong:** Tiptap editor renders with empty content because `useEditor` ran before `getPage` resolved.
**Why it happens:** `useEditor` is called synchronously during render; Firestore data arrives asynchronously. The `content` option in `useEditor` is only applied once on initialization.
**How to avoid:** Either (a) don't render the `TextEditor` until blocks are loaded (`loading` guard in `PageEditor`), or (b) use `editor.commands.setContent()` in a `useEffect` that runs when `data.html` changes. Option (a) is simpler.
**Warning signs:** Rich text editor appears blank even though Firestore has content.

### Pitfall 4: Image.js uses `data.src`, not `data.url`
**What goes wrong:** The CONTEXT.md canonical refs say "Image component reads `data.url`, `data.alt`, `data.caption`" but the actual `src/blocks/Image.js` source uses `data.src` and `data.alt`. If the ImageEditor writes `data.url`, the front-end Image block will render nothing.
**Why it happens:** Documentation drift between the block field schema description and the actual implementation.
**How to avoid:** ImageEditor must write `data.src` (not `data.url`) to match `Image.js`. Verify with `src/blocks/Image.js` before implementing.
**Warning signs:** Image block shows nothing on the front end after saving.

### Pitfall 5: Gallery.js uses `item.src`, not `item.url`
**What goes wrong:** The CONTEXT.md says Gallery reads `data.items` array of `{ url, alt }` but `src/blocks/Gallery.js` uses `item.src` and `item.alt`. If GalleryEditor writes `item.url`, the Gallery block will render broken images.
**Why it happens:** Same documentation drift as Pitfall 4.
**How to avoid:** GalleryEditor must write `{ src, alt }` per item (not `{ url, alt }`) to match `Gallery.js`. Verify with `src/blocks/Gallery.js` before implementing.
**Warning signs:** Gallery renders no images on the front end.

### Pitfall 6: Tiptap bundled in admin but also present in consumer project
**What goes wrong:** If a consumer has `@tiptap/react` installed at a different version, dual-bundle conflicts (two ProseMirror instances, two React instances) can cause the editor to behave incorrectly.
**Why it happens:** TSUP admin entry bundles Tiptap. Consumer's Next.js also has it in node_modules.
**How to avoid:** The decision is locked (bundle it). This is an accepted trade-off because Tiptap has no singleton issues (unlike React or Firebase). Document in release notes.

### Pitfall 7: Tiptap Tab key trapping
**What goes wrong:** Tiptap's `TabKeymap` extension (included in `StarterKit`) intercepts Tab keypresses to insert tab characters in some configurations. This traps keyboard focus inside the editor, violating WCAG 2.1.2 (No Keyboard Trap).
**Why it happens:** ProseMirror's keymap captures Tab by default.
**How to avoid:** Test Tab key behavior after integrating. If Tab does not move focus out of the editor, add a custom keymap extension that returns `false` for Tab to let it fall through to native browser behavior.
**Warning signs:** Keyboard user cannot Tab out of the rich text editor.

### Pitfall 8: tsup admin entry needs `@tiptap` packages marked external or bundled
**What goes wrong:** If `@tiptap/react` or `@tiptap/starter-kit` appear in `external` in tsup.config.js, the bundled admin entry will have broken imports at runtime (consumer won't have them).
**Why it happens:** The tsup admin entry currently marks `react`, `react-dom`, `next`, `firebase`, `framer-motion` as external — Tiptap is not in that list, which is correct. But if someone adds it, the admin bundle breaks.
**How to avoid:** Do NOT add `@tiptap` to the `external` array in tsup.config.js entry 2. Tiptap must be bundled.

---

## Code Examples

Verified patterns from official sources and this codebase:

### Framer Motion Reorder with drag handle
```jsx
// Source: Framer Motion docs (framer.com/motion/reorder) + useDragControls
import { Reorder, useDragControls } from 'framer-motion'

// In parent:
<Reorder.Group as="ol" axis="y" values={blocks} onReorder={setBlocks}
  aria-label="Page blocks">
  {blocks.map(block => (
    <DraggableBlockCard key={block.id} block={block} />
  ))}
</Reorder.Group>

// In BlockCard:
function DraggableBlockCard({ block }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={block} dragListener={false} dragControls={controls}
      as="li">
      <button
        onPointerDown={e => { e.preventDefault(); controls.start(e) }}
        style={{ touchAction: 'none', cursor: 'grab' }}
        aria-hidden="true"
      >⠿</button>
    </Reorder.Item>
  )
}
```

### Tiptap minimal setup
```jsx
// Source: Tiptap docs (tiptap.dev/docs/editor/getting-started/install/react)
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function TextEditor({ data, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: data?.html ?? '',
    onUpdate({ editor }) {
      onChange({ html: editor.getHTML() })
    },
  })
  return (
    <div aria-label="Text content">
      <EditorContent editor={editor} />
    </div>
  )
}
```

### Auto-save debounce (per-block, project pattern)
```jsx
// Source: established pattern from src/admin/PageManager.js
const debounceRef = useRef(null)
function scheduleSave(updatedBlocks) {
  clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(async () => {
    setSaveStatus('saving')
    try {
      await saveDraft(db, slug, updatedBlocks)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, 1000)
}
// Cleanup on unmount:
useEffect(() => () => clearTimeout(debounceRef.current), [])
```

### Block type default data factory
```js
// Source: project-defined — must match actual block component field names
const DEFAULT_DATA = {
  title:    { level: 'h2', text: '' },
  richtext: { html: '' },
  image:    { src: '', alt: '' },        // NOTE: src not url — matches Image.js
  video:    { url: '' },
  gallery:  { items: [] },
}

function createBlock(type) {
  return {
    id: crypto.randomUUID(),
    type,
    data: { ...DEFAULT_DATA[type] },
  }
}
```

### Focus management after block add (project pattern)
```js
// Source: established pattern from src/admin/CreatePageModal.js + PageManager.js
requestAnimationFrame(() => {
  // Find the first focusable input inside the new block card by ID convention
  document.getElementById(`block-input-${newBlock.id}`)?.focus()
})
```

### contenteditable TitleEditor
```jsx
// Source: project-defined pattern per CONTEXT.md + UI-SPEC
function TitleEditor({ data, onChange }) {
  const FONT_SIZES = { h2: '28px', h3: '24px', h4: '20px', h5: '16px', h6: '14px' }
  return (
    <div>
      <select
        value={data.level ?? 'h2'}
        aria-label="Heading level"
        onChange={e => onChange({ ...data, level: e.target.value })}
        style={{ minHeight: '44px' }}
      >
        {['h2','h3','h4','h5','h6'].map(l =>
          <option key={l} value={l}>{l.toUpperCase()}</option>
        )}
      </select>
      <div
        role="textbox"
        contentEditable
        aria-label="Title text"
        aria-multiline="false"
        suppressContentEditableWarning
        onInput={e => onChange({ ...data, text: e.currentTarget.textContent })}
        style={{ fontSize: FONT_SIZES[data.level ?? 'h2'], fontWeight: 600 }}
      />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion v10 `motion.div` drag | `Reorder.Group`/`Reorder.Item` for sortable lists | Framer Motion v6+ | Dedicated reorder API; no need to track drag position manually |
| Tiptap v1 (ProseMirror raw) | Tiptap v2/v3 with extension system | 2022 / 2024 | Extensions are the primary API; direct ProseMirror schema access is rarely needed |
| `useEditor` content sync via `editor.chain()` | `editor.commands.setContent()` | Tiptap v2 | Simpler one-liner for full content replacement |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Archived / unmaintained as of 2023. Not relevant — Framer Motion is already chosen.
- Tiptap Pro extensions: Not used; decision locked to open-source StarterKit only.

---

## Open Questions

1. **Image field name: `src` vs `url`**
   - What we know: `Image.js` uses `data.src`; CONTEXT.md says "reads `data.url`"
   - What's unclear: Was `data.url` the intended field and `Image.js` has a bug, or is the CONTEXT.md wrong?
   - Recommendation: The source code (`Image.js`) is the ground truth. ImageEditor should write `data.src`. If `data.url` was intended, `Image.js` needs updating — but that is a front-end change, not a Phase 6 concern. Document the decision in STATE.md.

2. **Gallery field name: `src` vs `url` per item**
   - What we know: `Gallery.js` uses `item.src`; CONTEXT.md says items are `{ url, alt }`
   - What's unclear: Same drift as Image above
   - Recommendation: GalleryEditor writes `{ src, alt }` to match `Gallery.js`.

3. **Tiptap Tab key escape**
   - What we know: StarterKit includes a default keymap that may intercept Tab
   - What's unclear: Whether the current StarterKit 3.x traps Tab by default
   - Recommendation: Test during implementation. If Tab is trapped, add a one-line custom extension.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | none — invoked via package.json `test` script |
| Quick run command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/PageEditor*.test.js'` |
| Full suite command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/**/*.test.js'` |

### Phase Requirements → Test Map

All existing tests in this project use the source-inspection pattern: `readFileSync` on the component source, then `assert.ok(src.includes(...))`. This avoids complex React/Firebase mock chains and verifies the accessibility and structural contract directly.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | PageEditor loads draft.blocks from Firestore via getPage | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |
| EDIT-01 | BlockCanvas uses Reorder.Group with aria-label="Page blocks" | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |
| EDIT-01 | BlockCard uses article element with aria-label | source-inspection | `--test 'src/admin/BlockCanvas.test.js'` | ❌ Wave 0 |
| EDIT-02 | AddBlockButton has aria-expanded and aria-haspopup | source-inspection | `--test 'src/admin/AddBlockButton.test.js'` | ❌ Wave 0 |
| EDIT-02 | BlockTypePicker lists 5 block types with correct display names | source-inspection | `--test 'src/admin/BlockTypePicker.test.js'` | ❌ Wave 0 |
| EDIT-02 | New block inserted at correct position; id set via crypto.randomUUID | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |
| EDIT-03 | Reorder.Item uses dragListener={false} and dragControls | source-inspection | `--test 'src/admin/BlockCanvas.test.js'` | ❌ Wave 0 |
| EDIT-04 | Delete removes block from canvas state | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |
| EDIT-04 | Undo toast rendered with role="status" and aria-live | source-inspection | `--test 'src/admin/UndoToast.test.js'` | ❌ Wave 0 |
| EDIT-04 | saveDraft not called until after 5s timer; clearTimeout on undo | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |
| EDIT-05 | saveDraft called with debounce via useRef + clearTimeout pattern | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |
| EDIT-05 | Save status live region has role="status" aria-live | source-inspection | `--test 'src/admin/EditorHeader.test.js'` | ❌ Wave 0 |
| EDIT-06 | TitleEditor: contenteditable div with role="textbox" | source-inspection | `--test 'src/admin/editors/TitleEditor.test.js'` | ❌ Wave 0 |
| EDIT-06 | TitleEditor: heading level select with aria-label | source-inspection | `--test 'src/admin/editors/TitleEditor.test.js'` | ❌ Wave 0 |
| EDIT-06 | TextEditor: writes data.html; uses @tiptap/react | source-inspection | `--test 'src/admin/editors/TextEditor.test.js'` | ❌ Wave 0 |
| EDIT-06 | ImageEditor: writes data.src (not data.url) | source-inspection | `--test 'src/admin/editors/ImageEditor.test.js'` | ❌ Wave 0 |
| EDIT-06 | VideoEditor: calls toEmbedUrl; shows iframe preview | source-inspection | `--test 'src/admin/editors/VideoEditor.test.js'` | ❌ Wave 0 |
| EDIT-06 | GalleryEditor: writes item.src (not item.url); add/remove items | source-inspection | `--test 'src/admin/editors/GalleryEditor.test.js'` | ❌ Wave 0 |
| — | PageManager: page name is a link to /admin/pages/[slug] | source-inspection | `--test 'src/admin/PageManager.test.js'` | ✅ (extend existing) |
| — | PageManager: Edit button present in Actions column | source-inspection | `--test 'src/admin/PageManager.test.js'` | ✅ (extend existing) |
| — | PageEditor exported from src/admin/index.js | source-inspection | `--test 'src/admin/PageEditor.test.js'` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/PageEditor*.test.js' 'src/admin/editors/*.test.js'`
- **Per wave merge:** Full suite `src/**/*.test.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/admin/PageEditor.test.js` — covers EDIT-01, EDIT-02, EDIT-04, EDIT-05, export check
- [ ] `src/admin/BlockCanvas.test.js` — covers EDIT-01 (canvas), EDIT-03 (drag)
- [ ] `src/admin/AddBlockButton.test.js` — covers EDIT-02 (add trigger ARIA)
- [ ] `src/admin/BlockTypePicker.test.js` — covers EDIT-02 (picker content)
- [ ] `src/admin/EditorHeader.test.js` — covers EDIT-05 (save status live region)
- [ ] `src/admin/UndoToast.test.js` — covers EDIT-04 (undo toast ARIA)
- [ ] `src/admin/editors/TitleEditor.test.js` — covers EDIT-06 (title)
- [ ] `src/admin/editors/TextEditor.test.js` — covers EDIT-06 (richtext)
- [ ] `src/admin/editors/ImageEditor.test.js` — covers EDIT-06 (image, src field)
- [ ] `src/admin/editors/VideoEditor.test.js` — covers EDIT-06 (video)
- [ ] `src/admin/editors/GalleryEditor.test.js` — covers EDIT-06 (gallery, src field)
- [ ] `src/admin/editors/` directory — does not yet exist

---

## Sources

### Primary (HIGH confidence)
- `src/blocks/Image.js` — confirmed field names: `data.src`, `data.alt`, `data.caption`
- `src/blocks/Gallery.js` — confirmed field names: `item.src`, `item.alt`
- `src/blocks/Video.js` — confirmed `toEmbedUrl()` export, `data.url` / `data.src` fallback
- `src/blocks/Title.js` — confirmed `data.level` (h2–h6), `data.text`
- `src/blocks/RichText.js` — confirmed `data.html` field
- `src/firebase/firestore.js` — confirmed `saveDraft(db, slug, blocks)` and `getPage(db, slug)` signatures
- `src/admin/CreatePageModal.js` — focus trap pattern, debounce pattern
- `src/admin/PageManager.js` — live region pattern, `useRef`+`clearTimeout` debounce
- `tsup.config.js` — confirmed admin entry externals (Tiptap NOT in external list)
- `package.json` — confirmed framer-motion as peer dep; no Tiptap yet
- npm registry (2026-03-18) — @tiptap/react 3.20.4, @tiptap/starter-kit 3.20.4, framer-motion 12.38.0

### Secondary (MEDIUM confidence)
- Framer Motion `useDragControls` pattern — standard documented API for handle-based drag; `touchAction: 'none'` requirement confirmed by multiple sources
- Tiptap `onUpdate` + `setContent` pattern — standard React integration as documented on tiptap.dev

### Tertiary (LOW confidence)
- Tiptap 3.x StarterKit Tab key behavior — not independently verified against v3 changelog; recommend testing during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from npm registry; all libraries already in use or locked by decision
- Architecture: HIGH — patterns derived from existing codebase code, not speculation
- Pitfalls: HIGH (field name mismatches) / MEDIUM (Tiptap tab key) — source code verified; Tab behavior needs runtime test
- Test map: HIGH — follows established source-inspection pattern used by all prior phases

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; Tiptap minor releases are API-compatible within v3)
