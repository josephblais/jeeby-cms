"use client"

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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

// Accessible toolbar button — uses aria-pressed to communicate toggle state.
// ACCESSIBILITY: WCAG 4.1.2 (Name, Role, Value), minimum 44px touch target.
const ToolbarButton = ({ label, isActive, onClick }) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={isActive}
    onClick={onClick}
    className="jeeby-cms-toolbar-btn"
  >{label}</button>
)

// TextEditor — Tiptap WYSIWYG editor outputting data.html.
// Props: { data: { html }, onChange, blockId }
// ACCESSIBILITY: WCAG 1.3.1 (toolbar role), 2.1.1 (keyboard nav), 4.1.2 (aria-label on wrapper)
export function TextEditor({ data, onChange, blockId }) {
  const editor = useEditor({
    extensions: [StarterKit, TabEscape],
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

  return (
    <div>
      {editor && (
        <div
          role="toolbar"
          aria-label="Text formatting"
          style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
        >
          <ToolbarButton
            label="Bold"
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="Italic"
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="Bullet list"
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="Ordered list"
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
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
