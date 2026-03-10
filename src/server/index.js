// src/server/index.js — server entry
// INTENTIONALLY has no "use client" directive. This entry is safe to import in Next.js Server Components.
// useCMSContent (hook) lives in src/index.js because hooks require "use client".

export async function getCMSContent(_slug) {
  return null
}
