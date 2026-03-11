// src/firebase/init.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Module-level refs — set once by initFirebase()
// In Next.js dev mode with Fast Refresh, modules may re-evaluate.
// The getApps() guard handles re-evaluation safely: if Firebase is already
// initialized, getApp() retrieves the existing instance.
let _app, _db, _auth, _storage

export function initFirebase(config) {
  _app = getApps().length === 0 ? initializeApp(config) : getApp()
  _db = getFirestore(_app)
  _auth = getAuth(_app)
  _storage = getStorage(_app)
  return { app: _app, db: _db, auth: _auth, storage: _storage }
}

export function getFirebaseInstances() {
  if (!_app) throw new Error('Firebase not initialized. Wrap your app in <CMSProvider>.')
  return { app: _app, db: _db, auth: _auth, storage: _storage }
}
