<!-- a11y-agent-team: start -->
# Accessibility-First Development

This project enforces WCAG AA accessibility standards for all web UI code.

## Hook-Based Enforcement

Accessibility review is enforced by three global hooks:

1. **Proactive detection** (`UserPromptSubmit`) — Detects web projects and injects the delegation instruction on every prompt.
2. **Edit gate** (`PreToolUse`) — Blocks Edit/Write to UI files until accessibility-lead has been consulted. Uses `permissionDecision: "deny"`.
3. **Session marker** (`PostToolUse`) — Unlocks the edit gate after accessibility-lead completes.

If an edit is blocked, delegate to `accessibility-agents:accessibility-lead` first.

## Mandatory Accessibility Check

Before writing or modifying any web UI code - including HTML, JSX, CSS, React components, Tailwind classes, web pages, forms, modals, or any user-facing web content - you MUST:

1. Consider which accessibility specialist agents are needed for the task
2. Apply the relevant specialist knowledge before generating code
3. Verify the output against the appropriate checklists

**Automatic trigger detection:** If a user prompt involves creating, editing, or reviewing any file matching `*.html`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte`, `*.astro`, or `*.css` - or if the prompt describes building UI components, pages, forms, or visual elements - treat it as a web UI task and apply the Decision Matrix below.

## Available Specialist Agents

| Agent | When to Use |
|-------|------------|
| accessibility-lead | Any UI task - coordinates all specialists and runs final review |
| aria-specialist | Interactive components, custom widgets, ARIA usage |
| modal-specialist | Dialogs, drawers, popovers, overlays |
| contrast-master | Colors, themes, CSS styling, visual design |
| keyboard-navigator | Tab order, focus management, keyboard interaction |
| live-region-controller | Dynamic content updates, toasts, loading states |
| forms-specialist | Forms, inputs, validation, error handling, multi-step wizards |
| alt-text-headings | Images, alt text, SVGs, heading structure, page titles, landmarks |
| tables-data-specialist | Data tables, sortable tables, grids, comparison tables |
| link-checker | Ambiguous link text, "click here"/"read more" detection |
| cognitive-accessibility | WCAG 2.2 cognitive SC, COGA guidance, plain language |
| mobile-accessibility | React Native, Expo, iOS, Android - touch targets, screen readers |
| design-system-auditor | Color token contrast, focus ring tokens, spacing tokens |
| web-accessibility-wizard | Full guided web accessibility audit |
| document-accessibility-wizard | Document audit for .docx, .xlsx, .pptx, .pdf |
| markdown-a11y-assistant | Markdown audit - links, headings, emoji, tables |
| testing-coach | Screen reader testing, keyboard testing, automated testing |
| wcag-guide | WCAG 2.2 criteria explanations, conformance levels |

## Commands

Type `/` followed by a command name to invoke the corresponding specialist directly:

| Command | Specialist | Purpose |
|-------|-----------|---------|
| `/aria` | aria-specialist | ARIA patterns - roles, states, properties |
| `/contrast` | contrast-master | Color contrast - ratios, themes, visual design |
| `/keyboard` | keyboard-navigator | Keyboard nav - tab order, focus, shortcuts |
| `/forms` | forms-specialist | Forms - labels, validation, error handling |
| `/alt-text` | alt-text-headings | Images/headings - alt text, hierarchy, landmarks |
| `/tables` | tables-data-specialist | Tables - headers, scope, caption, sorting |
| `/links` | link-checker | Links - ambiguous text detection |
| `/modal` | modal-specialist | Modals - focus trap, return, escape |
| `/live-region` | live-region-controller | Live regions - dynamic announcements |
| `/audit` | web-accessibility-wizard | Full guided web accessibility audit |
| `/document` | document-accessibility-wizard | Document audit - Word, Excel, PPT, PDF |
| `/markdown` | markdown-a11y-assistant | Markdown audit - links, headings, emoji |
| `/test` | testing-coach | Testing - screen reader, keyboard, automated |
| `/wcag` | wcag-guide | WCAG reference - criteria explanations |
| `/cognitive` | cognitive-accessibility | Cognitive a11y - COGA, plain language |
| `/mobile` | mobile-accessibility | Mobile - React Native, touch targets |
| `/design-system` | design-system-auditor | Tokens - contrast, focus rings, spacing |

## Decision Matrix

- **New component or page:** Always apply aria-specialist + keyboard-navigator + alt-text-headings. Add forms-specialist for inputs, contrast-master for styling, modal-specialist for overlays, live-region-controller for dynamic updates, tables-data-specialist for data tables.
- **Modifying existing UI:** At minimum apply keyboard-navigator. Add others based on what changed.
- **Code review/audit:** Apply all specialist checklists. Use web-accessibility-wizard for guided audits.
- **Document audit:** Use document-accessibility-wizard for Office and PDF accessibility audits.
- **Mobile app:** Use mobile-accessibility for touch targets, labels, and screen reader compatibility.
- **Cognitive / UX clarity:** Use cognitive-accessibility for WCAG 2.2 SC 3.3.7, 3.3.8, 3.3.9, COGA guidance.
- **Design system / tokens:** Use design-system-auditor to validate color token pairs, focus ring tokens, spacing tokens.
- **Data tables:** Always apply tables-data-specialist.
- **Links:** Always apply link-checker when pages contain hyperlinks.
- **Images or media:** Always apply alt-text-headings.

## Non-Negotiable Standards

- Semantic HTML before ARIA (`<button>` not `<div role="button">`)
- One H1 per page, never skip heading levels
- Every interactive element reachable and operable by keyboard
- Text contrast 4.5:1, UI component contrast 3:1
- No information conveyed by color alone
- Focus managed on route changes, dynamic content, and deletions
- Modals trap focus and return focus on close
- Live regions for all dynamic content updates

For tasks that do not involve any user-facing web content (backend logic, scripts, database work), these requirements do not apply.


<!-- a11y-agent-team: end -->

## Design Context

### Users

Two audiences, weighted equally:

1. Developers — built the Next.js site, drop in the CMS package, occasionally edit content themselves. Technical, comfortable with dark UIs and dense information. They want correctness and zero surprise.
2. Content editors — a client or teammate who didn't write the code. Uses the admin panel regularly to update pages. Needs clear affordances, low friction, and confidence that their actions are reversible.

The UI must be legible to a non-technical editor on first contact while remaining efficient for a developer in flow. Avoid jargon in labels and copy. Every destructive action needs clear confirmation.

### Brand Personality

Three-word personality: quiet, polished, trustworthy

The CMS has no brand of its own — it lives inside someone else's product. Emotional goal: editors feel in control. Developers feel nothing is fighting them.

### Aesthetic Direction

- Dark mode only for now (light mode planned, stub in CSS)
- Surface: near-black (`#191919`), card: `#252521` — warm dark, not cold gray
- Accent defaults are neutral so consumer theming is the star. Current blue (`#4a90d9`) is a safe fallback, not a brand color. Prefer lower-saturation accents when adding new tokens.
- Typography: system font stack at 0.875rem — compact, readable, no typographic personality
- Animation: subtle, purposeful. Framer Motion is a peer dep — use for drag/toasts/modals, not decoration
- Reference feel: Ghost CMS, Linear, Vercel dashboard
- Anti-reference: WordPress admin, builder tools with lots of chrome

### Design Principles

1. Recede from the consumer's brand — defaults are neutral; every color token is overridable
2. Confidence through clarity — status always visible (draft/published, auto-save, loading)
3. Polished, not decorative — transitions orient the user, not impress
4. Zero friction for both audiences — plain-language labels for editors, keyboard-operable controls for developers
5. Accessibility is structural — WCAG AA enforced by hooks; focus rings, touch targets, live regions are non-negotiable
