---
date: "2026-03-19 00:00"
promoted: false
---

Page collections / index pattern: instead of admins manually typing sub-routes like /blog/my-post, allow pages to be scoped under a parent "index" page (e.g. a Blog page that lists all pages under /blog/*, or /albums listing all /albums/*). The parent page would be a collection index; child pages would auto-scope their slug under it. Useful for blogs, album catalogs, portfolios, etc. Admin UI would let you pick a parent collection when creating a page rather than typing the full path manually.
