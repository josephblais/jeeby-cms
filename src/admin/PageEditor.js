"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCMSFirebase } from '../index.js'
import { getPage, saveDraft, renamePage, publishPage, savePage } from '../firebase/firestore.js'
import { EditorHeader } from './EditorHeader.js'
import { BlockCanvas } from './BlockCanvas.js'
import { UndoToast } from './UndoToast.js'
import { UnsavedChangesWarning } from './UnsavedChangesWarning.js'
import { PublishConfirmModal } from './PublishConfirmModal.js'
import { PublishToast } from './PublishToast.js'
import { useSignOutGuard } from './SignOutGuardContext.js'

const DEFAULT_BLOCK_DATA = {
  title:    { level: 'h2', text: '' },
  richtext: { html: '' },
  image:    { src: '', alt: '' },
  video:    { url: '' },
  gallery:  { items: [] },
  list:     { ordered: false, items: [''] },
}

export function PageEditor({ slug }) {
  const { db } = useCMSFirebase()
  const signOutGuard = useSignOutGuard()

  const [blocks, setBlocks] = useState([])
  const [pageName, setPageName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [deletedBlock, setDeletedBlock] = useState(null)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [lastPublishedAt, setLastPublishedAt] = useState(null)
  const [hasDraftChanges, setHasDraftChanges] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishStatus, setPublishStatus] = useState('idle')
  const [publishError, setPublishError] = useState(null)
  const [showPublishToast, setShowPublishToast] = useState(false)

  const debounceRef = useRef(null)
  const deleteTimerRef = useRef(null)
  const blocksRef = useRef(blocks)
  const pendingSaveRef = useRef(false)
  const publishBtnRef = useRef(null)
  const containerRef = useRef(null)

  // Mirror blocks into ref to avoid stale closures in setTimeout
  useEffect(() => { blocksRef.current = blocks }, [blocks])

  // Load draft blocks on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const page = await getPage(db, slug)
        if (!cancelled) {
          setBlocks(page?.draft?.blocks ?? [])
          setPageName(page?.name ?? slug)
          setLastPublishedAt(page?.lastPublishedAt ?? null)
          setHasDraftChanges(page?.hasDraftChanges ?? false)
          setLoading(false)
        }
      } catch {
        if (!cancelled) { setLoading(false); setLoadError(true) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [db, slug])

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    clearTimeout(deleteTimerRef.current)
  }, [])

  // Hide nav on scroll down, reveal on scroll up.
  // Listens on .jeeby-cms-admin which is the single scroll container.
  // Depends on `loading`: the containerRef div only exists in the non-loading
  // render branch, so the effect must re-run once loading becomes false.
  useEffect(() => {
    if (loading) return
    const el = containerRef.current
    if (!el) return
    const admin = el.closest('.jeeby-cms-admin')
    if (!admin) return
    let lastY = 0
    function onScroll() {
      const y = admin.scrollTop
      const delta = y - lastY
      if (delta > 8 && y > 56) {
        admin.classList.add('jeeby-cms-nav-hidden')
      } else if (delta < -8) {
        admin.classList.remove('jeeby-cms-nav-hidden')
      }
      lastY = y
    }
    admin.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      admin.removeEventListener('scroll', onScroll)
      admin.classList.remove('jeeby-cms-nav-hidden')
    }
  }, [loading])

  // Register pending-changes guard with AdminPanel so sign-out can prompt.
  // Re-registers whenever hasDraftChanges or pageName changes.
  useEffect(() => {
    if (!signOutGuard) return
    signOutGuard.setGuard({
      hasPending: () => hasDraftChanges || pendingSaveRef.current,
      pageName: pageName || slug,
      onPublish: handlePublish,
    })
    return () => { signOutGuard.clearGuard() }
  }, [signOutGuard, hasDraftChanges, pageName, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss publish toast after 3 seconds
  useEffect(() => {
    if (!showPublishToast) return
    const t = setTimeout(() => setShowPublishToast(false), 3000)
    return () => clearTimeout(t)
  }, [showPublishToast])

  const scheduleSave = useCallback((updatedBlocks) => {
    pendingSaveRef.current = true
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await saveDraft(db, slug, updatedBlocks)
        setSaveStatus('saved')
        setHasDraftChanges(true)
        pendingSaveRef.current = false
      } catch {
        setSaveStatus('error')
        pendingSaveRef.current = false
      }
    }, 1000)
  }, [db, slug])

  const handleBlockChange = useCallback((id, newData) => {
    const updated = blocksRef.current.map(b => b.id === id ? { ...b, data: newData } : b)
    setBlocks(updated)
    scheduleSave(updated)
  }, [scheduleSave])

  const handleReorder = useCallback((newOrder) => {
    setBlocks(newOrder)
    // Reorder fires once on drop — save immediately, no debounce
    pendingSaveRef.current = true
    setSaveStatus('saving')
    saveDraft(db, slug, newOrder)
      .then(() => { setSaveStatus('saved'); pendingSaveRef.current = false })
      .catch(() => { setSaveStatus('error'); pendingSaveRef.current = false })
  }, [db, slug])

  const handleAddBlock = useCallback((type, insertIndex, initialData) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      data: initialData ? { ...initialData } : { ...(DEFAULT_BLOCK_DATA[type] ?? DEFAULT_BLOCK_DATA.richtext) },
    }
    const next = [...blocksRef.current]
    next.splice(insertIndex + 1, 0, newBlock)
    setBlocks(next)
    scheduleSave(next)
    // Focus first input in new block after React render
    requestAnimationFrame(() => {
      document.getElementById('block-input-' + newBlock.id)?.focus()
    })
  }, [scheduleSave])

  const handleDelete = useCallback((block) => {
    const index = blocksRef.current.findIndex(b => b.id === block.id)
    const afterDelete = blocksRef.current.filter(b => b.id !== block.id)
    setBlocks(afterDelete)
    setDeletedBlock({ block, index })
    clearTimeout(deleteTimerRef.current)
    deleteTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await saveDraft(db, slug, blocksRef.current.filter(b => b.id !== block.id))
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
      setDeletedBlock(null)
    }, 5000)
  }, [db, slug])

  function handleUndo() {
    if (!deletedBlock) return
    clearTimeout(deleteTimerRef.current)
    setBlocks(prev => {
      const next = [...prev]
      next.splice(deletedBlock.index, 0, deletedBlock.block)
      return next
    })
    setDeletedBlock(null)
  }

  async function handleRetry() {
    setSaveStatus('saving')
    try {
      await saveDraft(db, slug, blocksRef.current)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  async function handlePublish() {
    setPublishStatus('publishing')
    setPublishError(null)
    try {
      await publishPage(db, slug)
      setHasDraftChanges(false)
      setPublishStatus('idle')
      setShowPublishModal(false)
      setShowPublishToast(true)
      // Best-effort refresh of lastPublishedAt — don't block publish success on this read
      getPage(db, slug)
        .then(updated => { if (updated?.lastPublishedAt) setLastPublishedAt(updated.lastPublishedAt) })
        .catch(() => {})
    } catch {
      setPublishStatus('error')
      setPublishError(true)
    }
  }

  function openPublishModal() {
    setPublishError(null)
    setPublishStatus('idle')
    setShowPublishModal(true)
  }

  async function handleRenameName(newName) {
    try {
      await savePage(db, slug, { name: newName })
      setPageName(newName)
    } catch {
      setSaveStatus('error')
    }
  }

  async function handleRenameSlug(newSlug) {
    try {
      await renamePage(db, slug, newSlug)
      // Cancel any pending debounced save — the old slug is gone after rename
      clearTimeout(debounceRef.current)
      pendingSaveRef.current = false
      window.location.href = '/admin/pages/' + encodeURIComponent(newSlug)
    } catch {
      setSaveStatus('error')
    }
  }

  function handleBackClick(e) {
    if (pendingSaveRef.current) {
      e.preventDefault()
      setShowUnsavedWarning(true)
    }
  }

  if (loading) {
    return (
      <div className="jeeby-cms-page-editor">
        <div role="status" aria-label="Loading editor" className="jeeby-cms-loading">
          <div className="jeeby-cms-spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="jeeby-cms-page-editor">
        <div className="jeeby-cms-editor-load-error" role="alert">
          <p className="jeeby-cms-editor-load-error-title">This page couldn&rsquo;t be loaded</p>
          <p className="jeeby-cms-editor-load-error-body">Check your connection and try again.</p>
          <a href={'/admin/pages/' + encodeURIComponent(slug)} className="jeeby-cms-btn-primary">
            Reload
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="jeeby-cms-page-editor" ref={containerRef}>
      <EditorHeader
        pageName={pageName}
        slug={slug}
        saveStatus={saveStatus}
        onRetry={handleRetry}
        onBackClick={handleBackClick}
        onRenameName={handleRenameName}
        onRenameSlug={handleRenameSlug}
        lastPublishedAt={lastPublishedAt}
        hasDraftChanges={hasDraftChanges}
        onPublish={openPublishModal}
        publishStatus={publishStatus}
        publishBtnRef={publishBtnRef}
      />
      <div className="jeeby-cms-editor-main">
        <BlockCanvas
          blocks={blocks}
          onReorder={handleReorder}
          onChange={handleBlockChange}
          onDelete={handleDelete}
          onAddBlock={handleAddBlock}
        />
      </div>
      {deletedBlock && (
        <UndoToast
          blockType={deletedBlock.block.type}
          onUndo={handleUndo}
        />
      )}
      {showUnsavedWarning && (
        <UnsavedChangesWarning
          onLeave={() => { window.location.href = '/admin' }}
          onStay={() => { setShowUnsavedWarning(false) }}
        />
      )}
      {showPublishModal && (
        <PublishConfirmModal
          open={showPublishModal}
          pageName={pageName}
          onClose={() => setShowPublishModal(false)}
          onConfirm={handlePublish}
          triggerRef={publishBtnRef}
          publishing={publishStatus === 'publishing'}
          publishError={publishError}
        />
      )}
      {showPublishToast && <PublishToast />}
    </div>
  )
}

