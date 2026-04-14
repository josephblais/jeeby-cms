"use client"

import { useRef } from 'react'
import { useCMSFirebase } from '../index.js'

// LocaleSwitcher — bilingual content language tab bar.
// ACCESSIBILITY: WCAG 4.1.2 (tablist + tab roles + aria-selected),
//   2.1.1 (keyboard — Arrow keys swap locales via roving tabindex pattern),
//   1.3.1 (aria-label provides programmatic context for the tab group).
//
// Renders NOTHING when isLocalized is false — D-04 / D-06 guarantee zero UI
// leak into monolingual mode.
//
// Context dependency: useCMSFirebase() must return { isLocalized, locale, setLocale }.
// Those three keys are added to the context value in Plan 02 (CMSProvider).
export function LocaleSwitcher() {
  const { isLocalized, locale, setLocale } = useCMSFirebase()
  const enRef = useRef(null)
  const frRef = useRef(null)

  if (!isLocalized) return null

  function handleKeyDown(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setLocale('fr')
      frRef.current?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setLocale('en')
      enRef.current?.focus()
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Content language"
      className="jeeby-cms-locale-switcher"
    >
      <button
        ref={enRef}
        type="button"
        role="tab"
        aria-selected={locale === 'en'}
        tabIndex={locale === 'en' ? 0 : -1}
        onClick={() => setLocale('en')}
        onKeyDown={handleKeyDown}
        className="jeeby-cms-locale-tab"
      >
        EN
      </button>
      <button
        ref={frRef}
        type="button"
        role="tab"
        aria-selected={locale === 'fr'}
        tabIndex={locale === 'fr' ? 0 : -1}
        onClick={() => setLocale('fr')}
        onKeyDown={handleKeyDown}
        className="jeeby-cms-locale-tab"
      >
        FR
      </button>
    </div>
  )
}

export default LocaleSwitcher
