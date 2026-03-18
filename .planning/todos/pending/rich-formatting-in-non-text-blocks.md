---
created: 2026-03-18T00:00:00Z
source: brainstorm session (paragraph-vs-richtext decision)
priority: low
area: blocks
---

# Stretch goal: rich formatting options within non-text blocks

Currently Title (and other non-RichText blocks) render plain text only.

## Idea
Offer inline formatting (bold, italic, links) within block types that aren't RichText — e.g. a Title block that supports `<strong>` or `<em>` within the heading text.

## Context
Came out of the decision to drop ParagraphBlock in favour of RichTextBlock (2026-03-18). Keeping formatting capability consolidated in one block type for v1, but this extension is a natural next step.

## Decision needed
- Which blocks would benefit? Title is the obvious candidate. Others?
- Would this share the WYSIWYG component from RichText, or be a lighter inline-only toolbar?
- Phase to slot this into: likely after Block Editor (Phase 6) ships.
