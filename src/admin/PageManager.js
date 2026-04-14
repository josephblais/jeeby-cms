"use client"
import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCMSFirebase } from '../index.js'
import {
  listPages, listPagesPaginated, renamePage, savePage, validateSlug,
  getCollectionPages, renameCollection,
} from '../firebase/firestore.js'
import { CreatePageModal } from './CreatePageModal.js'
import { DeletePageModal } from './DeletePageModal.js'
import { MediaLibraryModal } from './MediaLibraryModal.js'

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

// Firestore Timestamps can arrive as {toMillis}, {seconds/nanoseconds}, Date, or ISO string.
function tsToMs(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts.seconds === 'number') return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  if (typeof ts === 'string') { const ms = Date.parse(ts); return isNaN(ms) ? 0 : ms }
  return 0
}

// ── Search ────────────────────────────────────────────────────────────

// Normalize for matching: lowercase + strip diacritics (so "cafe" matches "Café")
function normalizeForSearch(str) {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Fuzzy match: every character in query must appear in str in order.
// Spread into arrays to iterate code points, not code units — ensures
// emoji and other surrogate pairs (e.g. 😀, 𝓐) match correctly.
function fuzzyMatch(query, str) {
  const q = [...normalizeForSearch(query)]
  const s = [...normalizeForSearch(str)]
  let qi = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) qi++
  }
  return qi === q.length
}

function applySearch(pages, query) {
  if (!query.trim()) return pages
  return pages.filter(p =>
    fuzzyMatch(query, p.name || '') || fuzzyMatch(query, p.slug || '')
  )
}

function applySortFilter(pages, key) {
  switch (key) {
    case 'alpha':     return [...pages].sort((a, b) => (a.name || a.slug || '').localeCompare(b.name || b.slug || '', undefined, { sensitivity: 'base' }))
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
function IconSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="5.5" cy="5.5" r="3.5" />
      <path d="M8.5 8.5l2.5 2.5" />
    </svg>
  )
}
function IconClear() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
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
function IconChevronLeft() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M6.5 2l-3 3 3 3" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3.5 2l3 3-3 3" />
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

  // Close on click or tap outside (trigger handles its own toggle)
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
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
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

const PAGE_SIZE = 20
const ALL_PAGES_TTL = 60_000 // ms — invalidated on any mutation

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

  // Refs for focus management, debounce, and save guard
  const debounceRef = useRef(null)
  const isSavingRef = useRef(false)
  // fetchGenRef: incremented on every loadPages call. Results are only applied when
  // the generation at completion matches, discarding stale concurrent fetches.
  const fetchGenRef = useRef(0)
  const newPageBtnRef = useRef(null)
  // editTriggerRef is set per-row to return focus after commit
  const editTriggerRefs = useRef({})

  // State variables for Plan 03 integration
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const deleteBtnRef = useRef(null)
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const mediaLibraryTriggerRef = useRef(null)

  // Sort / filter
  const [sortMode, setSortMode] = useState('recent')
  const [sortPickerOpen, setSortPickerOpen] = useState(false)
  const sortTriggerRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Pagination
  // isPaginated: true when Firestore cursor pagination is used (recent sort + no search).
  // false: fetch all docs, process client-side, slice for UI pages.
  const isPaginated = sortMode === 'recent' && !debouncedQuery.trim()
  const [pageNum, setPageNum] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  // cursorsRef[n] = startAfter cursor to fetch page n+1. Index 0 is always null (page 1 start).
  const cursorsRef = useRef([null])
  // allPagesCacheRef: full listPages result cached for ALL_PAGES_TTL. Invalidated on mutations.
  const allPagesCacheRef = useRef(null)
  // prefetchRef: background-fetched result for the next paginated page.
  const prefetchRef = useRef(null)

  const showSearch = isPaginated
    ? (hasNextPage || pages.length >= 8)
    : pages.length >= 8

  // processedPages: full sort/filter/search result — used for total count in all mode
  const processedPages = useMemo(
    () => applySearch(applySortFilter(pages, sortMode), debouncedQuery),
    [pages, sortMode, debouncedQuery]
  )

  // displayedPages: the slice that actually renders in the table
  const displayedPages = useMemo(
    () => isPaginated
      ? processedPages
      : processedPages.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE),
    [isPaginated, processedPages, pageNum]
  )

  // ── Collection grouping (09.1) ────────────────────────────────────
  // A page is a "collection" if pageType === 'collection'.
  // A page is an "entry" if it has a truthy parentSlug (regardless of pageType).
  // A page is "standalone" otherwise — this also covers legacy pages with no pageType (D-03).
  const collectionPages = useMemo(
    () => pages.filter(p => p.pageType === 'collection'),
    [pages],
  )
  const entryPages = useMemo(
    () => pages.filter(p => !!p.parentSlug),
    [pages],
  )
  const standalonePages = useMemo(
    () => pages.filter(p => p.pageType !== 'collection' && !p.parentSlug),
    [pages],
  )
  // Top-level items = collections + standalone pages. Sort/filter/search apply to THIS list.
  const topLevelItems = useMemo(() => [...collectionPages, ...standalonePages], [collectionPages, standalonePages])
  const displayedTopLevel = useMemo(
    () => applySearch(applySortFilter(topLevelItems, sortMode), debouncedQuery),
    [topLevelItems, sortMode, debouncedQuery],
  )
  // Entries grouped by parentSlug, always sorted updatedAt desc (D-17).
  // Search query matches entry name/slug too — hidden parents become visible if ANY child matches.
  const entriesByParent = useMemo(() => {
    const byParent = new Map()
    const sortedEntries = [...entryPages].sort((a, b) => tsToMs(b.updatedAt) - tsToMs(a.updatedAt))
    for (const e of sortedEntries) {
      if (!byParent.has(e.parentSlug)) byParent.set(e.parentSlug, [])
      byParent.get(e.parentSlug).push(e)
    }
    return byParent
  }, [entryPages])

  const totalPages = isPaginated ? null : Math.max(1, Math.ceil(processedPages.length / PAGE_SIZE))
  const canGoPrev = pageNum > 1
  const canGoNext = isPaginated ? hasNextPage : pageNum < (totalPages ?? 1)

  // Load pages from Firestore.
  // Multiple calls can be in flight; only the most recent result is applied (fetchGenRef).
  // Paginated mode: uses a background prefetch cache for instant forward navigation.
  // All mode: caches the full page list for ALL_PAGES_TTL to avoid refetching on filter/search changes.
  const loadPages = useCallback(async () => {
    const gen = ++fetchGenRef.current

    if (isPaginated) {
      // Use prefetched result if ready — no loading state, instant navigation
      const pre = prefetchRef.current
      if (pre?.pageNum === pageNum && pre?.result) {
        prefetchRef.current = null
        if (gen !== fetchGenRef.current) return
        const { pages: result, nextCursor, hasMore } = pre.result
        setPages(result)
        setHasNextPage(hasMore)
        if (hasMore) {
          cursorsRef.current[pageNum] = nextCursor
          // Keep prefetching ahead
          const nextPage = pageNum + 1
          prefetchRef.current = { pageNum: nextPage }
          listPagesPaginated(db, { pageSize: PAGE_SIZE, cursor: nextCursor })
            .then(r => { if (prefetchRef.current?.pageNum === nextPage) prefetchRef.current.result = r })
            .catch(() => {})
        }
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      if (isPaginated) {
        const cursor = cursorsRef.current[pageNum - 1] ?? null
        const { pages: result, nextCursor, hasMore } = await listPagesPaginated(db, { pageSize: PAGE_SIZE, cursor })
        if (gen !== fetchGenRef.current) return
        setPages(result)
        setHasNextPage(hasMore)
        if (hasMore) {
          cursorsRef.current[pageNum] = nextCursor
          // Start prefetching the next page in the background
          const nextPage = pageNum + 1
          prefetchRef.current = { pageNum: nextPage }
          listPagesPaginated(db, { pageSize: PAGE_SIZE, cursor: nextCursor })
            .then(r => { if (prefetchRef.current?.pageNum === nextPage) prefetchRef.current.result = r })
            .catch(() => {})
        }
      } else {
        // Use cached full-page list when fresh; only hit Firestore when stale or invalidated
        const cache = allPagesCacheRef.current
        let result
        if (cache && Date.now() - cache.cachedAt < ALL_PAGES_TTL) {
          result = cache.pages
        } else {
          result = await listPages(db)
          if (gen !== fetchGenRef.current) return
          allPagesCacheRef.current = { pages: result, cachedAt: Date.now() }
        }
        if (gen !== fetchGenRef.current) return
        setPages(result)
        setHasNextPage(false)
      }
    } catch (err) {
      if (gen === fetchGenRef.current) setError('Failed to load pages.')
    } finally {
      if (gen === fetchGenRef.current) setLoading(false)
    }
  }, [db, isPaginated, pageNum])

  useEffect(() => { loadPages() }, [loadPages])

  // Reset to page 1 when sort mode or search changes (handles both isPaginated flip and filter changes)
  useEffect(() => {
    setPageNum(1)
    cursorsRef.current = [null]
    setHasNextPage(false)
    prefetchRef.current = null
  }, [sortMode, debouncedQuery])

  // If the current page is empty but earlier pages exist, go back one page.
  // Covers: deletion empties last paginated page, filter narrows below current page.
  useEffect(() => {
    if (displayedPages.length === 0 && pageNum > 1 && !loading) {
      setPageNum(p => p - 1)
    }
  }, [displayedPages.length, pageNum, loading])

  // Clear announcement after 3 seconds
  useEffect(() => {
    if (announcement) {
      const t = setTimeout(() => setAnnouncement(''), 3000)
      return () => clearTimeout(t)
    }
  }, [announcement])

  // Debounce search: update debouncedQuery after 200ms idle.
  // Announcement happens in a separate effect once processedPages settles.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      setAnnouncement(
        processedPages.length === 0
          ? 'No pages match.'
          : `${processedPages.length} page${processedPages.length !== 1 ? 's' : ''} found.`
      )
    }
  }, [debouncedQuery, processedPages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear search when bar disappears (page count drops below threshold)
  useEffect(() => {
    if (!showSearch) setSearchQuery('')
  }, [showSearch])

  // Default: all collections expanded (Claude's Discretion per CONTEXT.md)
  const [expandedCollections, setExpandedCollections] = useState(() => new Set())

  // Keep the set in sync when pages load — expand any newly observed collection by default
  useEffect(() => {
    setExpandedCollections(prev => {
      const next = new Set(prev)
      for (const c of collectionPages) {
        if (!prev.has(c.slug)) next.add(c.slug)
      }
      return next
    })
  }, [collectionPages])

  function toggleCollection(slug) {
    setExpandedCollections(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

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
    if (isSavingRef.current) return
    const trimmed = editValue.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }

    clearTimeout(debounceRef.current)

    const currentSlug = editingSlug
    const currentField = editField
    isSavingRef.current = true

    try {
      if (currentField === 'name') {
        const page = pages.find(p => p.slug === currentSlug)
        if (trimmed === (page?.name || '')) {
          cancelEdit()
          return
        }
        await savePage(db, currentSlug, { name: trimmed })
        allPagesCacheRef.current = null
        prefetchRef.current = null
        await loadPages()
        setAnnouncement('Page renamed successfully.')
        // Clear announcement after a tick so it re-announces if triggered again
        setTimeout(() => setAnnouncement(''), 1000)
      } else if (currentField === 'slug') {
        if (trimmed === currentSlug) {
          cancelEdit()
          return
        }
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
        // D-19: collections cascade parentSlug updates to children via renameCollection.
        if (page?.pageType === 'collection') {
          await renameCollection(db, currentSlug, trimmed)
        } else {
          await renamePage(db, currentSlug, trimmed)
        }
        allPagesCacheRef.current = null
        prefetchRef.current = null
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
    } finally {
      isSavingRef.current = false
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
    if (opt.isFilter) {
      // Announce the filter name only — the count comes from processedPages which
      // won't be correct until the all-pages fetch completes.
      setAnnouncement(`${opt.label} filter applied.`)
    } else {
      setAnnouncement(key === 'alpha' ? 'Sorted alphabetically.' : 'Sorted by most recently edited.')
    }
  }

  // --- Pagination handlers ---

  function goToNextPage() { setPageNum(p => p + 1) }
  function goToPrevPage() { setPageNum(p => Math.max(1, p - 1)) }

  // D-20: block delete on a collection that still has children
  const [deleteBlockedError, setDeleteBlockedError] = useState(null) // { slug, count }

  async function handleDeleteClick(page) {
    setDeleteBlockedError(null)
    if (page?.pageType === 'collection') {
      try {
        const kids = await getCollectionPages(db, page.slug)
        if (kids.length > 0) {
          setDeleteBlockedError({ slug: page.slug, count: kids.length })
          setAnnouncement(`Cannot delete ${page.slug}: ${kids.length} entries remain.`)
          setTimeout(() => setAnnouncement(''), 1500)
          return
        }
      } catch {
        // If the query fails, fall through and let DeletePageModal handle normally
      }
    }
    setDeleteTarget(page)
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

  // Error state
  if (error && pages.length === 0) {
    return (
      <div className="jeeby-cms-page-manager">
        <div className="jeeby-cms-live-region" aria-live="polite" aria-atomic="true" style={{
          position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
          clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
        }}>
          {announcement}
        </div>
        <div className="jeeby-cms-page-list-header">
          <h2>Pages</h2>
        </div>
        <div className="jeeby-cms-pages-empty" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="jeeby-cms-btn-primary"
            onClick={loadPages}
          >Try again</button>
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
          <div className="jeeby-cms-page-list-controls">
            <button
              ref={newPageBtnRef}
              type="button"
              className="jeeby-cms-btn-primary"
              onClick={() => setShowCreateModal(true)}
            >Create your first page</button>
            <button
              ref={mediaLibraryTriggerRef}
              type="button"
              className="jeeby-cms-btn-ghost"
              onClick={() => setMediaLibraryOpen(true)}
            >Upload Media</button>
          </div>
        </div>
        <CreatePageModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={() => { loadPages(); setAnnouncement('Page created successfully.') }} triggerRef={newPageBtnRef} />
        <MediaLibraryModal
          open={mediaLibraryOpen}
          mode="browse"
          onSelect={undefined}
          onClose={() => setMediaLibraryOpen(false)}
          triggerRef={mediaLibraryTriggerRef}
        />
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
          {/* Sort / filter trigger — only when there are pages to sort */}
          {pages.length > 0 && (() => {
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
          <button
            ref={mediaLibraryTriggerRef}
            type="button"
            className="jeeby-cms-btn-ghost"
            onClick={() => setMediaLibraryOpen(true)}
          >Upload Media</button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showSearch && (
          <motion.div
            className="jeeby-cms-search-bar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="jeeby-cms-search-inner" role="search">
              <span className="jeeby-cms-search-icon" aria-hidden="true"><IconSearch /></span>
              <input
                type="search"
                className="jeeby-cms-search-input"
                placeholder="Search pages…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search pages"
                maxLength={200}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="jeeby-cms-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                >
                  <IconClear />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {deleteBlockedError && (
        <div className="jeeby-cms-inline-error" role="alert" style={{ marginBottom: '0.75rem' }}>
          {deleteBlockedError.count === 1
            ? 'This collection has 1 entry. Delete or reassign them first.'
            : `This collection has ${deleteBlockedError.count} entries. Delete or reassign them first.`}
          {' '}
          <button
            type="button"
            className="jeeby-cms-btn-ghost"
            onClick={() => setDeleteBlockedError(null)}
            aria-label="Dismiss error"
          >Dismiss</button>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${sortMode}|${debouncedQuery}|${pageNum}`}
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
        {(() => {
          const displayedCollections = displayedTopLevel.filter(p => p.pageType === 'collection')
          const displayedStandalone = displayedTopLevel.filter(p => p.pageType !== 'collection' && !p.parentSlug)
          const nothingToShow = displayedCollections.length === 0 && displayedStandalone.length === 0

          if (nothingToShow) {
            const currentOpt = SORT_OPTIONS.find(o => o.key === sortMode)
            const hasFilter = currentOpt?.isFilter
            const hasSearch = !!debouncedQuery
            const queryChars = [...debouncedQuery]
            const shortQuery = queryChars.length > 40 ? queryChars.slice(0, 40).join('') + '…' : debouncedQuery
            const emptyMsg = hasSearch && hasFilter
              ? 'No pages match this search and filter.'
              : hasSearch
                ? `No pages match "${shortQuery}".`
                : 'No pages match this filter.'
            return (
              <tbody>
                <tr>
                  <td colSpan={5} className="jeeby-cms-filter-empty">
                    <span>{emptyMsg}</span>
                    {hasSearch && (
                      <button type="button" className="jeeby-cms-btn-ghost"
                        onClick={() => { setSearchQuery(''); setAnnouncement('Search cleared.') }}>Clear search</button>
                    )}
                    {hasFilter && (
                      <button type="button" className="jeeby-cms-btn-ghost"
                        onClick={() => { setSortMode('recent'); setAnnouncement('Filter cleared. Showing all pages.') }}>Clear filter</button>
                    )}
                  </td>
                </tr>
              </tbody>
            )
          }

          return (
            <>
              {displayedCollections.length > 0 && (
                <tbody>
                  <tr className="jeeby-cms-table-section-header">
                    <td colSpan={5}>Collections</td>
                  </tr>
                </tbody>
              )}
              {displayedCollections.map(coll => {
                const isExpanded = expandedCollections.has(coll.slug)
                const kids = entriesByParent.get(coll.slug) || []
                const { label: collLabel, cls: collCls } = STATUS_PROPS[pageStatus(coll)]
                return (
                  <tbody
                    key={`coll-${coll.slug}`}
                    id={`cms-collection-entries-${coll.slug}`}
                    className="jeeby-cms-collection-group"
                  >
                    {/* Collection header row — same cell shape as standalone page rows (D-18) */}
                    <tr className="jeeby-cms-collection-row">
                      <td>
                        {editingSlug === coll.slug && editField === 'name' ? (
                          <input
                            type="text"
                            className="jeeby-cms-inline-edit-input"
                            value={editValue}
                            aria-label={`Rename: ${coll.name || coll.slug}`}
                            aria-describedby={`cms-rename-error-${coll.slug}`}
                            onChange={e => handleEditChange(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={commitEdit}
                            autoFocus
                          />
                        ) : (
                          <span className="jeeby-cms-cell-read">
                            <button
                              type="button"
                              className="jeeby-cms-collection-toggle"
                              aria-expanded={expandedCollections.has(coll.slug)}
                              aria-controls={`cms-collection-entries-${coll.slug}`}
                              data-expanded={isExpanded ? 'true' : undefined}
                              onClick={() => toggleCollection(coll.slug)}
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                                <path d="M3 1.5l4 3.5-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span>{coll.name || coll.slug}</span>
                            </button>
                            <button
                              ref={el => { editTriggerRefs.current[`${coll.slug}-name`] = el }}
                              type="button"
                              className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                              aria-label={`Rename ${coll.name || coll.slug}`}
                              onClick={() => startEdit(coll.slug, 'name', coll.name || '')}
                            >Rename</button>
                          </span>
                        )}
                      </td>
                      <td>
                        {editingSlug === coll.slug && editField === 'slug' ? (
                          <input
                            type="text"
                            className="jeeby-cms-inline-edit-input"
                            value={editValue}
                            aria-label={`Rename slug: ${coll.name || coll.slug}`}
                            aria-describedby={`cms-rename-error-${coll.slug}`}
                            onChange={e => handleEditChange(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={commitEdit}
                            autoFocus
                          />
                        ) : (
                          <span className="jeeby-cms-cell-read">
                            <span>{coll.slug}</span>
                            <button
                              ref={el => { editTriggerRefs.current[`${coll.slug}-slug`] = el }}
                              type="button"
                              className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                              aria-label={`Rename slug for ${coll.name || coll.slug}`}
                              onClick={() => startEdit(coll.slug, 'slug', coll.slug)}
                            >Rename</button>
                          </span>
                        )}
                      </td>
                      <td><span className={collCls}>{collLabel}</span></td>
                      <td>{formatDate(coll.lastPublishedAt)}</td>
                      <td>
                        <div className="jeeby-cms-table-actions">
                          <a
                            href={'/admin/pages/' + encodeURIComponent(coll.slug)}
                            aria-label={'Edit blocks for ' + coll.slug}
                            className="jeeby-cms-btn-primary"
                          >Edit</a>
                          <button
                            type="button"
                            className="jeeby-cms-btn-ghost"
                            aria-label={`Delete ${coll.slug}`}
                            onClick={(e) => { deleteBtnRef.current = e.currentTarget; handleDeleteClick(coll) }}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                    {/* Inline rename error for collection header */}
                    {editError && editingSlug === coll.slug && (
                      <tr>
                        <td colSpan={5}>
                          <p id={`cms-rename-error-${coll.slug}`} role="alert" className="jeeby-cms-inline-error">{editError}</p>
                        </td>
                      </tr>
                    )}
                    {/* Entry rows */}
                    {isExpanded && kids.map(entry => {
                      const { label, cls } = STATUS_PROPS[pageStatus(entry)]
                      return (
                        <Fragment key={entry.slug}>
                          <tr className="jeeby-cms-entry-row">
                            <td>
                              {editingSlug === entry.slug && editField === 'name' ? (
                                <input type="text" className="jeeby-cms-inline-edit-input jeeby-cms-entry-indent" value={editValue}
                                  aria-label={`Rename: ${entry.name || entry.slug}`}
                                  aria-describedby={`cms-rename-error-${entry.slug}`}
                                  onChange={e => handleEditChange(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  onBlur={commitEdit}
                                  autoFocus />
                              ) : (
                                <span className="jeeby-cms-entry-indent jeeby-cms-cell-read">
                                  <a href={'/admin/pages/' + encodeURIComponent(entry.slug)}>{entry.name || entry.slug}</a>
                                  <button
                                    ref={el => { editTriggerRefs.current[`${entry.slug}-name`] = el }}
                                    type="button" className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                                    aria-label={`Rename ${entry.name || entry.slug}`}
                                    onClick={() => startEdit(entry.slug, 'name', entry.name || '')}
                                  >Rename</button>
                                </span>
                              )}
                            </td>
                            <td>
                              {editingSlug === entry.slug && editField === 'slug' ? (
                                <input type="text" className="jeeby-cms-inline-edit-input" value={editValue}
                                  aria-label={`Rename slug: ${entry.name || entry.slug}`}
                                  aria-describedby={`cms-rename-error-${entry.slug}`}
                                  onChange={e => handleEditChange(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  onBlur={commitEdit}
                                  autoFocus />
                              ) : (
                                <span className="jeeby-cms-cell-read">
                                  <span>/{entry.parentSlug}/{entry.slug}</span>
                                  <button
                                    ref={el => { editTriggerRefs.current[`${entry.slug}-slug`] = el }}
                                    type="button" className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                                    aria-label={`Rename slug for ${entry.name || entry.slug}`}
                                    onClick={() => startEdit(entry.slug, 'slug', entry.slug)}
                                  >Rename</button>
                                </span>
                              )}
                            </td>
                            <td><span className={cls}>{label}</span></td>
                            <td>{formatDate(entry.lastPublishedAt)}</td>
                            <td>
                              <div className="jeeby-cms-table-actions">
                                <a href={'/admin/pages/' + encodeURIComponent(entry.slug)}
                                  aria-label={'Edit blocks for ' + entry.slug}
                                  className="jeeby-cms-btn-primary">Edit</a>
                                <button type="button" className="jeeby-cms-btn-ghost"
                                  aria-label={`Delete ${entry.slug}`}
                                  onClick={(e) => { deleteBtnRef.current = e.currentTarget; handleDeleteClick(entry) }}
                                >Delete</button>
                              </div>
                            </td>
                          </tr>
                          {editError && editingSlug === entry.slug && (
                            <tr>
                              <td colSpan={5}>
                                <p id={`cms-rename-error-${entry.slug}`} role="alert" className="jeeby-cms-inline-error">{editError}</p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                )
              })}
              {displayedStandalone.length > 0 && (
                <tbody>
                  <tr className="jeeby-cms-table-section-header">
                    <td colSpan={5}>Pages</td>
                  </tr>
                </tbody>
              )}
              <tbody>
                <AnimatePresence>
                  {displayedStandalone.map(page => (
                    <Fragment key={page.slug}>
                      <motion.tr
                        exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -16, transition: { duration: prefersReducedMotion ? 0.01 : 0.18, ease: [0.4, 0, 1, 1] } }}
                      >
                        <td>
                          {editingSlug === page.slug && editField === 'name' ? (
                            <input type="text" className="jeeby-cms-inline-edit-input" value={editValue}
                              aria-label={`Rename: ${page.name || page.slug}`}
                              aria-describedby={`cms-rename-error-${page.slug}`}
                              onChange={e => handleEditChange(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={commitEdit}
                              autoFocus />
                          ) : (
                            <span className="jeeby-cms-cell-read">
                              <a href={'/admin/pages/' + encodeURIComponent(page.slug)}>{page.name || page.slug}</a>
                              <button
                                ref={el => { editTriggerRefs.current[`${page.slug}-name`] = el }}
                                type="button" className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                                aria-label={`Rename ${page.name || page.slug}`}
                                onClick={() => startEdit(page.slug, 'name', page.name || '')}
                              >Rename</button>
                            </span>
                          )}
                        </td>
                        <td>
                          {editingSlug === page.slug && editField === 'slug' ? (
                            <input type="text" className="jeeby-cms-inline-edit-input" value={editValue}
                              aria-label={`Rename slug: ${page.name || page.slug}`}
                              aria-describedby={`cms-rename-error-${page.slug}`}
                              onChange={e => handleEditChange(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={commitEdit}
                              autoFocus />
                          ) : (
                            <span className="jeeby-cms-cell-read">
                              <span>{page.slug}</span>
                              <button
                                ref={el => { editTriggerRefs.current[`${page.slug}-slug`] = el }}
                                type="button" className="jeeby-cms-btn-ghost jeeby-cms-edit-affordance"
                                aria-label={`Rename slug for ${page.name || page.slug}`}
                                onClick={() => startEdit(page.slug, 'slug', page.slug)}
                              >Rename</button>
                            </span>
                          )}
                        </td>
                        <td>{(() => { const { label, cls } = STATUS_PROPS[pageStatus(page)]; return <span className={cls}>{label}</span> })()}</td>
                        <td>{formatDate(page.lastPublishedAt)}</td>
                        <td>
                          <div className="jeeby-cms-table-actions">
                            <a href={'/admin/pages/' + encodeURIComponent(page.slug)}
                              aria-label={'Edit blocks for ' + page.slug}
                              className="jeeby-cms-btn-primary">Edit</a>
                            <button type="button" className="jeeby-cms-btn-ghost"
                              aria-label={`Delete ${page.slug}`}
                              onClick={(e) => { deleteBtnRef.current = e.currentTarget; handleDeleteClick(page) }}
                            >Delete</button>
                          </div>
                        </td>
                      </motion.tr>
                      {editError && editingSlug === page.slug && (
                        <tr>
                          <td colSpan={5}>
                            <p id={`cms-rename-error-${page.slug}`} role="alert" className="jeeby-cms-inline-error">{editError}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </>
          )
        })()}
      </table>
      </motion.div>
      </AnimatePresence>

      {(canGoPrev || canGoNext) && (
        <div className="jeeby-cms-pagination" role="navigation" aria-label="Page navigation">
          <button
            type="button"
            className="jeeby-cms-pagination-btn"
            onClick={goToPrevPage}
            disabled={!canGoPrev || loading}
            aria-label="Previous page"
          ><IconChevronLeft /> Prev</button>
          <span className="jeeby-cms-pagination-label" aria-live="polite">
            {totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`}
          </span>
          <button
            type="button"
            className="jeeby-cms-pagination-btn"
            onClick={goToNextPage}
            disabled={!canGoNext || loading}
            aria-label="Next page"
          >Next <IconChevronRight /></button>
        </div>
      )}

      <CreatePageModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          allPagesCacheRef.current = null
          prefetchRef.current = null
          loadPages()
          setAnnouncement('Page created successfully.')
        }}
        triggerRef={newPageBtnRef}
      />
      <MediaLibraryModal
        open={mediaLibraryOpen}
        mode="browse"
        onSelect={undefined}
        onClose={() => setMediaLibraryOpen(false)}
        triggerRef={mediaLibraryTriggerRef}
      />
      <DeletePageModal
        page={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          const slug = deleteTarget?.slug
          if (slug) setPages(prev => prev.filter(p => p.slug !== slug))
          setAnnouncement('Page deleted.')
          allPagesCacheRef.current = null
          prefetchRef.current = null
          setTimeout(() => loadPages(), 350)
        }}
        triggerRef={deleteBtnRef}
      />
    </div>
  )
}
