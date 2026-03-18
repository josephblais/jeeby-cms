# jeeby-cms

Block-based CMS for Next.js — Firebase, drag-and-drop, draft/publish.

> **Work in progress.** Not yet published to npm.

---

## Installation

```bash
npm install jeeby-cms
```

### Peer dependencies

```bash
npm install firebase firebase-admin react react-dom next
```

---

## Setup

### 1. Wrap your app with CMSProvider

In `app/layout.js` (App Router) or `pages/_app.js` (Pages Router):

```js
import { CMSProvider } from 'jeeby-cms'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CMSProvider firebaseConfig={{
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }}>
          {children}
        </CMSProvider>
      </body>
    </html>
  )
}
```

### 2. Add the admin pages

Create `app/admin/page.js` (page manager):

```js
import { AdminPanel } from 'jeeby-cms/admin'

export default function AdminPage() {
  return <AdminPanel />
}
```

Create `app/admin/pages/[slug]/page.js` (block editor):

```js
import { AdminPanel, PageEditor } from 'jeeby-cms/admin'

export default async function PageEditorPage({ params }) {
  const { slug } = await params
  return (
    <AdminPanel>
      <PageEditor slug={slug} />
    </AdminPanel>
  )
}
```

`AdminPanel` handles three states automatically: loading, unauthenticated (shows login form), and authenticated (shows its children — or the page manager when no children are passed).

### 3. Protect admin routes with middleware

Create `proxy.js` at the root of your project (Next.js 16+) or `middleware.js` for earlier versions:

```js
import { withCMSAuth } from 'jeeby-cms/server'

export const runtime = 'nodejs'

export const middleware = withCMSAuth()

export const config = {
  matcher: ['/admin/:path+'],
}
```

`runtime = 'nodejs'` is required because `firebase-admin` uses Node.js built-ins that are unavailable in the Edge Runtime.

This reads the `__session` cookie set by the login form and redirects unauthenticated requests to `/admin/login`.

### 4. Add Firebase Admin credentials

`withCMSAuth` and server-side data fetching require Firebase Admin SDK credentials. Add to your environment:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

Generate a service account key in Firebase Console → Project Settings → Service accounts.

---

## Rendering CMS content

In a Server Component:

```js
import { getCMSContent } from 'jeeby-cms/server'

export default async function Page({ params }) {
  const content = await getCMSContent(params.slug)
  if (!content) return <p>Page not found</p>
  // render blocks...
}
```

`getCMSContent` returns the published version of a page, never draft content.

---

## Firebase Console setup

1. Enable **Email/Password** sign-in: Authentication → Sign-in method
2. Create an admin user: Authentication → Users → Add user
3. Set up Firestore with a `pages` collection for CMS content
4. Enable Storage if using media uploads

### Firestore security rules

The CMS reads and writes to a `pages` collection. Add these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pages/{slug} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This allows anyone to read published content and only authenticated users to write. Tighten as needed for your project.
