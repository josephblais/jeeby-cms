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
      style={{ listStyle: 'none' }}
      whileDrag={{ scale: 1.01 }}
    >
      <article
        className="jeeby-cms-block-card"
        aria-label={displayName(block.type) + ' block'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false) }}
      >
        {/* Drag handle + Delete row — visible on hover/focus, dimmed otherwise */}
        <div className="jeeby-cms-block-card-controls" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: hovered ? 1 : 0.3, transition: 'opacity 150ms',
        }}>
          {/*
            Drag handle is hidden from assistive technology (aria-hidden="true") because
            keyboard reorder is not implemented in Phase 6. Keyboard alternative: delete + re-add block.
          */}
          <button
            className="jeeby-cms-drag-handle"
            aria-label={'Drag to reorder ' + displayName(block.type) + ' block'}
            aria-hidden="true"
            onPointerDown={(e) => { e.preventDefault(); controls.start(e) }}
          >⠿</button>
          <button
            type="button"
            className="jeeby-cms-btn-ghost"
            aria-label={'Delete ' + displayName(block.type) + ' block'}
            onClick={() => onDelete(block)}
            style={{ minWidth: '44px', padding: 0 }}
          >Delete</button>
        </div>

        {/* Editor form */}
        <div>
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
      <div className="jeeby-cms-block-canvas">
        <div className="jeeby-cms-canvas-empty">
          <p className="jeeby-cms-canvas-empty-headline">This page has no content yet</p>
          <p className="jeeby-cms-canvas-empty-body">
            Start by adding content — try a <strong>Title</strong> for the page heading, or <strong>Text</strong> for a paragraph.
          </p>
          <AddBlockButton onAdd={(type) => onAddBlock(type, -1)} insertIndex={-1} />
        </div>
      </div>
    )
  }

  return (
    <div className="jeeby-cms-block-canvas">
      <AddBlockButton onAdd={(type) => onAddBlock(type, -1)} insertIndex={-1} />
      <Reorder.Group
        as="ol"
        axis="y"
        values={blocks}
        onReorder={onReorder}
        aria-label="Page blocks"
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
