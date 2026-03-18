# Phase 4: Admin Auth - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Gate the admin panel behind Firebase Auth. Unauthenticated requests see LoginPage (email/password form). Authenticated requests see a minimal admin shell (nav + placeholder). The `useAuth` hook and all Firebase auth helpers are already implemented in Phase 2/3 — Phase 4 wires them into AdminPanel and LoginPage components, and closes the session cookie gap in `withCMSAuth`.

</domain>

<decisions>
## Implementation Decisions

### Session Cookie Strategy
- After `signIn()` succeeds, call `user.getIdToken()` and set `document.cookie = '__session=' + token + '; path=/; SameSite=Strict'`
- ID token approach — `withCMSAuth` already calls `verifyIdToken`, which accepts ID tokens directly (no session cookie API needed)
- Token refresh: handled inside the `useAuth` hook — Firebase SDK auto-refreshes the ID token every hour and fires `onAuthStateChanged` again; the hook's callback calls `user.getIdToken()` and updates the `__session` cookie automatically
- Cookie is cleared on sign-out (set empty/expired value)

### Login Form UX
- Centered card layout on a neutral background: "jeeby CMS" heading at top, email field, password field, submit button, error area below button
- Error display: single inline message below the submit button (e.g. "Invalid email or password.") — no per-field errors
- Loading state: spinner inside the submit button while the sign-in request is in flight; button is disabled during loading
- Card layout is designed to be extensible for a future "create user" page (same card, different content)

### Admin Shell (Post-login)
- Minimal nav bar at the top: app name ("jeeby CMS") on the left, "Sign out" button on the right
- Main content area below nav is a placeholder — Phase 5 fills it with Page Manager
- Loading state (while `useAuth` resolves): show a spinner or skeleton rather than a blank screen, to prevent flash of login form for authenticated users

### Sign-out
- "Sign out" button lives in the top-right of the nav bar — visible, no dropdown
- After sign-out: `useAuth` state clears to `null`, `AdminPanel` re-renders to `LoginPage` automatically — no explicit router redirect needed
- `__session` cookie cleared on sign-out

### Claude's Discretion
- Exact CSS classes and visual styling for the login card and nav bar (Phase 8 does full CSS — Phase 4 uses minimal inline or class-based styles sufficient for function)
- Spinner implementation (inline SVG, CSS animation, or a tiny utility)
- Exact `document.cookie` string format beyond `path=/; SameSite=Strict`
- Whether nav bar is its own component (`AdminNav`) or inline in `AdminPanel`

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Requirements (inline)
- AUTH-01: AdminPanel shows LoginPage when unauthenticated
- AUTH-02: `withCMSAuth` middleware redirects unauthenticated requests from `/admin/*`
- AUTH-03: `useAuth` hook exposes current user and sign-out function

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.js` — `useAuth()` fully implemented: returns `{ user, loading, signIn, signOut }`. Phase 4 consumes this, does not rebuild it. Token refresh logic needs to be added here (update `__session` cookie in the `onAuthStateChanged` callback).
- `src/firebase/auth.js` — `signIn`, `signOut`, `subscribeToAuthState` all implemented. No changes needed.
- `src/admin/index.js` — `withCMSAuth` middleware already implemented: reads `__session` cookie, calls `verifyIdToken`. No changes needed to middleware logic. `AdminPanel` is a stub returning `null` — this is what Phase 4 replaces.
- `src/firebase/init.js` — `getFirebaseInstances()` available for any component that needs Firebase without going through context.

### Established Patterns
- JavaScript only (no TypeScript for v1)
- "use client" injected by TSUP banner on index entry — admin components self-mark with "use client" at the top of individual files
- Error handling: helpers throw, callers use try/catch (no custom error wrapper classes)
- Firebase is a peer dependency — import via `firebase/auth` etc., never bundle

### Integration Points
- `AdminPanel` in `src/admin/index.js` is the entry point — it mounts auth state check and renders either `LoginPage` or the admin shell
- `useAuth` in `src/index.js` needs the `__session` cookie update added to the `onAuthStateChanged` callback
- Phase 5 (Page Manager) will render inside the admin shell's main content area — Phase 4 should leave a clear `{children}` or slot for this

</code_context>

<specifics>
## Specific Ideas

- Login card layout: centered card, "jeeby CMS" at top, email/password fields, submit button, error message below — should be extensible for a future "Create user" page using the same card structure
- Loading state during auth resolution: prefer spinner/skeleton over blank screen to avoid flash of login form

</specifics>

<deferred>
## Deferred Ideas

- Create user / user management page — user noted the login card should be extensible for this. New capability; belongs in a future phase (post-v1 or a new admin-user-management phase).

</deferred>

---

*Phase: 04-admin-auth*
*Context gathered: 2026-03-17*
