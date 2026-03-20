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

function pageStatus(page) {
  if (!page.lastPublishedAt) return 'draft'
  if (page.hasDraftChanges) return 'changes'
  return 'published'
}

const STATUS_PROPS = {
  published: { label: 'Published', cls: 'jeeby-cms-doc-status jeeby-cms-doc-status--published' },
  draft:     { label: 'Draft',     cls: 'jeeby-cms-doc-status jeeby-cms-doc-status--draft' },
  changes:   { label: 'Changes',   cls: 'jeeby-cms-doc-status jeeby-cms-doc-status--draft' },
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
        const page = pages.find(p => p.slug === currentSlug)
        if (trimmed === (page?.name || '')) {
          cancelEdit()
          return
        }
        await savePage(db, currentSlug, { name: trimmed })
        await loadPages()
        setAnnouncement('Page renamed successfully.')
        // Clear announcement after a tick so it re-announces if triggered again
        setTimeout(() => setAnnouncement(''), 1000)
      } else if (currentField === 'slug') {
        if (trimmed === currentSlug) {
          cancelEdit()
          return
        }
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
        <div className="jeeby-cms-page-list-header">
          <h2>Pages</h2>
        </div>
        <div role="status" aria-label="Loading pages">
          <table className="jeeby-cms-pages-table" aria-hidden="true">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
                <th scope="col">Status</th>
                <th scope="col">Last Published</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map(i => (
                <tr key={i}>
                  <td><span className="jeeby-cms-skeleton" style={{ width: '120px', height: '14px' }} /></td>
                  <td><span className="jeeby-cms-skeleton" style={{ width: '80px', height: '14px' }} /></td>
                  <td><span className="jeeby-cms-skeleton" style={{ width: '72px', height: '22px', borderRadius: '999px' }} /></td>
                  <td><span className="jeeby-cms-skeleton" style={{ width: '90px', height: '14px' }} /></td>
                  <td><span className="jeeby-cms-skeleton" style={{ width: '60px', height: '14px' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="jeeby-cms-pages-empty">
          <h2>No pages yet.</h2>
          <p>Each page is a section of your website — like 'About', 'Contact', or 'Blog'. Fill it with text, images, and galleries, then publish when it's ready.</p>
          <button
            ref={newPageBtnRef}
            type="button"
            className="jeeby-cms-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >Create your first page</button>
        </div>
        <CreatePageModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={() => { loadPages(); setAnnouncement('Page created successfully.') }} triggerRef={newPageBtnRef} />
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
      <div className="jeeby-cms-page-list-header">
        <h2>Pages</h2>
        <button
          ref={newPageBtnRef}
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >New Page</button>
      </div>

      <table className="jeeby-cms-pages-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Slug</th>
            <th scope="col">Status</th>
            <th scope="col">Last Published</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(page => (
            <Fragment key={page.slug}>
              <tr>
                {/* Name cell — inline editable */}
                <td>
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
                    />
                  ) : (
                    <span className="jeeby-cms-cell-read">
                      <a href={'/admin/pages/' + encodeURIComponent(page.slug)}>{page.name || page.slug}</a>
                      <button
                        ref={el => { editTriggerRefs.current[`${page.slug}-name`] = el }}
                        type="button"
                        className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                        aria-label={`Edit name for ${page.name || page.slug}`}
                        onClick={() => startEdit(page.slug, 'name', page.name || '')}
                      >Edit</button>
                    </span>
                  )}
                </td>

                {/* Slug cell — inline editable */}
                <td>
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
                    />
                  ) : (
                    <span className="jeeby-cms-cell-read">
                      <span>{page.slug}</span>
                      <button
                        ref={el => { editTriggerRefs.current[`${page.slug}-slug`] = el }}
                        type="button"
                        className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                        aria-label={`Edit slug for ${page.name || page.slug}`}
                        onClick={() => startEdit(page.slug, 'slug', page.slug)}
                      >Edit</button>
                    </span>
                  )}
                </td>

                {/* Status cell */}
                <td>
                  {(() => {
                    const { label, cls } = STATUS_PROPS[pageStatus(page)]
                    return <span className={cls}>{label}</span>
                  })()}
                </td>

                {/* Last Published cell */}
                <td>
                  {formatDate(page.lastPublishedAt)}
                </td>

                {/* Actions cell */}
                <td>
                  <a
                    href={'/admin/pages/' + encodeURIComponent(page.slug)}
                    aria-label={'Edit blocks for ' + page.slug}
                    style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
                  >Edit</a>
                  <button
                    type="button"
                    className="jeeby-cms-btn-ghost"
                    aria-label={`Delete ${page.slug}`}
                    onClick={(e) => { deleteBtnRef.current = e.currentTarget; setDeleteTarget(page) }}
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
