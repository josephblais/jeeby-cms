"use client"
import { useState, useEffect, useRef } from 'react'
import { useCMSFirebase } from '../index.js'
import { getPage, saveDraft, renamePage, publishPage } from '../firebase/firestore.js'
import { EditorHeader } from './EditorHeader.js'
import { BlockCanvas } from './BlockCanvas.js'
import { UndoToast } from './UndoToast.js'
import { UnsavedChangesWarning } from './UnsavedChangesWarning.js'
import { PublishConfirmModal } from './PublishConfirmModal.js'
import { PublishToast } from './PublishToast.js'

export function PageEditor({ slug }) {
  const { db } = useCMSFirebase()

  const [blocks, setBlocks] = useState([])
  const [pageName, setPageName] = useState('')
  const [loading, setLoading] = useState(true)
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
        if (!cancelled) setLoading(false)
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

  // Auto-dismiss publish toast after 3 seconds
  useEffect(() => {
    if (!showPublishToast) return
    const t = setTimeout(() => setShowPublishToast(false), 3000)
    return () => clearTimeout(t)
  }, [showPublishToast])

  function scheduleSave(updatedBlocks) {
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
  }

  function handleBlockChange(id, newData) {
    const updated = blocks.map(b => b.id === id ? { ...b, data: newData } : b)
    setBlocks(updated)
    scheduleSave(updated)
  }

  function handleReorder(newOrder) {
    setBlocks(newOrder)
    // Reorder fires once on drop — save immediately, no debounce
    pendingSaveRef.current = true
    setSaveStatus('saving')
    saveDraft(db, slug, newOrder)
      .then(() => { setSaveStatus('saved'); pendingSaveRef.current = false })
      .catch(() => { setSaveStatus('error'); pendingSaveRef.current = false })
  }

  function handleAddBlock(type, insertIndex, initialData) {
    const DEFAULT_DATA = {
      title:    { level: 'h2', text: '' },
      richtext: { html: '' },
      image:    { src: '', alt: '' },
      video:    { url: '' },
      gallery:  { items: [] },
      list:     { ordered: false, items: [''] },
    }
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      data: initialData ? { ...initialData } : { ...DEFAULT_DATA[type] },
    }
    const next = [...blocks]
    next.splice(insertIndex + 1, 0, newBlock)
    setBlocks(next)
    scheduleSave(next)
    // Focus first input in new block after React render
    requestAnimationFrame(() => {
      document.getElementById('block-input-' + newBlock.id)?.focus()
    })
  }

  function handleDelete(block) {
    const index = blocks.findIndex(b => b.id === block.id)
    const afterDelete = blocks.filter(b => b.id !== block.id)
    setBlocks(afterDelete)
    setDeletedBlock({ block, index })
    clearTimeout(deleteTimerRef.current)
    deleteTimerRef.current = setTimeout(() => {
      saveDraft(db, slug, blocksRef.current.filter(b => b.id !== block.id))
        .catch(() => setSaveStatus('error'))
      setDeletedBlock(null)
    }, 5000)
  }

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
      const updated = await getPage(db, slug)
      setLastPublishedAt(updated?.lastPublishedAt ?? null)
      setHasDraftChanges(false)
      setPublishStatus('idle')
      setShowPublishModal(false)
      setShowPublishToast(true)
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

  async function handleRenameSlug(newSlug) {
    try {
      await renamePage(db, slug, newSlug)
      window.location.href = '/admin/pages/' + newSlug
    } catch (err) {
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
        <div role="status" aria-label="Loading editor" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="jeeby-cms-spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className="jeeby-cms-page-editor">
      <EditorHeader
        pageName={pageName}
        slug={slug}
        saveStatus={saveStatus}
        onRetry={handleRetry}
        onBackClick={handleBackClick}
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

