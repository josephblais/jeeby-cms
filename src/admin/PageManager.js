"use client"
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCMSFirebase } from '../index.js'
import { listPages, renamePage, savePage, validateSlug } from '../firebase/firestore.js'
import { CreatePageModal } from './CreatePageModal.js'
import { DeletePageModal } from './DeletePageModal.js'

// Internal helper — not exported
function formatDate(ts) {
  if (!ts) return 'Not yet'
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
  changes:   { label: 'Changes',   cls: 'jeeby-cms-doc-status jeeby-cms-doc-status--changes' },
}

// ── Sort / filter ─────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'recent',    isFilter: false, colorKey: 'time',      label: 'Recently edited',    hint: 'most recently changed first',    icon: <IconRecent /> },
  { key: 'alpha',     isFilter: false, colorKey: 'alpha',     label: 'Alphabetical',        hint: 'A–Z by page name',               icon: <IconAlpha /> },
  { key: 'draft',     isFilter: true,  colorKey: 'draft',     label: 'Drafts only',         hint: 'never been published',           icon: <IconDraft /> },
  { key: 'changes',   isFilter: true,  colorKey: 'changes',   label: 'Unpublished changes', hint: 'published but with edits',       icon: <IconChanges /> },
  { key: 'published', isFilter: true,  colorKey: 'published', label: 'Published only',      hint: 'live, no pending changes',       icon: <IconPublished /> },
]

// Firestore Timestamps can arrive as {toMillis}, {seconds/nanoseconds}, or Date.
function tsToMs(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts.seconds === 'number') return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  return 0
}

function applySortFilter(pages, key) {
  switch (key) {
    case 'alpha':     return [...pages].sort((a, b) => (a.name || a.slug).localeCompare(b.name || b.slug))
    case 'draft':     return pages.filter(p => pageStatus(p) === 'draft')
    case 'changes':   return pages.filter(p => pageStatus(p) === 'changes')
    case 'published': return pages.filter(p => pageStatus(p) === 'published')
    default:          return [...pages].sort((a, b) => tsToMs(b.updatedAt) - tsToMs(a.updatedAt))
  }
}

// Sort option icons
function IconRecent() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="7" cy="7" r="5" />
      <path d="M7 4.5v2.7l1.8 1.8" />
    </svg>
  )
}
function IconAlpha() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="1" y="3" width="5" height="1.5" rx="0.7" opacity="0.55" />
      <rect x="1" y="6.25" width="7.5" height="1.5" rx="0.7" opacity="0.75" />
      <rect x="1" y="9.5" width="10" height="1.5" rx="0.7" />
    </svg>
  )
}
function IconDraft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="1.5" width="9" height="11" rx="1.2" />
      <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" />
      <line x1="4.5" y1="7" x2="7" y2="7" strokeDasharray="1.5 1.5" />
    </svg>
  )
}
function IconChanges() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 2.5l2.5 2.5-6 6H3v-2.5l6-6z" />
    </svg>
  )
}
function IconPublished() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="7" cy="7" r="5" />
      <path d="M4.5 7l2 2L9.5 5" />
    </svg>
  )
}
function IconSortLines() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="0" y="1.5" width="12" height="1.5" rx="0.7" />
      <rect x="1.5" y="4.5" width="9" height="1.5" rx="0.7" />
      <rect x="3" y="7.5" width="6" height="1.5" rx="0.7" />
    </svg>
  )
}
function IconChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 3.5l3 3 3-3" />
    </svg>
  )
}

// SortPicker — floating menu for sort/filter options.
// Uses role="menu" + role="menuitemradio" (not listbox) since this is a persistent
// application mode, not a data value selection. WCAG 4.1.2, WAI-ARIA 1.2.
function SortPicker({ sortMode, onSelect, onClose, triggerRef }) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = SORT_OPTIONS.findIndex(o => o.key === sortMode)
    return idx >= 0 ? idx : 0
  })
  const listRef = useRef(null)

  // Focus the currently selected option on open
  useEffect(() => {
    listRef.current?.querySelectorAll('[role="menuitemradio"]')[activeIndex]?.focus()
  }, [])

  // Close on click outside (trigger handles its own toggle)
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        listRef.current && !listRef.current.contains(e.target) &&
        (!triggerRef.current || !triggerRef.current.contains(e.target))
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (activeIndex + 1) % SORT_OPTIONS.length
      setActiveIndex(next)
      listRef.current?.querySelectorAll('[role="menuitemradio"]')[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (activeIndex - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length
      setActiveIndex(prev)
      listRef.current?.querySelectorAll('[role="menuitemradio"]')[prev]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(SORT_OPTIONS[activeIndex].key)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      triggerRef.current?.focus()
    }
  }

  return (
    <ul
      ref={listRef}
      role="menu"
      aria-label="Sort and filter pages"
      onKeyDown={handleKeyDown}
      className="jeeby-cms-sort-picker"
    >
      {SORT_OPTIONS.map((opt, index) => (
        <li
          key={opt.key}
          role="menuitemradio"
          aria-checked={opt.key === sortMode}
          tabIndex={activeIndex === index ? 0 : -1}
          data-color-key={opt.colorKey}
          onClick={() => onSelect(opt.key)}
          onMouseEnter={() => {
            setActiveIndex(index)
            listRef.current?.querySelectorAll('[role="menuitemradio"]')[index]?.focus()
          }}
        >
          <span className="jeeby-cms-block-icon" aria-hidden="true">{opt.icon}</span>
          <span className="jeeby-cms-block-type-info">
            <span className="jeeby-cms-block-type-label">{opt.label}</span>
            <span className="jeeby-cms-block-type-hint">{opt.hint}</span>
          </span>
          {opt.key === sortMode && (
            <svg className="jeeby-cms-sort-check" width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M1.5 5.5l2.5 2.5L9.5 2" />
            </svg>
          )}
        </li>
      ))}
    </ul>
  )
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

  // Sort / filter
  const [sortMode, setSortMode] = useState('recent')
  const [sortPickerOpen, setSortPickerOpen] = useState(false)
  const sortTriggerRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

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

  // --- Sort / filter handler ---

  function handleSortSelect(key) {
    setSortMode(key)
    setSortPickerOpen(false)
    sortTriggerRef.current?.focus()
    const opt = SORT_OPTIONS.find(o => o.key === key)
    const result = applySortFilter(pages, key)
    if (opt.isFilter) {
      setAnnouncement(
        result.length === 0
          ? `${opt.label} — no pages match.`
          : `${opt.label} — showing ${result.length} page${result.length !== 1 ? 's' : ''}.`
      )
    } else {
      setAnnouncement(key === 'alpha' ? 'Sorted alphabetically.' : 'Sorted by most recently edited.')
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
          <div className="jeeby-cms-pages-table-wrap">
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

      {/* Table header row: h2 + controls (sort trigger + New Page button) */}
      <div className="jeeby-cms-page-list-header">
        <h2>Pages</h2>
        <div className="jeeby-cms-page-list-controls">
          {/* Sort / filter trigger */}
          {(() => {
            const currentOpt = SORT_OPTIONS.find(o => o.key === sortMode) || SORT_OPTIONS[0]
            return (
              <div className="jeeby-cms-sort-anchor">
                <button
                  ref={sortTriggerRef}
                  type="button"
                  className="jeeby-cms-sort-trigger"
                  aria-haspopup="menu"
                  aria-expanded={sortPickerOpen}
                  aria-label={currentOpt.isFilter ? `Filter active: ${currentOpt.label}` : `Sort: ${currentOpt.label}`}
                  data-filter-active={currentOpt.isFilter ? 'true' : undefined}
                  onClick={() => setSortPickerOpen(v => !v)}
                >
                  <IconSortLines />
                  {currentOpt.label}
                  <IconChevronDown />
                </button>
                {sortPickerOpen && (
                  <SortPicker
                    sortMode={sortMode}
                    onSelect={handleSortSelect}
                    onClose={() => { setSortPickerOpen(false); sortTriggerRef.current?.focus() }}
                    triggerRef={sortTriggerRef}
                  />
                )}
              </div>
            )
          })()}
          <button
            ref={newPageBtnRef}
            type="button"
            className="jeeby-cms-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >New Page</button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sortMode}
        className="jeeby-cms-pages-table-wrap"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.16 } }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
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
          {(() => {
            const displayedPages = applySortFilter(pages, sortMode)
            if (displayedPages.length === 0) {
              return (
                <tr>
                  <td colSpan={5} className="jeeby-cms-filter-empty">
                    <span>No pages match this filter.</span>
                    <button
                      type="button"
                      className="jeeby-cms-btn-ghost"
                      onClick={() => { setSortMode('recent'); setAnnouncement('Filter cleared. Showing all pages.') }}
                    >Show all pages</button>
                  </td>
                </tr>
              )
            }
            return displayedPages.map(page => (
            <Fragment key={page.slug}>
              <tr>
                {/* Name cell — inline editable */}
                <td>
                  {editingSlug === page.slug && editField === 'name' ? (
                    <input
                      type="text"
                      className="jeeby-cms-inline-edit-input"
                      value={editValue}
                      aria-label={`Rename: ${page.name || page.slug}`}
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
                        aria-label={`Rename ${page.name || page.slug}`}
                        onClick={() => startEdit(page.slug, 'name', page.name || '')}
                      >Rename</button>
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
                      aria-label={`Rename slug: ${page.name || page.slug}`}
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
                        aria-label={`Rename slug for ${page.name || page.slug}`}
                        onClick={() => startEdit(page.slug, 'slug', page.slug)}
                      >Rename</button>
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
                  <div className="jeeby-cms-table-actions">
                    <a
                      href={'/admin/pages/' + encodeURIComponent(page.slug)}
                      aria-label={'Edit blocks for ' + page.slug}
                      className="jeeby-cms-btn-primary"
                    >Edit</a>
                    <button
                      type="button"
                      className="jeeby-cms-btn-ghost"
                      aria-label={`Delete ${page.slug}`}
                      onClick={(e) => { deleteBtnRef.current = e.currentTarget; setDeleteTarget(page) }}
                    >Delete</button>
                  </div>
                </td>
              </tr>

              {/* Inline error row — rendered below the row when there's an error for this page */}
              {editError && editingSlug === page.slug && (
                <tr>
                  <td colSpan={5}>
                    <p
                      id={`cms-rename-error-${page.slug}`}
                      role="alert"
                      className="jeeby-cms-inline-error"
                    >{editError}</p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))
          })()}
        </tbody>
      </table>
      </motion.div>
      </AnimatePresence>

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
