"use client"
import { useState, useEffect, useRef } from 'react'
import { useCMSFirebase } from '../index.js'
import { savePage, validateSlug, listPages } from '../firebase/firestore.js'
import { ModalShell } from './ModalShell.js'
import { useT, tf } from './useT.js'

export function CreatePageModal({ open, onClose, onCreated, triggerRef }) {
  const { db, templates } = useCMSFirebase()
  const t = useT()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [template, setTemplate] = useState('')
  const [slugError, setSlugError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [pageType, setPageType] = useState('page')        // D-07: 'page' | 'collection'
  const [parentSlug, setParentSlug] = useState('')         // '' means top-level
  const [existingPages, setExistingPages] = useState([])   // cache for parent picker + uniqueness
  const [pagesLoadError, setPagesLoadError] = useState(null)

  const debounceRef = useRef(null)

  function toKebabSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  // Reset form state when modal opens + eager listPages for parent picker and uniqueness check
  useEffect(() => {
    if (open) {
      setName('')
      setSlug('')
      setSlugTouched(false)
      setTemplate('')
      setSlugError(null)
      setSubmitting(false)
      setPageType('page')
      setParentSlug('')
      setExistingPages([])
      setPagesLoadError(null)
      let cancelled = false
      listPages(db)
        .then(pages => { if (!cancelled) setExistingPages(pages) })
        .catch(err => { if (!cancelled) setPagesLoadError(err.message || 'Failed to load pages') })
      return () => { cancelled = true }
    }
  }, [open])

  function handleSlugChange(val) {
    setSlug(val)
    setSlugError(null)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!val) return
      const selectedTemplate = templates.find(t => t.name === template)
      if (selectedTemplate && !validateSlug(selectedTemplate.pattern, val)) {
        setSlugError(tf(t('slugPatternError'), { template: selectedTemplate.name }))
      }
    }, 300)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const selectedTemplate = templates.find(t => t.name === template)
    // Validate leaf slug against template pattern (unchanged — applies to leaf only)
    if (selectedTemplate && !validateSlug(selectedTemplate.pattern, slug)) {
      setSlugError(tf(t('slugPatternError'), { template: selectedTemplate.name }))
      return
    }

    setSubmitting(true)
    try {
      // Reuse the cached existingPages from the eager [open] fetch — no extra network call.
      // Fall back to a live listPages() if for some reason the cache is empty.
      const existing = existingPages.length > 0 ? existingPages : await listPages(db)

      // D-13: compare FULL DERIVED PATH, not bare slug.
      // Full path for a new page: parentSlug ? `${parentSlug}/${slug}` : slug
      // Full path for an existing page: p.parentSlug ? `${p.parentSlug}/${p.slug}` : p.slug
      const newFullPath = parentSlug ? `${parentSlug}/${slug}` : slug
      const clash = existing.some(p => {
        const existingPath = p.parentSlug ? `${p.parentSlug}/${p.slug}` : p.slug
        return existingPath === newFullPath
      })
      if (clash) {
        setSlugError(t('slugInUse'))
        setSubmitting(false)
        return
      }

      // D-01: Firestore doc ID is the LEAF slug only — never includes slashes.
      // D-03/D-04: pageType + isCollectionIndex on collection, parentSlug on entries
      const payload = {
        name,
        slug,
        pageType,
        template: selectedTemplate?.name || null,
        draft: { blocks: [] },
        published: { blocks: [] },
        ...(pageType === 'collection'
          ? { isCollectionIndex: true }
          : { parentSlug: parentSlug || null }
        ),
      }
      await savePage(db, slug, payload)
      onCreated()
      onClose()
    } catch (err) {
      setSlugError(err.message || t('failedToLoadPages'))
    } finally {
      setSubmitting(false)
    }
  }

  // Derived values for parent picker and slug hint
  const collections = existingPages.filter(p => p.pageType === 'collection')
  const fullPath = parentSlug ? `${parentSlug}/${slug}` : slug

  return (
    <ModalShell open={open} labelId="create-modal-heading" triggerRef={triggerRef} onClose={onClose}>
      <h2 id="create-modal-heading">{t('createNewPage')}</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Name field */}
        <div className="jeeby-cms-field">
          <label htmlFor="cms-page-name">{t('pageNameLabel')}</label>
          <input id="cms-page-name" type="text" required value={name}
            onChange={e => {
              setName(e.target.value)
              if (!slugTouched) handleSlugChange(toKebabSlug(e.target.value))
            }} />
        </div>
        {/* Page type selector — D-07, D-08 */}
        <div className="jeeby-cms-field">
          <label htmlFor="cms-page-type">{t('pageTypeLabel')}</label>
          <select
            id="cms-page-type"
            value={pageType}
            onChange={e => {
              setPageType(e.target.value)
              // Collections are always top-level — clear parentSlug when switching (D-12)
              if (e.target.value === 'collection') setParentSlug('')
            }}
          >
            <option value="page">{t('pageOption')}</option>
            <option value="collection">{t('collectionOption')}</option>
          </select>
        </div>
        {/* Parent collection picker — only for Page type (D-09, D-12) */}
        {pageType === 'page' && collections.length > 0 && (
          <div className="jeeby-cms-field">
            <label htmlFor="cms-parent-collection">{t('parentCollection')}</label>
            <select
              id="cms-parent-collection"
              value={parentSlug}
              onChange={e => setParentSlug(e.target.value)}
            >
              <option value="">{t('noneTopLevel')}</option>
              {collections.map(c => (
                <option key={c.slug} value={c.slug}>/{c.slug}</option>
              ))}
            </select>
          </div>
        )}
        {/* Slug field — D-10: split prefix+leaf when parent is selected */}
        <div className="jeeby-cms-field">
          <label htmlFor="cms-page-slug">{t('slugLabel')}</label>
          {parentSlug ? (
            <div className="jeeby-cms-slug-prefixed">
              <span className="jeeby-cms-slug-prefix" aria-hidden="true">/{parentSlug}/</span>
              <input
                id="cms-page-slug"
                type="text"
                required
                value={slug}
                aria-label={`Slug leaf segment (full path will be /${parentSlug}/${slug || 'my-slug'})`}
                aria-describedby="cms-slug-hint cms-slug-error"
                onChange={e => { setSlugTouched(true); handleSlugChange(e.target.value) }}
              />
            </div>
          ) : (
            <input
              id="cms-page-slug"
              type="text"
              required
              value={slug}
              aria-describedby="cms-slug-hint cms-slug-error"
              onChange={e => { setSlugTouched(true); handleSlugChange(e.target.value) }}
            />
          )}
          <p id="cms-slug-hint">
            {parentSlug
              ? tf(t('fullPathHint'), { path: `${parentSlug}/${slug || 'my-slug'}` })
              : t('slugHint')}
          </p>
          {slugError && <p id="cms-slug-error" role="alert" className="jeeby-cms-inline-error">{slugError}</p>}
        </div>
        {/* Template dropdown — hidden when no templates */}
        {templates.length > 0 && (
          <div className="jeeby-cms-field">
            <label htmlFor="cms-page-template">{t('templateLabel')}</label>
            <select id="cms-page-template" value={template} onChange={e => setTemplate(e.target.value)}>
              <option value="">{t('selectTemplate')}</option>
              {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
        )}
        {/* Buttons */}
        <div className="jeeby-cms-modal-actions">
          <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}>{t('discard')}</button>
          <button type="submit" className="jeeby-cms-btn-primary" disabled={submitting} aria-busy={submitting ? 'true' : undefined}
            style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}>{t('createPage')}</button>
        </div>
      </form>
    </ModalShell>
  )
}
