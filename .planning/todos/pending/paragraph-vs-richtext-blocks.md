---
created: 2026-03-11T00:00:00Z
source: UAT session (Phase 3)
priority: medium
---

# Design question: Paragraph vs RichText blocks — what's the distinction?

During UAT, noticed: why have both a Paragraph block (plain text in <p>) and a RichText block (sanitized HTML)?

**Options to consider:**
- Keep both: Paragraph = plain text only (safe, simple); RichText = formatted HTML (bold, links, etc.)
- Merge: Drop Paragraph, use RichText for all text content
- Clarify docs: Make the distinction obvious in consumer-facing docs

**Decision needed before Phase 6 (Block Editor)** — the editor UI needs to know which block types to offer.
