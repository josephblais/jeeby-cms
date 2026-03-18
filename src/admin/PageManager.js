"use client"
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useCMSFirebase } from '../index.js'
import { listPages, renamePage, savePage, validateSlug } from '../firebase/firestore.js'
import { CreatePageModal } from './CreatePageModal.js'
import { DeletePageModal } from './DeletePageModal.js'

// Internal helper — not exported
function formatDate(ts) {
  if (!ts) return 'Never'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function PageManager() {
  const { db, templates } = useCMSFirebase()

  // Main page list state
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [announcement, setAnnouncement] = useState('')

  // Inline edit state
  const [editingSlug, setEditingSlug] = useState(null)
  const [editField, setEditField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState(null)

  // Refs for focus management and debounce
  const debounceRef = useRef(null)
  const newPageBtnRef = useRef(null)
  // editTriggerRef is set per-row to return focus after commit
  const editTriggerRefs = useRef({})

  // State variables for Plan 03 integration
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const deleteBtnRef = useRef(null)

  // Load pages from Firestore
  const loadPages = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listPages(db)
      setPages(result)
    } catch (err) {
      setError('Failed to load pages.')
    } finally {
      setLoading(false)
    }
  }, [db])

  useEffect(() => { loadPages() }, [loadPages])

  // Clear announcement after 3 seconds
  useEffect(() => {
    if (announcement) {
      const t = setTimeout(() => setAnnouncement(''), 3000)
      return () => clearTimeout(t)
    }
  }, [announcement])

  // --- Inline edit handlers ---

  function startEdit(slug, field, currentValue) {
    setEditingSlug(slug)
    setEditField(field)
    setEditValue(currentValue)
    setEditError(null)
  }

  function cancelEdit() {
    clearTimeout(debounceRef.current)
    setEditingSlug(null)
    setEditField(null)
    setEditValue('')
    setEditError(null)
  }

  function handleEditChange(val) {
    setEditValue(val)
    if (editField === 'slug') {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        // Find the page's template to get the pattern
        const page = pages.find(p => p.slug === editingSlug)
        const template = templates && page?.template
          ? templates.find(t => t.name === page.template)
          : null
        const pattern = template?.pattern ?? null
        if (!validateSlug(pattern, val)) {
          const templateName = template?.name ?? 'selected template'
          setEditError(`Slug does not match the ${templateName} pattern.`)
        } else {
          setEditError(null)
        }
      }, 300)
    }
  }

  async function commitEdit() {
    if (!editingSlug || !editField) return
    const trimmed = editValue.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }

    const currentSlug = editingSlug
    const currentField = editField

    try {
      if (currentField === 'name') {
        await savePage(db, currentSlug, { name: trimmed })
        await loadPages()
        setAnnouncement('Page renamed successfully.')
        // Clear announcement after a tick so it re-announces if triggered again
        setTimeout(() => setAnnouncement(''), 1000)
      } else if (currentField === 'slug') {
        // Immediate validation before save
        const page = pages.find(p => p.slug === currentSlug)
        const template = templates && page?.template
          ? templates.find(t => t.name === page.template)
          : null
        const pattern = template?.pattern ?? null
        if (!validateSlug(pattern, trimmed)) {
          const templateName = template?.name ?? 'selected template'
          setEditError(`Slug does not match the ${templateName} pattern.`)
          return
        }
        await renamePage(db, currentSlug, trimmed)
        await loadPages()
        setAnnouncement('Page renamed successfully.')
        setTimeout(() => setAnnouncement(''), 1000)
      }
      // Return focus to the edit trigger button for this field
      const refKey = `${currentSlug}-${currentField}`
      setEditingSlug(null)
      setEditField(null)
      setEditValue('')
      setEditError(null)
      // Focus the trigger button after state clears
      requestAnimationFrame(() => {
        editTriggerRefs.current[refKey]?.focus()
      })
    } catch (err) {
      const msg = currentField === 'slug'
        ? 'Rename failed. The old page may still exist -- check Firestore and try again.'
        : 'Save failed. Please try again.'
      setEditError(msg)
    }
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  // --- Render ---

  // Loading state (initial load with empty pages)
  if (loading && pages.length === 0) {
    return (
      <div className="jeeby-cms-page-manager">
        {/* Live region — always present */}
        <div className="jeeby-cms-live-region" aria-live="polite" aria-atomic="true" style={{
          position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
          clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
        }}>
          {announcement}
        </div>
        <div role="status" aria-label="Loading pages" style={{
          display: 'flex', justifyContent: 'center', padding: '48px 0'
        }}>
          <div aria-hidden="true" style={{
            width: '32px', height: '32px',
            border: '3px solid #2563EB', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'jeeby-spin 0.75s linear infinite'
          }} />
        </div>
      </div>
    )
  }

  // Empty state
  if (pages.length === 0 && !loading) {
    return (
      <div className="jeeby-cms-page-manager">
        {/* Live region */}
        <div className="jeeby-cms-live-region" aria-live="polite" aria-atomic="true" style={{
          position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
          clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
        }}>
          {announcement}
        </div>
        <div className="jeeby-cms-pages-empty" style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>No pages yet.</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px' }}>Create your first page.</p>
          <button
            ref={newPageBtnRef}
            type="button"
            className="jeeby-cms-btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{
              minHeight: '44px', padding: '8px 24px', background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
            }}
          >New Page</button>
        </div>
      </div>
    )
  }

  // Full table view
  return (
    <div className="jeeby-cms-page-manager">
      {/* Live region — always present, visually hidden */}
      <div className="jeeby-cms-live-region" aria-live="polite" aria-atomic="true" style={{
        position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
        clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
      }}>
        {announcement}
      </div>

      {/* Table header row: h2 + New Page button */}
      <div className="jeeby-cms-page-list-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Pages</h2>
        <button
          ref={newPageBtnRef}
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{
            minHeight: '44px', padding: '8px 24px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
          }}
        >New Page</button>
      </div>

      <table className="jeeby-cms-pages-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th scope="col" style={{
              textAlign: 'left', padding: '16px', fontSize: '14px',
              fontWeight: 600, borderBottom: '1px solid #E5E7EB'
            }}>Name</th>
            <th scope="col" style={{
              textAlign: 'left', padding: '16px', fontSize: '14px',
              fontWeight: 600, borderBottom: '1px solid #E5E7EB'
            }}>Slug</th>
            <th scope="col" style={{
              textAlign: 'left', padding: '16px', fontSize: '14px',
              fontWeight: 600, borderBottom: '1px solid #E5E7EB'
            }}>Last Published</th>
            <th scope="col" style={{
              textAlign: 'left', padding: '16px', fontSize: '14px',
              fontWeight: 600, borderBottom: '1px solid #E5E7EB'
            }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(page => (
            <Fragment key={page.slug}>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                {/* Name cell — inline editable */}
                <td style={{ padding: '16px', fontSize: '14px' }}>
                  {editingSlug === page.slug && editField === 'name' ? (
                    <input
                      type="text"
                      className="jeeby-cms-inline-edit-input"
                      value={editValue}
                      aria-label={`Edit name for ${page.name || page.slug}`}
                      aria-describedby={`cms-rename-error-${page.slug}`}
                      onChange={e => handleEditChange(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={commitEdit}
                      autoFocus
                      style={{
                        display: 'block', width: '100%', padding: '4px 8px',
                        boxSizing: 'border-box', fontSize: '14px',
                        border: '1px solid #E5E7EB', borderRadius: '2px'
                      }}
                    />
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{page.name || page.slug}</span>
                      <button
                        ref={el => { editTriggerRefs.current[`${page.slug}-name`] = el }}
                        type="button"
                        aria-label={`Edit name for ${page.name || page.slug}`}
                        onClick={() => startEdit(page.slug, 'name', page.name || '')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '14px', padding: '4px 8px', minHeight: '44px',
                          opacity: 0, color: '#2563EB'
                        }}
                        onFocus={e => { e.currentTarget.style.opacity = '1' }}
                        onBlur={e => { e.currentTarget.style.opacity = '0' }}
                      >Edit</button>
                    </span>
                  )}
                </td>

                {/* Slug cell — inline editable */}
                <td style={{ padding: '16px', fontSize: '14px' }}>
                  {editingSlug === page.slug && editField === 'slug' ? (
                    <input
                      type="text"
                      className="jeeby-cms-inline-edit-input"
                      value={editValue}
                      aria-label={`Edit slug for ${page.name || page.slug}`}
                      aria-describedby={`cms-rename-error-${page.slug}`}
                      onChange={e => handleEditChange(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={commitEdit}
                      autoFocus
                      style={{
                        display: 'block', width: '100%', padding: '4px 8px',
                        boxSizing: 'border-box', fontSize: '14px',
                        border: '1px solid #E5E7EB', borderRadius: '2px'
                      }}
                    />
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{page.slug}</span>
                      <button
                        ref={el => { editTriggerRefs.current[`${page.slug}-slug`] = el }}
                        type="button"
                        aria-label={`Edit slug for ${page.name || page.slug}`}
                        onClick={() => startEdit(page.slug, 'slug', page.slug)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '14px', padding: '4px 8px', minHeight: '44px',
                          opacity: 0, color: '#2563EB'
                        }}
                        onFocus={e => { e.currentTarget.style.opacity = '1' }}
                        onBlur={e => { e.currentTarget.style.opacity = '0' }}
                      >Edit</button>
                    </span>
                  )}
                </td>

                {/* Last Published cell */}
                <td style={{ padding: '16px', fontSize: '14px' }}>
                  {formatDate(page.lastPublishedAt)}
                </td>

                {/* Actions cell */}
                <td style={{ padding: '16px' }}>
                  <button
                    type="button"
                    aria-label={`Delete ${page.slug}`}
                    onClick={(e) => { deleteBtnRef.current = e.currentTarget; setDeleteTarget(page) }}
                    style={{
                      color: '#DC2626', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '14px', minHeight: '44px', padding: '8px 16px'
                    }}
                  >Delete</button>
                </td>
              </tr>

              {/* Inline error row — rendered below the row when there's an error for this page */}
              {editError && editingSlug === page.slug && (
                <tr>
                  <td colSpan={4}>
                    <p
                      id={`cms-rename-error-${page.slug}`}
                      role="alert"
                      className="jeeby-cms-inline-error"
                      style={{ color: '#DC2626', fontSize: '14px', padding: '8px 16px', margin: 0 }}
                    >{editError}</p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <CreatePageModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { loadPages(); setAnnouncement('Page created successfully.') }}
        triggerRef={newPageBtnRef}
      />
      <DeletePageModal
        page={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { loadPages(); setAnnouncement('Page deleted.') }}
        triggerRef={deleteBtnRef}
      />
    </div>
  )
}
