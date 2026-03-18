# Phase 4: Admin Auth - Research

**Researched:** 2026-03-17
**Domain:** React UI components — Firebase Auth integration, cookie session management, admin shell routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Session Cookie Strategy**
- After `signIn()` succeeds, call `user.getIdToken()` and set `document.cookie = '__session=' + token + '; path=/; SameSite=Strict'`
- ID token approach — `withCMSAuth` already calls `verifyIdToken`, which accepts ID tokens directly (no session cookie API needed)
- Token refresh: handled inside the `useAuth` hook — Firebase SDK auto-refreshes the ID token every hour and fires `onAuthStateChanged` again; the hook's callback calls `user.getIdToken()` and updates the `__session` cookie automatically
- Cookie is cleared on sign-out (set empty/expired value)

**Login Form UX**
- Centered card layout on a neutral background: "jeeby CMS" heading at top, email field, password field, submit button, error area below button
- Error display: single inline message below the submit button (e.g. "Invalid email or password.") — no per-field errors
- Loading state: spinner inside the submit button while the sign-in request is in flight; button is disabled during loading
- Card layout is designed to be extensible for a future "create user" page (same card, different content)

**Admin Shell (Post-login)**
- Minimal nav bar at the top: app name ("jeeby CMS") on the left, "Sign out" button on the right
- Main content area below nav is a placeholder — Phase 5 fills it with Page Manager
- Loading state (while `useAuth` resolves): show a spinner or skeleton rather than a blank screen, to prevent flash of login form for authenticated users

**Sign-out**
- "Sign out" button lives in the top-right of the nav bar — visible, no dropdown
- After sign-out: `useAuth` state clears to `null`, `AdminPanel` re-renders to `LoginPage` automatically — no explicit router redirect needed
- `__session` cookie cleared on sign-out

### Claude's Discretion
- Exact CSS classes and visual styling for the login card and nav bar (Phase 8 does full CSS — Phase 4 uses minimal inline or class-based styles sufficient for function)
- Spinner implementation (inline SVG, CSS animation, or a tiny utility)
- Exact `document.cookie` string format beyond `path=/; SameSite=Strict`
- Whether nav bar is its own component (`AdminNav`) or inline in `AdminPanel`

### Deferred Ideas (OUT OF SCOPE)
- Create user / user management page — user noted the login card should be extensible for this. New capability; belongs in a future phase (post-v1 or a new admin-user-management phase).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Admin panel shows `LoginPage` (email/password) when user is unauthenticated | `AdminPanel` reads `useAuth().loading` and `useAuth().user`; renders `<LoginPage>` when `user === null && !loading` |
| AUTH-02 | `withCMSAuth` middleware helper redirects unauthenticated requests away from `/admin/*` | Already implemented in `src/admin/index.js` — Phase 4 closes the `__session` cookie gap so the middleware actually receives a token |
| AUTH-03 | `useAuth` hook exposes current user and sign-out function to admin components | `useAuth()` exists in `src/index.js`; needs `__session` cookie update wired into its `onAuthStateChanged` callback |
</phase_requirements>

---

## Summary

Phase 4 is primarily a UI wiring phase, not a new Firebase integration phase. The Firebase Auth helpers (`signIn`, `signOut`, `subscribeToAuthState`) and the `withCMSAuth` middleware are already fully implemented. What is missing is: (1) the `__session` cookie write/clear logic in `useAuth`, (2) the `LoginPage` React component, and (3) the `AdminPanel` component that gates on auth state.

The architecture is straightforward: `AdminPanel` calls `useAuth()`, conditionally renders `<LoginPage>` or the admin shell based on the `user`/`loading` state, and Phase 5 will slot into the shell's main content area. The cookie lifecycle is the only non-trivial piece — the token must be written after every `onAuthStateChanged` call (not just on sign-in) because Firebase auto-refreshes ID tokens hourly.

The admin entry (`src/admin/index.js`) uses TSUP's JSX `automatic` transform with splitting enabled, so components can use JSX directly with `"use client"` at the top of individual files.

**Primary recommendation:** Implement in this order: (1) add cookie update to `useAuth`, (2) build `LoginPage`, (3) build `AdminPanel`. Tests use `renderToStaticMarkup` with `createElement` (no JSX in test files) to stay compatible with the Node.js test runner.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | >=18 (peer) | Component rendering | Already peer dep; all blocks use it |
| firebase | >=10 (peer) | Auth state subscription | Already peer dep; `useAuth` built on it |
| react-dom/server | >=18 (peer) | `renderToStaticMarkup` in tests | Used by all existing block tests |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:test | built-in | Unit tests | All existing tests use it |
| node:assert/strict | built-in | Assertions | All existing tests use it |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `renderToStaticMarkup` in tests | React Testing Library | RTL requires jsdom; Node test runner does not support jsdom without extra setup — `renderToStaticMarkup` is the established pattern in this codebase |
| Inline `__session` cookie set | `js-cookie` library | No extra dep needed; `document.cookie` assignment is sufficient for this use case |

**Installation:** No new packages needed. All dependencies are already present.

---

## Architecture Patterns

### Recommended File Structure

```
src/admin/
├── index.js          # AdminPanel (entry) + withCMSAuth (existing)
├── LoginPage.js      # Login card component — "use client"
└── index.test.js     # Tests for AdminPanel export shape
src/admin/login-page/
└── LoginPage.test.js # Tests for LoginPage rendering
src/index.js          # useAuth — add __session cookie logic here
```

**Note on file placement:** The admin entry has `splitting: true` in tsup, so sub-files can be imported from `src/admin/` and will be tree-shaken correctly. `LoginPage` can live as `src/admin/LoginPage.js` and be imported by `AdminPanel`.

### Pattern 1: Auth Gate in AdminPanel

**What:** `AdminPanel` is the single auth gate. It reads `useAuth()` and renders one of three states: loading spinner, `LoginPage`, or admin shell.

**When to use:** Always — this is the only pattern. No React Router or Next.js router is involved (the component is embedded in the consumer's Next.js app).

```javascript
// "use client"
import { createElement } from 'react'
import { useAuth } from '../index.js'
import { LoginPage } from './LoginPage.js'

export function AdminPanel() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return createElement('div', { className: 'jeeby-cms-admin' },
      createElement('span', { 'aria-live': 'polite', 'aria-busy': 'true' }, 'Loading…')
    )
  }

  if (!user) {
    return createElement(LoginPage, null)
  }

  return createElement('div', { className: 'jeeby-cms-admin' },
    // Nav bar (AdminNav or inline)
    createElement('nav', null, /* sign out button */),
    // Main content area — Phase 5 renders here
    createElement('main', null, null)
  )
}
```

### Pattern 2: Cookie Lifecycle in useAuth

**What:** The `onAuthStateChanged` callback in `useAuth` writes the `__session` cookie when a user is present and clears it when `null`.

**When to use:** This is the only place the cookie is managed. Do not set it in `LoginPage` after `signIn()` resolves — Firebase fires `onAuthStateChanged` immediately after sign-in, so the hook handles it automatically.

```javascript
// In useAuth's onAuthStateChanged callback:
subscribeToAuthState(auth, async (u) => {
  if (u) {
    const token = await u.getIdToken()
    document.cookie = `__session=${token}; path=/; SameSite=Strict`
  } else {
    // Clear cookie: set expired
    document.cookie = '__session=; path=/; SameSite=Strict; max-age=0'
  }
  setUser(u)
  setLoading(false)
})
```

**Important:** `getIdToken()` is async — the callback must be `async` and `setUser`/`setLoading` must be called after `await`.

### Pattern 3: LoginPage Component

**What:** Controlled form — local `useState` for email, password, error, and loading. Calls `useAuth().signIn(email, password)` on submit.

**When to use:** Rendered by `AdminPanel` when `user === null`.

```javascript
// "use client"
import { createElement, useState } from 'react'
import { useAuth } from '../index.js'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      // Success: useAuth fires onAuthStateChanged → AdminPanel re-renders to shell
    } catch {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }
  // ... render card
}
```

### Anti-Patterns to Avoid

- **Setting `__session` in `LoginPage` after `signIn()` resolves:** `onAuthStateChanged` fires immediately after sign-in, so the hook already handles cookie writes. Double-setting would create a race condition.
- **Using router.push() for sign-out redirect:** The user decided against this. State change via `useAuth` is sufficient — no router import needed.
- **Importing `firebase/auth` directly in `LoginPage` or `AdminPanel`:** All auth ops go through `useAuth()` which delegates to `src/firebase/auth.js`. Direct firebase imports in UI components break the established encapsulation pattern.
- **`getIdToken(false)` (forced refresh) on every cookie write:** Normal `getIdToken()` (no argument) uses the cached token and only fetches a new one when near expiry. This is the correct call.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth state subscription | Custom polling or event system | Firebase `onAuthStateChanged` via existing `subscribeToAuthState` | Already implemented; handles edge cases, cleanup, and React Strict Mode double-invoke |
| Token auto-refresh | Interval timer that calls `getIdToken()` | Firebase SDK auto-refresh + `onAuthStateChanged` re-fire | Firebase refreshes tokens ~5 min before expiry and fires `onAuthStateChanged`; hook's callback updates cookie automatically |
| Middleware token verification | Custom JWT decode | `verifyIdToken` via existing `withCMSAuth` | Already implemented; validates signature, expiry, and audience |
| Session cookie API | `firebase/app-check` or `firebase-admin` session cookies | Plain ID token in `__session` cookie | User explicitly locked this approach; `verifyIdToken` accepts ID tokens directly |

**Key insight:** This phase's complexity is almost entirely UI rendering logic, not Firebase integration. The hardest part is managing the three `AdminPanel` render states (loading, unauthenticated, authenticated) without flashing the login form for already-authenticated users.

---

## Common Pitfalls

### Pitfall 1: Flash of Login Form on Refresh

**What goes wrong:** `useAuth` initializes with `{ user: undefined, loading: true }`. If `AdminPanel` renders `<LoginPage>` when `user` is falsy (rather than when `user === null`), authenticated users see the login form briefly on every page load.

**Why it happens:** `undefined` and `null` are both falsy. The distinction matters: `undefined` = still resolving, `null` = confirmed signed out.

**How to avoid:** Use `loading` state as the primary gate. Only render `<LoginPage>` when `loading === false && user === null`. Render a spinner when `loading === true`.

**Warning signs:** A user who is already logged in sees the login form flash before the admin shell appears.

---

### Pitfall 2: async onAuthStateChanged Callback Timing

**What goes wrong:** The `onAuthStateChanged` callback is made `async` to `await getIdToken()`. If `setUser` / `setLoading` are called before the `await` resolves, React updates fire before the cookie is written — the next middleware check reads a stale or absent cookie.

**Why it happens:** `await` yields execution; state setters called before it run synchronously.

**How to avoid:** Always `await getIdToken()` before calling `setUser` and `setLoading`. The existing `useAuth` code already calls `setUser(u)` and `setLoading(false)` at the end of the callback — keep this order and insert the `await getIdToken()` call before them.

---

### Pitfall 3: Cookie Not Cleared on Sign-Out

**What goes wrong:** `signOut()` is called, Firebase Auth state clears, but `__session` cookie persists. On the next navigation, `withCMSAuth` reads the stale (now-invalid) token and calls `verifyIdToken` — which throws because the token was revoked, causing an unexpected redirect loop.

**Why it happens:** Cookie clearing requires explicitly setting `max-age=0` or an expired `expires` value. Simply not writing it doesn't clear it.

**How to avoid:** In the `onAuthStateChanged` callback, when `u === null`, set `document.cookie = '__session=; path=/; SameSite=Strict; max-age=0'`.

---

### Pitfall 4: "use client" Missing on Admin Components

**What goes wrong:** `AdminPanel` and `LoginPage` use React hooks (`useState`, `useEffect`). Without `"use client"` at the top of each file, Next.js App Router treats them as Server Components and throws at runtime because hooks are not allowed in Server Components.

**Why it happens:** The admin TSUP entry does NOT inject a banner (unlike the index entry). Individual admin component files must self-mark.

**How to avoid:** Add `"use client"` as the first line of every admin component file that uses hooks. The existing comment in `src/admin/index.js` line 2 confirms this is the established pattern.

---

### Pitfall 5: useAuth Called Outside CMSProvider

**What goes wrong:** `AdminPanel` calls `useAuth()`, which calls `useCMSFirebase()`, which throws `'useCMSFirebase must be used inside <CMSProvider>'` if the consumer hasn't wrapped their app in `<CMSProvider>`.

**Why it happens:** `useAuth` depends on `CMSContext` from `src/index.js`, which is populated by `<CMSProvider>`. This is a consumer configuration requirement.

**How to avoid:** This is expected behavior — the error message is already descriptive. Document in the admin shell that `<CMSProvider>` must wrap the app. No code change needed.

---

## Code Examples

### Verified Pattern: `document.cookie` string format

```javascript
// Source: MDN Web Docs — document.cookie
// Write: token present
document.cookie = `__session=${token}; path=/; SameSite=Strict`

// Clear: token absent (sign-out)
document.cookie = '__session=; path=/; SameSite=Strict; max-age=0'
```

**Note:** `SameSite=Strict` is correct for same-origin admin pages. No `Secure` flag is needed in the cookie string — the consumer's Next.js app handles HTTPS at the server level. However, if the consumer runs on HTTPS (production), adding `; Secure` is good practice. This falls under Claude's discretion.

### Verified Pattern: Loading spinner (CSS-only, no dependency)

```javascript
// Inline CSS keyframe — zero dependencies, scoped to jeeby-cms-admin
// Phase 8 will replace with proper CSS; Phase 4 uses minimal functional styles
const spinnerStyle = {
  display: 'inline-block',
  width: '1em',
  height: '1em',
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: 'jeeby-spin 0.6s linear infinite',
}
// Inject keyframes once via a <style> tag or CSS class
```

### Verified Pattern: accessible form error announcement

```javascript
// WCAG 4.1.3 Status Messages — role="alert" announces error without focus move
createElement('p', {
  role: 'alert',
  'aria-live': 'polite',
  style: { color: 'red' },  // Phase 8 will replace with CSS class
}, error)
```

### Verified Pattern: disabled button during loading

```javascript
createElement('button', {
  type: 'submit',
  disabled: submitting,
  'aria-busy': submitting ? 'true' : undefined,
}, submitting ? 'Signing in…' : 'Sign in')
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sessionCookie` API (firebase-admin) | Plain ID token in `__session` | User decision (CONTEXT.md) | Simpler: no Admin SDK call on every cookie issue; `verifyIdToken` accepts ID tokens directly |
| Redux / Context for auth state | `onAuthStateChanged` + `useState` | React 16.8 hooks era | Established in this codebase already |

**Deprecated/outdated:**
- `setPersistence()` call: deliberately excluded (firebase-js-sdk#9319 — wipes existing auth state). Confirmed in STATE.md decision log.

---

## Open Questions

1. **`Secure` flag on `__session` cookie**
   - What we know: `SameSite=Strict` is locked. `Secure` flag is Claude's discretion.
   - What's unclear: Should Phase 4 add `; Secure` unconditionally, or only when `location.protocol === 'https:'`?
   - Recommendation: Add `; Secure` conditionally — `document.location.protocol === 'https:' ? '; Secure' : ''`. This avoids breaking localhost dev while protecting production.

2. **`AdminNav` as separate component or inline in `AdminPanel`**
   - What we know: Claude's discretion per CONTEXT.md.
   - What's unclear: Phase 5 (Page Manager) will likely need to interact with the nav (e.g., breadcrumbs or section tabs). A separate `AdminNav` component is more extensible.
   - Recommendation: Extract `AdminNav` as `src/admin/AdminNav.js` — small cost now, avoids refactor in Phase 5.

3. **`children` prop vs hard-coded `null` placeholder in admin shell**
   - What we know: CONTEXT.md says "Phase 5 fills [main content area] with Page Manager."
   - What's unclear: Should `AdminPanel` accept a `children` prop now, or hard-code `null`?
   - Recommendation: Accept `children` prop and render it in `<main>`. Phase 5 can then pass `<PageManager>` as a child without modifying `AdminPanel`. Zero extra complexity in Phase 4.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none — invoked via `npm test` script |
| Quick run command | `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js'` |
| Full suite command | `npm test` (runs `src/**/*.test.js`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `AdminPanel` renders `LoginPage` when `user === null && !loading` | unit (renderToStaticMarkup) | `npm test -- --test-name-pattern "AdminPanel"` | ❌ Wave 0 |
| AUTH-01 | `AdminPanel` renders spinner when `loading === true` | unit (renderToStaticMarkup) | `npm test -- --test-name-pattern "AdminPanel"` | ❌ Wave 0 |
| AUTH-01 | `AdminPanel` renders admin shell when `user` is truthy | unit (renderToStaticMarkup) | `npm test -- --test-name-pattern "AdminPanel"` | ❌ Wave 0 |
| AUTH-02 | `withCMSAuth` middleware redirects when no `__session` cookie | unit (existing) | `npm test` | ✅ (existing logic tested) |
| AUTH-02 | `__session` cookie is set after successful sign-in (integration) | manual | — | manual-only |
| AUTH-03 | `useAuth` exports `{ user, loading, signIn, signOut }` | shape check | `npm test -- --test-name-pattern "useAuth"` | ❌ Wave 0 |
| AUTH-03 | `useAuth` cookie write: sets `__session` when `onAuthStateChanged` fires with user | unit (mock) | `npm test -- --test-name-pattern "useAuth"` | ❌ Wave 0 |
| AUTH-03 | `useAuth` cookie clear: clears `__session` when `onAuthStateChanged` fires `null` | unit (mock) | `npm test -- --test-name-pattern "useAuth"` | ❌ Wave 0 |

**Manual-only justification (AUTH-02 cookie integration):** Verifying that the actual `__session` cookie reaches `withCMSAuth` requires a running Next.js server and a Firebase Auth instance. This cannot be automated with the Node.js test runner alone.

### Sampling Rate

- **Per task commit:** `node --import ./scripts/test-register.js --experimental-test-module-mocks --test 'src/admin/*.test.js' 'src/index.test.js'`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/admin/AdminPanel.test.js` — covers AUTH-01 (three render states)
- [ ] `src/admin/LoginPage.test.js` — covers AUTH-01 (form renders, error display, button disabled state)
- [ ] `src/index.test.js` additions — covers AUTH-03 cookie write/clear behavior (needs `mock.module` for `document.cookie`)

*(Existing `src/firebase/auth.test.js` covers the Firebase helpers — no new tests needed there.)*

---

## Sources

### Primary (HIGH confidence)

- Direct source code inspection: `src/index.js`, `src/admin/index.js`, `src/firebase/auth.js`, `src/firebase/init.js`, `src/firebase/admin.js` — current implementation state confirmed
- `tsup.config.js` — confirmed JSX transform config for admin entry, `splitting: true`, no banner
- `package.json` — confirmed peer deps, test command with `--experimental-test-module-mocks`
- `.planning/phases/04-admin-auth/04-CONTEXT.md` — all locked decisions sourced from here
- `.planning/STATE.md` — decision log entries for `setPersistence`, JSX transform, `React.createElement` in tests

### Secondary (MEDIUM confidence)

- MDN Web Docs `document.cookie` — `max-age=0` pattern for cookie clearing; `SameSite=Strict` behavior

### Tertiary (LOW confidence)

- None — all claims derive from direct code inspection or explicit CONTEXT.md decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libs are already present as peer deps; no new packages needed
- Architecture: HIGH — implementation is direct code inspection + locked CONTEXT.md decisions
- Pitfalls: HIGH — most derive from existing codebase patterns (test runner JSX constraint, cookie clearing, `undefined` vs `null` auth state) confirmed in source files
- Test architecture: HIGH — test patterns confirmed by inspecting Title.test.js and auth.test.js

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (stable domain — Firebase Auth API, React hooks, document.cookie are stable; review if Firebase JS SDK major version changes)
