// css-theming.test.js
// Structural tests for styles/cms.css
// Covers: CSS-01 (scoping), CSS-02 (var declarations), CSS-04 (no block element style leaks)
// Run: node --import ./scripts/test-register.js --test src/admin/css-theming.test.js

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cssPath = resolve(__dirname, '../../styles/cms.css')
const css = readFileSync(cssPath, 'utf8')

// ─────────────────────────────────────────────
// CSS-01: All selectors scoped under .jeeby-cms-admin
// ─────────────────────────────────────────────
describe('CSS-01: Selector scoping', () => {
  it('styles/cms.css file exists and is non-empty', () => {
    assert.ok(css.trim().length > 0, 'styles/cms.css must not be empty')
  })

  it('every selector starts with .jeeby-cms-admin or is @keyframes / @media / a comment', () => {
    // Strip block comment contents so /* ... */ don't produce false positives
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

    // Extract lines that contain an opening brace (potential selector lines)
    const lines = stripped.split('\n')
    const selectorLines = lines.filter(line => line.includes('{'))

    const violations = []

    for (const rawLine of selectorLines) {
      const line = rawLine.trim()

      // Skip empty lines, at-rules (@keyframes, @media, @supports etc.)
      if (!line || line.startsWith('@')) continue

      // Skip property declarations inside a rule block (contain ':' before '{')
      // A property:value line looks like "  color: red;" — no '{' on value lines
      // But we already filtered for lines with '{', so check for property pattern
      const colonBeforeBrace = line.indexOf(':') !== -1 && line.indexOf(':') < line.indexOf('{')
      if (colonBeforeBrace) {
        // Could be a selector like `.jeeby-cms-admin[data-theme="light"] {`
        // If it starts with '.jeeby-cms-admin' that's fine; if colon is inside [] that's an attribute selector
        // Only skip if it looks like a CSS property declaration (identifier: value)
        const beforeColon = line.slice(0, line.indexOf(':')).trim()
        // Property names are lowercase with hyphens, no spaces or dots
        if (/^[a-z-]+$/.test(beforeColon)) continue
      }

      // A valid scoped selector must start with .jeeby-cms-admin
      if (!line.startsWith('.jeeby-cms-admin')) {
        violations.push(line)
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Found selectors not scoped under .jeeby-cms-admin:\n${violations.join('\n')}`
    )
  })
})

// ─────────────────────────────────────────────
// CSS-02: Required CSS custom properties declared
// ─────────────────────────────────────────────
describe('CSS-02: CSS custom property declarations', () => {
  const requiredVars = [
    '--jeeby-cms-max-width',
    '--jeeby-cms-block-spacing',
    '--jeeby-cms-gallery-columns',
    '--jeeby-cms-accent',
    '--jeeby-cms-focus-ring',
    '--jeeby-cms-bg-surface',
    '--jeeby-cms-text-primary',
  ]

  for (const varName of requiredVars) {
    it(`declares ${varName}`, () => {
      assert.ok(
        css.includes(varName),
        `styles/cms.css must contain CSS custom property: ${varName}`
      )
    })
  }
})

// ─────────────────────────────────────────────
// CSS-04: No block element style leaks
// ─────────────────────────────────────────────
describe('CSS-04: No bare block element selectors', () => {
  it('does not contain bare h1-h6, p, img, figure, ul, ol, video, iframe selectors outside .jeeby-cms-admin', () => {
    // Strip comment blocks
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

    // This regex matches block element selector tokens that appear at the start of a line
    // (after optional whitespace), NOT preceded by a dot, #, or other combinator characters
    // that would place them inside a scoped selector.
    const bareBlockPattern = /^\s*(h[1-6]|p|img|figure|ul|ol|video|iframe)\s*[{,]/m

    assert.ok(
      !bareBlockPattern.test(stripped),
      'styles/cms.css must not contain bare block element selectors (h1-h6, p, img, figure, ul, ol, video, iframe) outside .jeeby-cms-admin scope'
    )
  })

  it('does not contain a .jeeby-cms-block selector (blocks get no styles from this file)', () => {
    // Strip comment blocks
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.ok(
      !stripped.includes('.jeeby-cms-block'),
      'styles/cms.css must not target .jeeby-cms-block class'
    )
  })
})

// ─────────────────────────────────────────────
// data-theme stub
// ─────────────────────────────────────────────
describe('data-theme light mode stub', () => {
  it('contains .jeeby-cms-admin[data-theme="light"] selector', () => {
    assert.ok(
      css.includes('.jeeby-cms-admin[data-theme="light"]'),
      'styles/cms.css must contain the data-theme="light" stub selector for future light mode'
    )
  })
})
