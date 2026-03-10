// src/index.js — client entry
// NOTE: No "use client" directive here. TSUP's banner option injects it at the top of dist/index.mjs and dist/index.js.
// Adding it here AND having the banner would duplicate it. The banner approach is correct for library packages.

export function CMSProvider({ children }) {
  return children ?? null
}

export function Blocks() {
  return null
}

export function Block() {
  return null
}

export function useCMSContent() {
  return null
}
