// src/index.js — client entry
// NOTE: No "use client" directive here. TSUP's banner option injects it at the top of
// dist/index.mjs and dist/index.js. Adding it here AND the banner would duplicate it.

import React, { createContext, useContext, useMemo } from 'react'
import { initFirebase } from './firebase/init.js'

const CMSContext = createContext(null)

export function CMSProvider({ firebaseConfig, children }) {
  // useMemo prevents re-initializing Firebase on every render.
  // initFirebase itself is idempotent via getApps() guard, but useMemo avoids
  // the overhead of calling getFirestore/getAuth/getStorage on every render.
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  return React.createElement(
    CMSContext.Provider,
    { value: firebase },
    children
  )
}

export function useCMSFirebase() {
  const ctx = useContext(CMSContext)
  if (!ctx) throw new Error('useCMSFirebase must be used inside <CMSProvider>')
  return ctx
}

// Phase 3 will implement these stubs:
export function Blocks() {
  return null
}

export function Block() {
  return null
}

export function useCMSContent() {
  return null
}
