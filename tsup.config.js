import { defineConfig } from 'tsup'

export default defineConfig([
  // Entry 1: client components — "use client" injected by post-build script (not banner)
  // NOTE: "use client" is NOT in the source file. The post-build script in package.json
  // prepends it to dist/index.{js,mjs} after esbuild runs, avoiding Rollup directive warnings.
  {
    entry: { index: 'src/index.js' },
    format: ['esm', 'cjs'],
    splitting: false,
    clean: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion', 'dompurify', 'video.js'],
    loader: { '.js': 'jsx' },
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.jsxImportSource = 'react'
    },
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
  },
  // Entry 2: admin components — "use client" comes from src/admin/index.js (entry file directive).
  // NOTE: ../index.js is rewritten to 'jeeby-cms' at bundle time so both admin and index
  // share the same React context instance at runtime (prevents "must be inside CMSProvider").
  // treeshake removed: esbuild tree-shaking is sufficient; Rollup post-pass generated spurious
  // warnings for tiptap's unused react/react-dom imports and storage.js's deleteObject.
  {
    entry: { admin: 'src/admin/index.js' },
    format: ['esm', 'cjs'],
    splitting: true,
    external: ['react', 'react-dom', 'next', 'firebase', 'framer-motion', /^firebase-admin/, /^use-sync-external-store/],
    loader: { '.js': 'jsx' },
    esbuildPlugins: [
      {
        name: 'externalize-main-entry',
        setup(build) {
          build.onResolve({ filter: /\.\.\/index\.js$/ }, () => ({
            path: 'jeeby-cms',
            external: true,
          }))
        },
      },
    ],
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
