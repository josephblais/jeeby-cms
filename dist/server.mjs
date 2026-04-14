import { NextResponse } from 'next/server';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// src/server/index.js
function getAdminApp() {
  var _a;
  if (getApps().length > 0) return getApp();
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Env vars serialize PEM newlines as literal \n — restore real newlines
      privateKey: (_a = process.env.FIREBASE_ADMIN_PRIVATE_KEY) == null ? void 0 : _a.replace(/\\n/g, "\n")
    })
  });
}
function getAdminAuth() {
  return getAuth(getAdminApp());
}
function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

// src/server/index.js
function withCMSAuth() {
  return async function middleware(request) {
    var _a;
    const sessionCookie = (_a = request.cookies.get("__session")) == null ? void 0 : _a.value;
    if (!sessionCookie) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.verifyIdToken(sessionCookie);
      return NextResponse.next();
    } catch {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  };
}
async function getCMSContent(slug) {
  const db = getAdminFirestore();
  const snap = await db.doc("pages/" + slug).get();
  if (!snap.exists) return null;
  const pageData = snap.data();
  return (pageData == null ? void 0 : pageData.published) ?? null;
}
async function getCollectionContent(slug) {
  const db = getAdminFirestore();
  const [contentSnap, entriesSnap] = await Promise.all([
    db.doc("pages/" + slug).get(),
    db.collection("pages").where("parentSlug", "==", slug).orderBy("updatedAt", "desc").get()
  ]);
  const pageData = contentSnap.exists ? contentSnap.data() : null;
  return {
    content: (pageData == null ? void 0 : pageData.published) ?? null,
    entries: entriesSnap.docs.map((d) => ({ slug: d.id, ...d.data() }))
  };
}
async function getCollectionPages(parentSlug) {
  const db = getAdminFirestore();
  const snap = await db.collection("pages").where("parentSlug", "==", parentSlug).orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => ({ slug: d.id, ...d.data() }));
}

export { getCMSContent, getCollectionContent, getCollectionPages, withCMSAuth };
