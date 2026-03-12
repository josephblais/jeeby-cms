import { defineConfig } from 'tsup'

export default defineConfig([
  // Entry 1: client components — "use client" banner injected at bundle entry
  // NOTE: "use client" is NOT in the source file; TSUP injects it at the top of every output file in this config block
  {
    entry: { index: 'src/index.js' },
    format: ['esm', 'cjs'],
    splitting: false,
    treeshake: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion', 'dompurify', 'video.js'],
    banner: { js: '"use client";' },
    loader: { '.js': 'jsx' },
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.jsxImportSource = 'react'
    },
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  // Entry 2: admin components — no entry-level banner (individual files self-mark as needed)
  {
    entry: { admin: 'src/admin/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    treeshake: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion', /^firebase-admin/],
    loader: { '.js': 'jsx' },
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.jsxImportSource = 'react'
    },
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  // Entry 3: server utilities — NO "use client" at any level (server components import from here)
  {
    entry: { server: 'src/server/index.js' },
    format: ['esm', 'cjs'],
    splitting: false,
    treeshake: true,
    external: ['firebase', /^firebase-admin/],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
])
