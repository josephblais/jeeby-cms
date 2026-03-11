// src/firebase/admin.js
// Firebase Admin SDK initialisation for server-side use.
// CRITICAL: This file is imported ONLY from src/admin/index.js.
// It must NEVER be imported from src/index.js or any client-side module.
// firebase-admin uses Node.js built-ins (fs, net, tls) that are not available in the browser.
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminApp() {
  if (getApps().length > 0) return getApp()
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Env vars serialize PEM newlines as literal \n — restore real newlines
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp())
}
