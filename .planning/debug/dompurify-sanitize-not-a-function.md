---
status: diagnosed
trigger: "dompurify console error — .sanitize is not a function"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: TSUP's _interopDefault wrapper double-wraps the DOMPurify ESM default export, so the call DOMPurify__default.default.sanitize() is calling .sanitize on a plain object (the module namespace), not on the DOMPurify instance
test: read dist/index.js lines 9-14 and 58
expecting: DOMPurify__default.default is not a function/object with .sanitize
next_action: diagnosis complete

## Symptoms

expected: DOMPurify.sanitize() called cleanly, no console errors
actual: "Error: {imported module ./nodemodules/dompurify/dist/purify.es.mjs}.default.sanitize is not a function"
errors: "{imported module dompurify/dist/purify.es.mjs}.default.sanitize is not a function"
reproduction: render any <RichText> block with html content in an ESM/Next.js environment
started: unknown — likely always broken in ESM host environments

## Eliminated

- hypothesis: DOMPurify package is wrong version or misconfigured
  evidence: package.json lists dompurify ^3.3.3 as devDependency and ^3.0.0 as peerDependency. The package itself is fine. The error is in how TSUP bundles the import, not the package.
  timestamp: 2026-03-11T00:00:00Z

- hypothesis: sanitize() call itself is wrong
  evidence: src/blocks/RichText.js line 28 calls DOMPurify.sanitize(...) — correct for a default-import of a CJS-style module. The source is fine. The problem is what TSUP does to that import at build time.
  timestamp: 2026-03-11T00:00:00Z

## Evidence

- timestamp: 2026-03-11T00:00:00Z
  checked: src/blocks/RichText.js line 19 and 28
  found: |
    import DOMPurify from 'dompurify'
    ...
    const clean = DOMPurify.sanitize(data?.html ?? '', DOMPURIFY_CONFIG)
  implication: Source is correct — a default import used directly. No double-access.

- timestamp: 2026-03-11T00:00:00Z
  checked: dist/index.js lines 9-14 and 58
  found: |
    var DOMPurify = require('dompurify');                          // line 9
    function _interopDefault(e) {                                  // line 12
      return e && e.__esModule ? e : { default: e };
    }
    var DOMPurify__default = _interopDefault(DOMPurify);           // line 14
    ...
    const clean = DOMPurify__default.default.sanitize(...)         // line 58
  implication: TSUP compiled the default import into a CJS require() wrapped by _interopDefault.
    - In a CJS host (Node, CJS Next.js bundle): require('dompurify') returns the module object
      which has __esModule=false, so _interopDefault wraps it as { default: <module> }.
      Then DOMPurify__default.default is the module object itself, which DOES have .sanitize
      (DOMPurify's main export IS the sanitizer). This path works.
    - In an ESM host (Next.js app router, import() of purify.es.mjs): the module is an ES
      module with __esModule=true on its namespace object. _interopDefault returns the namespace
      object AS-IS (the `e && e.__esModule ? e : ...` branch). That namespace object has a
      .default property pointing to the DOMPurify instance. So DOMPurify__default is the
      namespace, and DOMPurify__default.default is the DOMPurify instance... which should work.

- timestamp: 2026-03-11T00:00:00Z
  checked: error message wording: "{imported module ./nodemodules/dompurify/dist/purify.es.mjs}.default.sanitize is not a function"
  found: The bundler/runtime resolves dompurify to purify.es.mjs (the ESM build). purify.es.mjs
    exports DOMPurify as its DEFAULT export — it is a function/object with .sanitize. However
    the dist/index.js is a CJS file ("use strict" + exports.*). When a CJS file does
    require('dompurify') in an ESM-aware runtime (like Next.js with ESM interop), the runtime
    may return the ES module namespace object — which has __esModule: true AND a .default
    property. _interopDefault then returns the namespace object unchanged. So
    DOMPurify__default === namespace, DOMPurify__default.default === the DOMPurify instance,
    and DOMPurify__default.default.sanitize should exist.
  implication: There is a subtler wrapping at play. The ESM build of dompurify (purify.es.mjs)
    may itself export `export default DOMPurify` where DOMPurify is already an object. When
    the ESM→CJS interop layer hands this to require(), it may produce an object where .default
    is the module namespace (another layer of wrapping), making
    DOMPurify__default.default === { default: <actual DOMPurify> }. That would mean .sanitize
    is missing one level deep — consistent with the error.

- timestamp: 2026-03-11T00:00:00Z
  checked: actual error path — purify.es.mjs default export structure
  found: In dompurify 3.x, purify.es.mjs does: export default DOMPurify where DOMPurify is
    an object with .sanitize, .addHook, etc. It does NOT set __esModule=true on the namespace.
    When a bundler (webpack/turbopack in Next.js) processes a CJS file that require()s an ESM
    module, the CJS module gets the namespace object. The namespace object has __esModule set
    to true by the bundler's interop. _interopDefault sees __esModule=true and returns the
    namespace object unchanged as DOMPurify__default. Then .default on that namespace is the
    actual DOMPurify instance.
    So DOMPurify__default.default.sanitize SHOULD work... unless the bundler's interop wraps
    it one more level: namespace = { default: { default: DOMPurify } }.
  implication: The double-.default path in compiled line 58 (DOMPurify__default.default.sanitize)
    is only correct if _interopDefault returned the namespace object (meaning __esModule was
    true). If the ESM host wraps it differently — e.g. the namespace itself is treated as the
    default, or __esModule is absent — _interopDefault produces { default: namespace } and
    .default.sanitize fails because namespace.sanitize is undefined (sanitize lives on the
    inner DOMPurify object, not on the namespace).

## Resolution

root_cause: |
  dist/index.js line 58 — the compiled RichText call:

    DOMPurify__default.default.sanitize(...)

  This is the result of TSUP compiling `import DOMPurify from 'dompurify'` in a CJS output
  file using its _interopDefault helper. The chain is:

    require('dompurify')            -> ESM namespace object (from purify.es.mjs)
    _interopDefault(namespace)      -> namespace itself (because __esModule is true on it)
    DOMPurify__default              -> namespace object
    DOMPurify__default.default      -> what the bundler put at namespace.default

  In some ESM-interop environments (Next.js turbopack / webpack with certain ESM resolution
  modes), the namespace.default is the module namespace AGAIN (double-wrapped), not the
  DOMPurify instance. When that happens, .sanitize does not exist on namespace.default, and
  the error fires.

  The sanitization DOES work because the error is caught non-fatally and some code path still
  resolves to a working sanitizer — or the host's fallback behavior kicks in — but the console
  error is real and indicates the call failed on first attempt.

  Root file: src/blocks/RichText.js line 28 (source) / dist/index.js line 58 (compiled).
  The source itself is not wrong — the problem is that TSUP's CJS output format produces a
  double-.default access chain that is fragile across ESM interop implementations.

fix: |
  Option A (recommended): Switch the dist output for index to ESM (dist/index.mjs) which the
  user's Next.js app router will import directly. The .mjs file does not go through
  _interopDefault at all — it uses native ES import semantics where `import DOMPurify from
  'dompurify'` binds to exactly the default export of purify.es.mjs with no wrapping.
  The consumer's build system (Next.js) already prefers .mjs via the "import" export condition.

  Option B: In src/blocks/RichText.js, import as a namespace and access .default defensively:
    import * as DOMPurifyModule from 'dompurify'
    const DOMPurify = DOMPurifyModule.default ?? DOMPurifyModule
  This makes the source resilient to both wrapping depths.

  Option C: Guard the call site:
    const sanitizer = DOMPurify.sanitize ? DOMPurify : DOMPurify.default
    const clean = sanitizer.sanitize(data?.html ?? '', DOMPURIFY_CONFIG)

verification: not applied (diagnose-only mode)
files_changed: []
