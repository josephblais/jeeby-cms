"use client"
import { useState, useEffect, useRef } from 'react'
import { useCMSFirebase } from '../index.js'
import { savePage, validateSlug, listPages } from '../firebase/firestore.js'

export function CreatePageModal({ open, onClose, onCreated, triggerRef }) {
  const { db, templates } = useCMSFirebase()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [template, setTemplate] = useState('')
  const [slugError, setSlugError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debounceRef = useRef(null)
  const dialogRef = useRef(null)

  // Focus management: focus first input on open, return focus on close
  useEffect(() => {
    if (open) {
      // Focus the first focusable element (name input) when modal opens
      const input = dialogRef.current?.querySelector('input, button, select, textarea')
      if (input) input.focus()
    } else {
      // Return focus to trigger button on close
      triggerRef?.current?.focus()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form state when modal opens
  useEffect(() => {
    if (open) {
      setName('')
      setSlug('')
      setTemplate('')
      setSlugError(null)
      setSubmitting(false)
    }
  }, [open])

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key !== 'Tab') return
    const focusable = dialogRef.current.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus()
    }
  }

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

  if (!open) return null
  return (
    <div className="jeeby-cms-modal-backdrop" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="create-modal-heading"
        className="jeeby-cms-modal-card" onKeyDown={handleKeyDown}
        style={{ maxWidth: '480px', width: '100%', padding: '32px', background: '#fff', borderRadius: '8px' }}>
        <h2 id="create-modal-heading" style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 24px' }}>Create New Page</h2>
        <form onSubmit={handleSubmit} noValidate>
          {/* Name field */}
          <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
            <label htmlFor="cms-page-name" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Page name</label>
            <input id="cms-page-name" type="text" required value={name} onChange={e => setName(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 16px', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '14px' }} />
          </div>
          {/* Slug field */}
          <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
            <label htmlFor="cms-page-slug" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Slug</label>
            <input id="cms-page-slug" type="text" required value={slug} onChange={e => handleSlugChange(e.target.value)}
              aria-describedby="cms-slug-hint cms-slug-error"
              style={{ display: 'block', width: '100%', padding: '8px 16px', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '14px' }} />
            <p id="cms-slug-hint" style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>e.g. /about or /blog/my-post</p>
            {slugError && <p id="cms-slug-error" role="alert" className="jeeby-cms-inline-error" style={{ color: '#DC2626', fontSize: '14px', margin: '4px 0 0' }}>{slugError}</p>}
          </div>
          {/* Template dropdown — hidden when no templates */}
          {templates.length > 0 && (
            <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
              <label htmlFor="cms-page-template" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Template</label>
              <select id="cms-page-template" value={template} onChange={e => setTemplate(e.target.value)}
                style={{ display: 'block', width: '100%', padding: '8px 16px', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '14px', minHeight: '44px' }}>
                <option value="">Select a template</option>
                {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          )}
          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
            <button type="button" className="jeeby-cms-btn-ghost" onClick={onClose}
              style={{ minHeight: '44px', padding: '8px 16px', background: 'none', border: '1px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Discard</button>
            <button type="submit" className="jeeby-cms-btn-primary" disabled={submitting} aria-busy={submitting ? 'true' : undefined}
              style={{ minHeight: '44px', padding: '8px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '4px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontSize: '14px' }}>Create Page</button>
          </div>
        </form>
      </div>
    </div>
  )
}
