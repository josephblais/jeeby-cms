"use client"
import { useState, useEffect, useRef } from 'react'
import { useCMSFirebase } from '../index.js'
import { savePage, validateSlug, listPages } from '../firebase/firestore.js'
import { ModalShell } from './ModalShell.js'

export function CreatePageModal({ open, onClose, onCreated, triggerRef }) {
  const { db, templates } = useCMSFirebase()

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
        setSlugError(`Slug does not match the ${selectedTemplate.name} pattern.`)
      }
    }, 300)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Immediate validation (not debounced)
    const selectedTemplate = templates.find(t => t.name === template)
    if (selectedTemplate && !validateSlug(selectedTemplate.pattern, slug)) {
      setSlugError(`Slug does not match the ${selectedTemplate.name} pattern.`)
      return
    }
    // Check slug uniqueness
    setSubmitting(true)
    try {
      const existing = await listPages(db)
      if (existing.some(p => p.slug === slug)) {
        setSlugError('That slug is already in use. Choose a different one.')
        setSubmitting(false)
        return
      }
      await savePage(db, slug, {
        name,
        slug,
        template: selectedTemplate?.name || null,
        draft: { blocks: [] },
        published: { blocks: [] }
      })
      onCreated()
      onClose()
    } catch (err) {
      setSlugError(err.message || 'Failed to create page.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell open={open} labelId="create-modal-heading" triggerRef={triggerRef} onClose={onClose}>
      <h2 id="create-modal-heading">Create New Page</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Name field */}
        <div className="jeeby-cms-field">
          <label htmlFor="cms-page-name">Page name</label>
          <input id="cms-page-name" type="text" required value={name}
            onChange={e => {
              setName(e.target.value)
              if (!slugTouched) handleSlugChange(toKebabSlug(e.target.value))
            }} />
        </div>
        {/* Slug field */}
        <div className="jeeby-cms-field">
          <label htmlFor="cms-page-slug">Slug</label>
          <input id="cms-page-slug" type="text" required value={slug}
            onChange={e => { setSlugTouched(true); handleSlugChange(e.target.value) }}
            aria-describedby="cms-slug-hint cms-slug-error" />
          <p id="cms-slug-hint">e.g. /about or /blog/my-post</p>
          {slugError && <p id="cms-slug-error" role="alert" className="jeeby-cms-inline-error">{slugError}</p>}
        </div>
        {/* Template dropdown — hidden when no templates */}
        {templates.length > 0 && (
          <div className="jeeby-cms-field">
            <label htmlFor="cms-page-template">Template</label>
            <select id="cms-page-template" value={template} onChange={e => setTemplate(e.target.value)}>
              <option value="">Select a template</option>
              {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
        )}
        {/* Buttons */}
        <div className="jeeby-cms-modal-actions">
          <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}>Discard</button>
          <button type="submit" className="jeeby-cms-btn-primary" disabled={submitting} aria-busy={submitting ? 'true' : undefined}
            style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}>Create Page</button>
        </div>
      </form>
    </ModalShell>
  )
}
