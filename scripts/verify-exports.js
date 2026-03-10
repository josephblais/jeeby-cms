#!/usr/bin/env node
// scripts/verify-exports.js
// Automated validation of Phase 1 build outputs.
// Run: npm run build && node scripts/verify-exports.js
// Exits 0 on full pass, exits 1 on first failure (with descriptive error).

const fs = require('fs')
const path = require('path')

let passed = 0
let failed = 0

function check(label, fn) {
  try {
    fn()
    console.log(`  PASS  ${label}`)
    passed++
  } catch (err) {
    console.error(`  FAIL  ${label}`)
    console.error(`        ${err.message}`)
    failed++
  }
}

function fileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
}

function fileContains(filePath, needle) {
  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes(needle)) {
    throw new Error(`Expected "${needle}" in ${filePath}`)
  }
}

function fileNotContains(filePath, needle) {
  const content = fs.readFileSync(filePath, 'utf8')
  if (content.includes(needle)) {
    throw new Error(`"${needle}" must NOT appear in ${filePath}`)
  }
}

function fileStartsWith(filePath, prefix) {
  const content = fs.readFileSync(filePath, 'utf8')
  // Trim BOM or leading whitespace tsup might add before the banner
  const trimmed = content.replace(/^\uFEFF/, '').trimStart()
  if (!trimmed.startsWith(prefix)) {
    throw new Error(
      `${filePath} must start with ${JSON.stringify(prefix)}.\nActual start: ${JSON.stringify(trimmed.slice(0, 40))}`
    )
  }
}

function hasExports(modulePath, expectedExports) {
  const mod = require(path.resolve(modulePath))
  expectedExports.forEach((name) => {
    if (typeof mod[name] === 'undefined') {
      throw new Error(`${modulePath} is missing export: ${name}`)
    }
  })
}

console.log('\n=== jeeby-cms build verification ===\n')

// --- PKG-02: All dist JS files exist ---
console.log('PKG-02: dist file existence')
check('dist/index.mjs exists', () => fileExists('dist/index.mjs'))
check('dist/index.js exists', () => fileExists('dist/index.js'))
check('dist/admin.mjs exists', () => fileExists('dist/admin.mjs'))
check('dist/admin.js exists', () => fileExists('dist/admin.js'))
check('dist/server.mjs exists', () => fileExists('dist/server.mjs'))
check('dist/server.js exists', () => fileExists('dist/server.js'))

// --- PKG-03: CSS output exists ---
console.log('\nPKG-03: CSS output')
check('dist/styles.css exists', () => fileExists('dist/styles.css'))

// --- PKG-02: Banner isolation ---
console.log('\nPKG-02: "use client" banner isolation')
check('dist/index.mjs starts with "use client"', () =>
  fileStartsWith('dist/index.mjs', '"use client"')
)
check('dist/index.js starts with "use client"', () =>
  fileStartsWith('dist/index.js', '"use client"')
)
check('dist/server.js does NOT contain "use client"', () =>
  fileNotContains('dist/server.js', 'use client')
)
check('dist/server.mjs does NOT contain "use client"', () =>
  fileNotContains('dist/server.mjs', 'use client')
)

// --- PKG-04: Peer deps not bundled ---
console.log('\nPKG-04: peer dependencies not bundled into index entry')
check('dist/index.mjs does not bundle firebase', () =>
  fileNotContains('dist/index.mjs', 'firebase/app')
)
check('dist/index.mjs does not bundle framer-motion internals', () =>
  fileNotContains('dist/index.mjs', 'framer-motion/dist')
)

// --- PKG-01: Named exports resolve ---
console.log('\nPKG-01: named exports')
check('dist/index.js exports CMSProvider', () =>
  hasExports('dist/index.js', ['CMSProvider', 'Blocks', 'Block', 'useCMSContent'])
)
check('dist/admin.js exports AdminPanel', () =>
  hasExports('dist/admin.js', ['AdminPanel', 'withCMSAuth'])
)
check('dist/server.js exports getCMSContent', () =>
  hasExports('dist/server.js', ['getCMSContent'])
)

// --- Summary ---
console.log(`\n${'='.repeat(38)}`)
console.log(`  ${passed} passed, ${failed} failed`)
console.log('='.repeat(38))

if (failed > 0) {
  console.error('\nBuild verification FAILED. Fix the issues above and re-run: npm run build && node scripts/verify-exports.js\n')
  process.exit(1)
} else {
  console.log('\nBuild verification PASSED. Phase 1 scaffolding is complete.\n')
  process.exit(0)
}
