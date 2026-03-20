"use client"
import { useEffect, useRef, useState } from 'react'
import { useDragControls, Reorder } from 'framer-motion'
import { TitleEditor } from './editors/TitleEditor.js'
import { TextEditor } from './editors/TextEditor.js'
import { ImageEditor } from './editors/ImageEditor.js'
import { VideoEditor } from './editors/VideoEditor.js'
import { GalleryEditor } from './editors/GalleryEditor.js'
import { ListEditor } from './editors/ListEditor.js'
import { AddBlockButton } from './AddBlockButton.js'

// Display name helper
const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery', list: 'List' }
function displayName(type) { return DISPLAY_NAMES[type] || type }

// EDITOR_MAP maps block types to editor components.
const EDITOR_MAP = {
  title: TitleEditor,
  richtext: TextEditor,
  image: ImageEditor,
  video: VideoEditor,
  gallery: GalleryEditor,
  list: ListEditor,
}

// CanvasWidthHint: reads the actual --jeeby-cms-max-width CSS var at runtime
// so the hint reflects whatever the consumer has configured, not a hardcoded guess.
// aria-hidden — developer metadata, not meaningful content for editors.
function CanvasWidthHint() {
  const ref = useRef(null)
  const [width, setWidth] = useState('720px')

  useEffect(() => {
    if (ref.current) {
      const val = getComputedStyle(ref.current).getPropertyValue('--jeeby-cms-max-width').trim()
      if (val) setWidth(val)
    }
  }, [])

  return (
    <p ref={ref} className="jeeby-cms-canvas-width-hint" aria-hidden="true">
      Canvas width: {width} — set <code>--jeeby-cms-max-width</code> to match your content column
    </p>
  )
}

// BlockCard: internal component — not exported
function BlockCard({ block, index, onChange, onDelete, onAddBlock }) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      as="li"
      style={{ listStyle: 'none' }}
      whileDrag={{ scale: 1.01, opacity: 0.9 }}
    >
      <div className="jeeby-cms-block-row">
        {/*
          Left gutter — drag handle + delete button.
          aria-hidden on drag handle (WCAG 2.1.1 note: keyboard reorder not yet implemented;
          keyboard alternative is delete + re-add). Delete button remains accessible.
        */}
        <div className="jeeby-cms-block-gutter">
          <button
            className="jeeby-cms-drag-handle"
            aria-label={'Drag to reorder ' + displayName(block.type) + ' block'}
            aria-hidden="true"
            onPointerDown={(e) => { e.preventDefault(); controls.start(e) }}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
              <circle cx="2" cy="2"  r="1.25" fill="currentColor" />
              <circle cx="8" cy="2"  r="1.25" fill="currentColor" />
              <circle cx="2" cy="7"  r="1.25" fill="currentColor" />
              <circle cx="8" cy="7"  r="1.25" fill="currentColor" />
              <circle cx="2" cy="12" r="1.25" fill="currentColor" />
              <circle cx="8" cy="12" r="1.25" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="jeeby-cms-btn-ghost jeeby-cms-block-delete-btn"
            aria-label={'Delete ' + displayName(block.type) + ' block'}
            onClick={() => onDelete(block)}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Block content — editor lives here */}
        <article
          className="jeeby-cms-block-content"
          aria-label={displayName(block.type) + ' block'}
        >
          {(() => {
            const Editor = EDITOR_MAP[block.type] || EDITOR_MAP.richtext
            return <Editor data={block.data} onChange={(newData) => onChange(block.id, newData)} blockId={block.id} />
          })()}
        </article>
      </div>
      <AddBlockButton onAdd={(type, initialData) => onAddBlock(type, index, initialData)} insertIndex={index} />
    </Reorder.Item>
  )
}

// Block preview sketches for the empty state — purely illustrative, aria-hidden.
// Each gives a visual sense of what that block type produces on the page.
function EmptyStatePreviews() {
  return (
    <div className="jeeby-cms-canvas-empty-previews" aria-hidden="true">
      {/* Heading: thick heading bar + lighter body text lines */}
      <div className="jeeby-cms-canvas-empty-preview">
        <div className="jeeby-cms-canvas-empty-preview-card">
          <svg viewBox="0 0 80 44" width="80" height="44" fill="currentColor">
            <rect x="0" y="0"  width="58" height="9"  rx="2"   opacity="0.65" />
            <rect x="0" y="17" width="80" height="4"  rx="1.5" opacity="0.28" />
            <rect x="0" y="25" width="72" height="4"  rx="1.5" opacity="0.22" />
            <rect x="0" y="33" width="52" height="4"  rx="1.5" opacity="0.17" />
          </svg>
        </div>
        <span className="jeeby-cms-canvas-empty-preview-label">Heading</span>
      </div>
      {/* Text: paragraph lines of varying widths */}
      <div className="jeeby-cms-canvas-empty-preview">
        <div className="jeeby-cms-canvas-empty-preview-card">
          <svg viewBox="0 0 80 44" width="80" height="44" fill="currentColor">
            <rect x="0" y="2"  width="80" height="4" rx="1.5" opacity="0.45" />
            <rect x="0" y="12" width="76" height="4" rx="1.5" opacity="0.4"  />
            <rect x="0" y="22" width="80" height="4" rx="1.5" opacity="0.4"  />
            <rect x="0" y="32" width="80" height="4" rx="1.5" opacity="0.35" />
          </svg>
        </div>
        <span className="jeeby-cms-canvas-empty-preview-label">Text</span>
      </div>
      {/* Image: framed rectangle with sun + mountain silhouette */}
      <div className="jeeby-cms-canvas-empty-preview">
        <div className="jeeby-cms-canvas-empty-preview-card">
          <svg viewBox="0 0 80 44" width="80" height="44" fill="currentColor">
            <rect x="0" y="0" width="80" height="44" rx="3" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle cx="16" cy="14" r="6" opacity="0.22" />
            <polygon points="0,44 20,24 34,34 52,20 66,30 80,23 80,44" opacity="0.18" />
          </svg>
        </div>
        <span className="jeeby-cms-canvas-empty-preview-label">Image</span>
      </div>
    </div>
  )
}

export function BlockCanvas({ blocks, onReorder, onChange, onDelete, onAddBlock }) {
  if (blocks.length === 0) {
    return (
      <div className="jeeby-cms-block-canvas">
        <div className="jeeby-cms-canvas-empty">
          <EmptyStatePreviews />
          <p className="jeeby-cms-canvas-empty-headline">This page has no content yet</p>
          <p className="jeeby-cms-canvas-empty-body">
            Add blocks to build your page — headings, paragraphs, images, and more.
          </p>
          <button
            type="button"
            className="jeeby-cms-btn-primary"
            onClick={() => onAddBlock('richtext', -1, undefined)}
          >
            Add your first block
          </button>
        </div>
        <CanvasWidthHint />
      </div>
    )
  }

  return (
    <div className="jeeby-cms-block-canvas">
      <AddBlockButton onAdd={(type, initialData) => onAddBlock(type, -1, initialData)} insertIndex={-1} />
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
      <CanvasWidthHint />
    </div>
  )
}
