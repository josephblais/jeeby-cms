// src/firebase/auth.js
// Firebase Auth helpers. All auth operations go through these functions.
// No other file in this package imports from 'firebase/auth' directly.
//
// Auth persistence: Firebase defaults to LOCAL persistence on web.
// setPersistence is deliberately NOT called — it is not idempotent and calling it
// wipes existing auth state from localStorage (firebase-js-sdk#9319).
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'

// Sign in with email and password. Returns the Firebase User object.
// Throws on invalid credentials (propagates raw Firebase error codes).
export async function signIn(auth, email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

// Sign out the current user. Returns the Firebase signOut promise.
export async function signOut(auth) {
  return firebaseSignOut(auth)
}

// Subscribe to auth state changes. Returns the unsubscribe function.
// Callers MUST call the returned function in useEffect cleanup to avoid memory leaks.
export function subscribeToAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback)
}
