// scripts/test-register.js
// Node.js module loader hook — transforms JSX in .js source files during test execution.
// Used via: node --import ./scripts/test-register.js --test ...
// This enables tests to import JSX files directly without a build step.
// esbuild is already installed as a transitive dependency of tsup.

import { register } from 'node:module'
import { MessageChannel } from 'node:worker_threads'
import { pathToFileURL } from 'node:url'

register(pathToFileURL('./scripts/test-loader.js').href, { parentURL: import.meta.url })
