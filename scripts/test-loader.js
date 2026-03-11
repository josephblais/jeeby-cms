// scripts/test-loader.js
// Node.js ESM loader hook — transforms JSX syntax in src/**/*.js files at import time.
// Only applies to files within the src/ directory to avoid transforming node_modules.
// Uses esbuild (already installed as tsup dependency) for fast in-memory transforms.

import { transform } from 'esbuild'
import { readFile } from 'node:fs/promises'

const SRC_RE = /\/src\//

export async function load(url, context, nextLoad) {
  // Only transform .js files inside src/
  if (!url.endsWith('.js') || !SRC_RE.test(url)) {
    return nextLoad(url, context)
  }

  const filePath = decodeURIComponent(new URL(url).pathname)
  const source = await readFile(filePath, 'utf8')

  const result = await transform(source, {
    loader: 'jsx',
    jsx: 'automatic',
    jsxImportSource: 'react',
    format: 'esm',
    target: 'node22',
    sourcemap: 'inline',
    sourcefile: filePath,
  })

  return {
    format: 'module',
    source: result.code,
    shortCircuit: true,
  }
}
