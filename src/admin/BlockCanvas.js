"use client"
import { useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { TitleEditor } from './editors/TitleEditor.js'
import { TextEditor } from './editors/TextEditor.js'
import { ImageEditor } from './editors/ImageEditor.js'
import { VideoEditor } from './editors/VideoEditor.js'
import { GalleryEditor } from './editors/GalleryEditor.js'
import { AddBlockButton } from './AddBlockButton.js'

// Display name helper
const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery' }
function displayName(type) { return DISPLAY_NAMES[type] || type }

// EDITOR_MAP maps block types to editor components.
const EDITOR_MAP = {
  title: TitleEditor,
  richtext: TextEditor,
  image: ImageEditor,
  video: VideoEditor,
  gallery: GalleryEditor,
}

// BlockCard: internal component — not exported
function BlockCard({ block, index, onChange, onDelete, onAddBlock }) {
  const controls = useDragControls()
  const [hovered, setHovered] = useState(false)

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      as="li"
      style={{ marginBottom: '0', listStyle: 'none' }}
      whileDrag={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    >
      <article
        aria-label={displayName(block.type) + ' block'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false) }}
        style={{
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
          padding: '16px', position: 'relative'
        }}
      >
        {/* Drag handle + Delete row — visible on hover/focus, hidden otherwise */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '8px', opacity: hovered ? 1 : 0, transition: 'opacity 150ms',
          position: 'absolute', top: '8px', right: '8px', left: '8px'
        }}>
          {/*
            Drag handle is hidden from assistive technology (aria-hidden="true") because
            keyboard reorder is not implemented in Phase 6. Keyboard alternative: delete + re-add block.
          */}
          <button
            aria-label={'Drag to reorder ' + displayName(block.type) + ' block'}
            aria-hidden="true"
            onPointerDown={(e) => { e.preventDefault(); controls.start(e) }}
            style={{
              cursor: 'grab', touchAction: 'none', background: 'none', border: 'none',
              fontSize: '16px', color: '#9CA3AF', minHeight: '44px', minWidth: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
            }}
          >⠿</button>
          <button
            type="button"
            aria-label={'Delete ' + displayName(block.type) + ' block'}
            onClick={() => onDelete(block)}
            style={{
              color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', minHeight: '44px', minWidth: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
            }}
          >×</button>
        </div>

        {/* Editor form */}
        <div style={{ paddingTop: '8px' }}>
          {(() => {
            const Editor = EDITOR_MAP[block.type] || EDITOR_MAP.richtext
            return <Editor data={block.data} onChange={(newData) => onChange(block.id, newData)} blockId={block.id} />
          })()}
        </div>
      </article>
      <AddBlockButton onAdd={(type) => onAddBlock(type, index)} insertIndex={index} />
    </Reorder.Item>
  )
}

export function BlockCanvas({ blocks, onReorder, onChange, onDelete, onAddBlock }) {
  if (blocks.length === 0) {
    return (
      <div className="jeeby-cms-block-canvas" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: '20px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>No blocks yet</p>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px' }}>Click + to add your first block.</p>
          <AddBlockButton onAdd={(type) => onAddBlock(type, -1)} insertIndex={-1} />
        </div>
      </div>
    )
  }

  return (
    <div className="jeeby-cms-block-canvas" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <AddBlockButton onAdd={(type) => onAddBlock(type, -1)} insertIndex={-1} />
      <Reorder.Group
        as="ol"
        axis="y"
        values={blocks}
        onReorder={onReorder}
        aria-label="Page blocks"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {blocks.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            index={index}
            onChange={onChange}
            onDelete={onDelete}
            onAddBlock={onAddBlock}
          />
        ))}
      </Reorder.Group>
    </div>
  )
}
