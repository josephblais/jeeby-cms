"use client"

import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Extension } from '@tiptap/core'

// TabEscape — prevents Tiptap from trapping Tab/Shift-Tab within the editor.
// ACCESSIBILITY: WCAG 2.1.1 (Keyboard) — users must be able to Tab out of any component.
// Returns false so Tiptap hands Tab off to the browser's default focus management.
const TabEscape = Extension.create({
  name: 'tabEscape',
  addKeyboardShortcuts() {
    return {
      Tab: () => false,
      'Shift-Tab': () => false,
    }
  },
})

// Icon components — inline SVG for link, bullet, ordered list.
// Bold and Italic use styled text (typographic convention, matches heading H2 icons).

function IconBold() {
  return <span className="jeeby-cms-toolbar-icon jeeby-cms-toolbar-icon--bold" aria-hidden="true">B</span>
}

function IconItalic() {
  return <span className="jeeby-cms-toolbar-icon jeeby-cms-toolbar-icon--italic" aria-hidden="true">I</span>
}

function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 9.5a3.5 3.5 0 0 0 4.95 0l2-2a3.5 3.5 0 0 0-4.95-4.95l-1 1" />
      <path d="M9.5 6.5a3.5 3.5 0 0 0-4.95 0l-2 2a3.5 3.5 0 0 0 4.95 4.95l1-1" />
    </svg>
  )
}

function IconBulletList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="3.5" r="1.2" />
      <rect x="5" y="2.5" width="9" height="2" rx="0.7" />
      <circle cx="2.5" cy="8" r="1.2" />
      <rect x="5" y="7" width="9" height="2" rx="0.7" />
      <circle cx="2.5" cy="12.5" r="1.2" />
      <rect x="5" y="11.5" width="9" height="2" rx="0.7" />
    </svg>
  )
}

function IconOrderedList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      {/* "1" — single vertical bar */}
      <rect x="2.5" y="1.5" width="1.5" height="4" rx="0.5" />
      <rect x="5" y="2.5" width="9" height="2" rx="0.7" />
      {/* "2" — two stacked bars */}
      <rect x="1.5" y="6.5" width="3.5" height="1.4" rx="0.4" />
      <rect x="1.5" y="8.5" width="3.5" height="1.4" rx="0.4" />
      <rect x="5" y="7" width="9" height="2" rx="0.7" />
      {/* "3" — three stacked bars */}
      <rect x="1.5" y="11.2" width="3.5" height="1.2" rx="0.4" />
      <rect x="1.5" y="12.6" width="3.5" height="1.2" rx="0.4" />
      <rect x="1.5" y="14" width="3.5" height="1.2" rx="0.4" />
      <rect x="5" y="11.5" width="9" height="2" rx="0.7" />
    </svg>
  )
}

// Accessible toolbar button — icon-only with aria-label + title tooltip.
// ACCESSIBILITY: WCAG 4.1.2 (Name, Role, Value), minimum 44px touch target.
const ToolbarButton = ({ label, isActive, onClick, icon }) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={isActive}
    title={label}
    onClick={onClick}
    className="jeeby-cms-toolbar-btn"
  >
    {icon}
  </button>
)

const ToolbarSeparator = () => (
  <div className="jeeby-cms-toolbar-separator" role="separator" aria-orientation="vertical" />
)

// TextEditor — Tiptap WYSIWYG editor outputting data.html.
// Props: { data: { html }, onChange, blockId }
// ACCESSIBILITY: WCAG 1.3.1 (toolbar role), 2.1.1 (keyboard nav), 4.1.2 (aria-label on wrapper)
export function TextEditor({ data, onChange, blockId }) {
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const linkInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TabEscape,
      Link.configure({ openOnClick: false }),
    ],
    content: data?.html ?? '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange({ html: editor.getHTML() })
    },
  })

  // Sync external data.html changes into the editor (e.g. loading saved content).
  // Only updates when data.html differs from editor's current HTML to avoid cursor reset.
  useEffect(() => {
    if (editor && data?.html !== undefined && data.html !== editor.getHTML()) {
      editor.commands.setContent(data.html, false)
    }
  }, [data?.html]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the link input when it opens
  useEffect(() => {
    if (linkInputOpen) linkInputRef.current?.focus()
  }, [linkInputOpen])

  function handleLinkClick() {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const href = editor.getAttributes('link').href ?? ''
    setLinkUrl(href)
    setLinkInputOpen(true)
  }

  function commitLink() {
    const trimmed = linkUrl.trim()
    if (trimmed) {
      editor.chain().focus().setLink({ href: trimmed }).run()
    }
    setLinkInputOpen(false)
    setLinkUrl('')
  }

  function cancelLink() {
    setLinkInputOpen(false)
    setLinkUrl('')
    editor.commands.focus()
  }

  return (
    <div>
      {editor && (
        <div
          role="toolbar"
          aria-label="Text formatting"
          className="jeeby-cms-toolbar"
        >
          <ToolbarButton
            label="Bold"
            icon={<IconBold />}
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="Italic"
            icon={<IconItalic />}
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label={editor.isActive('link') ? 'Remove link' : 'Add link'}
            icon={<IconLink />}
            isActive={editor.isActive('link') || linkInputOpen}
            onClick={handleLinkClick}
          />
          <ToolbarSeparator />
          <ToolbarButton
            label="Bullet list"
            icon={<IconBulletList />}
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="Ordered list"
            icon={<IconOrderedList />}
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </div>
      )}

      {linkInputOpen && (
        <div className="jeeby-cms-link-input-row">
          <input
            ref={linkInputRef}
            type="url"
            className="jeeby-cms-link-input"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://"
            aria-label="Link URL"
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitLink() }
              if (e.key === 'Escape') { e.preventDefault(); cancelLink() }
            }}
          />
          <button
            type="button"
            className="jeeby-cms-btn-primary jeeby-cms-link-apply-btn"
            onClick={commitLink}
          >
            Apply
          </button>
          <button
            type="button"
            className="jeeby-cms-btn-ghost"
            onClick={cancelLink}
          >
            Cancel
          </button>
        </div>
      )}

      <div
        id={'block-input-' + blockId}
        aria-label="Text content"
        className="jeeby-cms-text-editor-content"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TextEditor
