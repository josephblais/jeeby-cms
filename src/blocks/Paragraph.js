// src/blocks/Paragraph.js
// ACCESSIBILITY: WCAG 1.3.1 (Info and Relationships)
// Always use <p> — never <div> or <span> for paragraph content.
// Native <p> semantics convey paragraph structure to screen readers without ARIA.

export function Paragraph({ data, className }) {
  return <p className={className}>{data?.text}</p>
}
