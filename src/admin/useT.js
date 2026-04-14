// src/admin/useT.js
// React-dependent i18n helpers. Kept separate from i18n.js so that
// i18n.test.js can import ADMIN_STRINGS without pulling in React/JSX.
import { useCMSFirebase } from '../index.js'
import { ADMIN_STRINGS } from './i18n.js'

// useT — returns a lookup function for the current uiLocale with EN fallback.
export function useT() {
  const { uiLocale } = useCMSFirebase()
  const strings = ADMIN_STRINGS[uiLocale] ?? ADMIN_STRINGS.en
  return (key) => strings[key] ?? ADMIN_STRINGS.en[key] ?? key
}

// tf — interpolates {{variable}} placeholders in a translated string.
// Usage: tf(t('deletePageBody'), { slug: 'my-page' })
export function tf(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''))
}

// BLOCK_DISPLAY_KEYS — maps block type → ADMIN_STRINGS key for human-readable name.
// Used by BlockGutter, UndoToast, and any component needing localised block type names.
export const BLOCK_DISPLAY_KEYS = {
  title: 'blockTitle',
  richtext: 'blockRichtext',
  image: 'blockTypeImage',
  video: 'blockTypeVideo',
  gallery: 'blockTypeGallery',
  list: 'blockList',
  pullquote: 'blockPullquote',
}
