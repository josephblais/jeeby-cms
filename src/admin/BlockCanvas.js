"use client"
import { useState, memo } from 'react'
import { useDragControls, Reorder } from 'framer-motion'
import { TitleEditor } from './editors/TitleEditor.js'
import { TextEditor } from './editors/TextEditor.js'
import { ImageEditor } from './editors/ImageEditor.js'
import { VideoEditor } from './editors/VideoEditor.js'
import { GalleryEditor } from './editors/GalleryEditor.js'
import { ListEditor } from './editors/ListEditor.js'
import { PullQuoteEditor } from './editors/PullQuoteEditor.js'
import { AddBlockButton } from './AddBlockButton.js'
import { BlockGutter } from './BlockGutter.js'

// Display name helper
const DISPLAY_NAMES = { title: 'Title', richtext: 'Text', image: 'Image', video: 'Video', gallery: 'Gallery', list: 'List', pullquote: 'Pull Quote' }
function displayName(type) { return DISPLAY_NAMES[type] || type }

// EDITOR_MAP maps block types to editor components.
const EDITOR_MAP = {
  title: TitleEditor,
  richtext: TextEditor,
  image: ImageEditor,
  video: VideoEditor,
  gallery: GalleryEditor,
  list: ListEditor,
  pullquote: PullQuoteEditor,
}


// BlockCard: memoised so unchanged blocks don't re-render when saveStatus changes.
// Requires stable onChange/onDelete/onAddBlock references (useCallback in PageEditor).
const BlockCard = memo(function BlockCard({ block, index, onChange, onDelete, onAddBlock }) {
  const controls = useDragControls()
  const Editor = EDITOR_MAP[block.type] || EDITOR_MAP.richtext

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
        <BlockGutter block={block} onDelete={onDelete} dragControls={controls} />

        {/* Block content — editor lives here */}
        <article
          className="jeeby-cms-block-content"
          aria-label={displayName(block.type) + ' block'}
        >
          <Editor data={block.data} onChange={(newData) => onChange(block.id, newData)} blockId={block.id} />
        </article>
      </div>
      <AddBlockButton onAdd={(type, initialData) => onAddBlock(type, index, initialData)} insertIndex={index} />
    </Reorder.Item>
  )
})

// Block preview sketches for the empty state — static SVG, never changes.
const EmptyStatePreviews = memo(function EmptyStatePreviews() {
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
})

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
    </div>
  )
}
