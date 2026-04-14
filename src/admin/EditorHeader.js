"use client"
import { useState, useEffect } from 'react'
import { useT, tf } from './useT.js'

// Derives a single compound status from all document signals.
// Priority: error > saving > unpublished changes > published > idle.
// Takes t() so labels are localized.
function getDocumentStatus({ saveStatus, hasDraftChanges, lastPublishedAt, t }) {
  if (saveStatus === 'error') {
    return { label: t('saveFailed'), tone: 'error', retry: true, sublabel: null }
  }
  if (saveStatus === 'saving') {
    return { label: t('saving'), tone: 'muted', retry: false, sublabel: null }
  }
  if (hasDraftChanges) {
    const wasPublished = !!lastPublishedAt
    return {
      label: wasPublished && saveStatus === 'saved' ? t('unpublishedChanges') :
             saveStatus === 'saved' ? t('unpublishedSaved') : t('unsavedChanges'),
      tone: 'draft',
      retry: false,
      sublabel: wasPublished ? formatLastPublished(lastPublishedAt, t) : null,
    }
  }
  if (lastPublishedAt) {
    const label = formatPublishedDate(lastPublishedAt, t)
    return { label, tone: 'published', retry: false, sublabel: null }
  }
  return { label: t('notYetLive'), tone: 'muted', retry: false, sublabel: null }
}

function formatPublishedDate(ts, t) {
  if (!ts) return t('published')
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const isToday = date.toDateString() === new Date().toDateString()
  if (isToday) {
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return tf(t('publishedTodayAt'), { time })
  }
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return tf(t('publishedOn'), { date: dateStr })
}

function formatLastPublished(ts, t) {
  if (!ts) return null
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === new Date().toDateString()) {
    return tf(t('lastPublishedTodayAt'), { time })
  }
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return tf(t('lastPublishedOn'), { date: dateStr, time })
}

export function EditorHeader({ pageName, slug, pageUrl, saveStatus, onRetry, onBackClick, onRenameName, onRenameSlug, lastPublishedAt, hasDraftChanges, onPublish, publishStatus, publishBtnRef, onOpenMeta, metaBtnRef }) {
  const t = useT()
  const displayName = pageName || slug

  // Title inline edit
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(displayName)

  // Slug inline edit
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugValue, setSlugValue] = useState(slug)
  const [slugDirty, setSlugDirty] = useState(false)

  const status = getDocumentStatus({ saveStatus, hasDraftChanges, lastPublishedAt, t })

  // Copy URL feedback
  const [copied, setCopied] = useState(false)
  function handleCopyUrl() {
    navigator.clipboard.writeText(window.location.origin + pageUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Sync from props after external rename
  useEffect(() => { setTitleValue(pageName || slug) }, [pageName, slug])
  useEffect(() => { setSlugValue(slug); setSlugDirty(false) }, [slug])

  // ── Title handlers ──────────────────────────────────────────────

  function commitTitle() {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== displayName) {
      onRenameName(trimmed)
    } else {
      setTitleValue(displayName)
    }
    setEditingTitle(false)
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur() }
    if (e.key === 'Escape') { setTitleValue(displayName); setEditingTitle(false) }
  }

  // ── Slug handlers ───────────────────────────────────────────────

  function commitSlug() {
    const trimmed = slugValue.trim()
    if (trimmed && trimmed !== slug) {
      onRenameSlug(trimmed)
    } else {
      setSlugValue(slug)
      setSlugDirty(false)
    }
    setEditingSlug(false)
  }

  function handleSlugChange(e) {
    setSlugValue(e.target.value)
    setSlugDirty(e.target.value !== slug)
  }

  function handleSlugKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur() }
    if (e.key === 'Escape') { setSlugValue(slug); setSlugDirty(false); setEditingSlug(false) }
  }

  return (
    <header className="jeeby-cms-editor-header">

      {/* Left zone: back navigation */}
      <div className="jeeby-cms-editor-zone-left">
        <a
          href="/admin"
          onClick={onBackClick}
          className="jeeby-cms-editor-back"
          aria-label={t('backToPages')}
        >
          ← {t('pages')}
        </a>
      </div>

      {/* Center zone: page identity — editable title + editable slug */}
      <div className="jeeby-cms-editor-zone-center">
        {editingTitle ? (
          <input
            type="text"
            className="jeeby-cms-editor-title-input"
            value={titleValue}
            aria-label={t('pageNameLabel')}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          /*
           * <button> inside <h1>: valid HTML5. The heading provides document structure;
           * the button provides the native interactive semantics (keyboard operable,
           * announced as "button" by screen readers). WCAG 4.1.2 satisfied.
           */
          <h1 className="jeeby-cms-editor-title">
            <button
              className="jeeby-cms-editor-title-btn"
              onClick={() => setEditingTitle(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingTitle(true) } }}
              aria-label={tf(t('pageNameEdit'), { name: displayName })}
            >
              {displayName}
            </button>
          </h1>
        )}

        <div className="jeeby-cms-slug-row">
          <span className="jeeby-cms-slug-prefix" aria-hidden="true">/</span>
          {editingSlug ? (
            <>
              <input
                type="text"
                className="jeeby-cms-slug-input"
                value={slugValue}
                aria-label={t('pageSlugLabel')}
                onChange={handleSlugChange}
                onBlur={commitSlug}
                onKeyDown={handleSlugKeyDown}
                autoFocus
              />
              {slugDirty && (
                <span className="jeeby-cms-slug-hint" aria-live="polite">
                  {t('enterToSave')}
                </span>
              )}
            </>
          ) : (
            <button
              className="jeeby-cms-slug-read-btn"
              onClick={() => setEditingSlug(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingSlug(true) } }}
              aria-label={tf(t('pageSlugEdit'), { slug })}
            >
              {slug}
            </button>
          )}
        </div>
      </div>

      {/* Right zone: document status chip + publish action */}
      <div className="jeeby-cms-editor-zone-right">
        <div
          role="status"
          aria-live={saveStatus === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          className="jeeby-cms-doc-status-container"
        >
          <div className={`jeeby-cms-doc-status jeeby-cms-doc-status--${status.tone}`}>
            <span>{status.label}</span>
            {status.retry && (
              <button
                type="button"
                className="jeeby-cms-status-retry"
                onClick={onRetry}
              >
                {t('tryAgain')}
              </button>
            )}
          </div>
          {status.sublabel && (
            <span className="jeeby-cms-doc-status-sublabel">{status.sublabel}</span>
          )}
        </div>
        <button
          ref={metaBtnRef}
          type="button"
          className="jeeby-cms-btn-ghost"
          onClick={onOpenMeta}
          aria-label={t('pageSettings')}
        >{t('settings')}</button>
        {lastPublishedAt && (
          <div className="jeeby-cms-editor-page-links">
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="jeeby-cms-btn-ghost"
              aria-label={tf(t('viewPageAriaLabel'), { url: pageUrl })}
            >{t('viewPage')}</a>
            <button
              type="button"
              className="jeeby-cms-btn-ghost"
              onClick={handleCopyUrl}
              aria-label={copied ? t('urlCopied') : tf(t('copyUrlAriaLabel'), { url: pageUrl })}
              aria-live="polite"
            >{copied ? t('copied') : t('copyUrl')}</button>
          </div>
        )}
        <button
          ref={publishBtnRef}
          type="button"
          className="jeeby-cms-btn-primary"
          onClick={onPublish}
          aria-disabled={publishStatus === 'publishing' || saveStatus === 'saving' ? 'true' : undefined}
          aria-busy={publishStatus === 'publishing' ? 'true' : undefined}
          style={{
            cursor: publishStatus === 'publishing' || saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            pointerEvents: publishStatus === 'publishing' || saveStatus === 'saving' ? 'none' : undefined,
          }}
        >
          {publishStatus === 'publishing' ? t('publishing') : t('publish')}
        </button>
      </div>

    </header>
  )
}
