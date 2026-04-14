// src/blocks/index.js
// Block system assembly: registry + Block wrapper + Blocks renderer.
//
// BLOCK_REGISTRY maps block type strings to React components.
// Type string convention (Phase 6 must use these exact strings):
//   'title', 'paragraph', 'richtext', 'image', 'video', 'gallery'
//
// The `components` prop on <Blocks> merges custom types with the built-in registry.
// This is the v1 extensibility hook for CBLK-01 (custom block registration) in v2 —
// designed so custom blocks don't require a breaking API change.

import { createElement } from 'react'
import { Title } from './Title.js'
import { Paragraph } from './Paragraph.js'
import { RichText } from './RichText.js'
import { Image } from './Image.js'
import { Video } from './Video.js'
import { Gallery } from './Gallery.js'
import { List } from './List.js'
import { PullQuote } from './PullQuote.js'

export const BLOCK_REGISTRY = {
  title: Title,
  paragraph: Paragraph,
  richtext: RichText,
  image: Image,
  video: Video,
  gallery: Gallery,
  list: List,
  pullquote: PullQuote,
}

// Block wrapper — applied to every block by <Blocks>.
// Phase 3 delivers structure: jeeby-cms-block class for styling hook + id for anchor links.
// CSS custom property values (--jeeby-cms-max-width, --jeeby-cms-block-spacing) are
// intentionally deferred to Phase 8 (CSS & Theming) which targets .jeeby-cms-block.
export function Block({ id, className, children }) {
  return createElement(
    'div',
    {
      id,
      className: ['jeeby-cms-block', className].filter(Boolean).join(' '),
    },
    children
  )
}

// Blocks renderer — maps an array of block objects to their components.
// data: the full page document { blocks: [...], ... } returned by getCMSContent or useCMSContent.
// components: optional object { customType: CustomComponent } merged with BLOCK_REGISTRY.
// className: applied to the outer container div (for layout/spacing control).
// blockClassName: applied to each individual Block wrapper div alongside jeeby-cms-block.
export function Blocks({ data, components, className, blockClassName, locale = 'en' }) {
  if (!data?.blocks?.length) return null

  const registry = components ? { ...BLOCK_REGISTRY, ...components } : BLOCK_REGISTRY

  return createElement(
    'div',
    { className },
    ...data.blocks.map((block, i) => {
      const Component = registry[block.type]
      // Silently skip unknown block types — do not throw, do not render anything.
      // This handles: future block types not yet in the registry, typos in type strings.
      if (!Component) return null
      return createElement(
        Block,
        { key: block.id ?? i, id: block.id, className: blockClassName },
        createElement(Component, { data: block.data, locale })
      )
    })
  )
}
