// src/utils/resolveLocale.js
// Resolves a field value that may be a plain string or a { en, fr } locale object.
// Always falls back to 'en' if the requested locale has no content.
// Returns '' for null / undefined to prevent rendering `undefined` in block output.
export function resolveLocale(value, locale = 'en') {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return value
  return value[locale] || value['en'] || ''
}
