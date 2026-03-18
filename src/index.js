// src/index.js — client entry
// NOTE: No "use client" directive here. TSUP's banner option injects it at the top of
// dist/index.mjs and dist/index.js. Adding it here AND the banner would duplicate it.

import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { initFirebase } from './firebase/init.js'
import { signIn as _signIn, signOut as _signOut, subscribeToAuthState } from './firebase/auth.js'

const CMSContext = createContext(null)

export function CMSProvider({ firebaseConfig, children }) {
  // useMemo prevents re-initializing Firebase on every render.
  // initFirebase itself is idempotent via getApps() guard, but useMemo avoids
  // the overhead of calling getFirestore/getAuth/getStorage on every render.
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig])
  return <CMSContext.Provider value={firebase}>{children}</CMSContext.Provider>
}

export function useCMSFirebase() {
  const ctx = useContext(CMSContext)
  if (!ctx) throw new Error('useCMSFirebase must be used inside <CMSProvider>')
  return ctx
}

export function useAuth() {
  const { auth } = useCMSFirebase()
  const [user, setUser] = useState(undefined) // undefined = loading; null = signed out; User = signed in
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // subscribeToAuthState returns an unsubscribe function — return it for cleanup.
    // This prevents the onAuthStateChanged listener from leaking on unmount or
    // during React Strict Mode double-invoke cycles.
    const unsubscribe = subscribeToAuthState(auth, async (u) => {
      if (u) {
        const token = await u.getIdToken()
        const secure = typeof document !== 'undefined' && document.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `__session=${token}; path=/; SameSite=Strict${secure}`
      } else {
        document.cookie = '__session=; path=/; SameSite=Strict; max-age=0'
      }
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [auth])

  return {
    user,
    loading,
    signIn: (email, password) => _signIn(auth, email, password),
    signOut: () => _signOut(auth),
  }
}

export function useCMSContent(slug) {
  const { db } = useCMSFirebase()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug || !db) return
    setLoading(true)
    const ref = doc(db, 'pages', slug)
    // onSnapshot returns the unsubscribe function directly.
    // Return it from useEffect for automatic cleanup on unmount or slug change.
    // Client SDK: snap.exists() is a METHOD (with parentheses) — opposite of Admin SDK.
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setLoading(false)
        // Only expose published data — never draft. null if page missing.
        setData(snap.exists() ? (snap.data()?.published ?? null) : null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe  // React useEffect cleanup: calls unsubscribe() on unmount
  }, [db, slug])

  return { data, loading, error }
}

// Block components — implemented in src/blocks/
export { Blocks, Block } from './blocks/index.js'
