"use client"
import { useState, useEffect } from 'react'

export function EditorHeader({ slug, saveStatus, onRetry, onBackClick }) {
  return (
    <header className="jeeby-cms-editor-header" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF'
    }}>
      <a
        href="/admin"
        onClick={onBackClick}
        aria-label="Back to Pages"
        style={{ color: '#2563EB', textDecoration: 'none', fontSize: '14px', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
      >
        ← Pages
      </a>

      <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#111827' }}>
        {slug}
      </h1>

      <div
        role="status"
        aria-live={saveStatus === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        style={{ fontSize: '14px', minWidth: '100px', textAlign: 'right' }}
      >
        {saveStatus === 'saving' && <span style={{ color: '#2563EB' }}>Saving...</span>}
        {saveStatus === 'saved' && <span style={{ color: '#2563EB' }}>Saved</span>}
        {saveStatus === 'error' && (
          <span style={{ color: '#DC2626' }}>
            Save failed.{' '}
            <button
              type="button"
              onClick={onRetry}
              style={{
                color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer',
                textDecoration: 'underline', fontSize: '14px', minHeight: '44px', padding: '4px'
              }}
            >Retry?</button>
          </span>
        )}
      </div>
    </header>
  )
}
