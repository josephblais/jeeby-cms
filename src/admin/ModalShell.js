"use client"
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

// Ref-counted scroll lock — safe when multiple modals stack
let _scrollLockCount = 0
function lockScroll() {
  if (_scrollLockCount === 0) document.body.style.overflow = 'hidden'
  _scrollLockCount++
}
function unlockScroll() {
  _scrollLockCount = Math.max(0, _scrollLockCount - 1)
  if (_scrollLockCount === 0) document.body.style.overflow = ''
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Shell for all CMS modals. Handles:
 *   - backdrop + card structure
 *   - focus on open (prefers [data-autofocus], falls back to first focusable)
 *   - focus return on close (triggerRef)
 *   - Escape → onClose
 *   - Tab focus trap
 *
 * Props:
 *   open          bool         mount/show gate (default true — for always-mounted consumers)
 *   role          string       "dialog" | "alertdialog" (default "dialog")
 *   labelId       string       id of the heading element (aria-labelledby)
 *   descId        string?      id of the description element (aria-describedby)
 *   triggerRef    ref?         element to return focus to on close
 *   onClose       fn?          called on Escape
 *   backdropStyle object?      override backdrop inline styles (e.g. zIndex)
 *   cardClassName string?      additional class(es) for the card element
 *   children      ReactNode
 */
export function ModalShell({ open = true, role = 'dialog', labelId, descId, triggerRef, onClose, backdropStyle, backdropClassName, cardClassName, children }) {
  const dialogRef = useRef(null)
  const reduced = useReducedMotion()

  // Focus on open / return focus on close
  useEffect(() => {
    if (!open) {
      triggerRef?.current?.focus()
      return
    }
    const target =
      dialogRef.current?.querySelector('[data-autofocus]') ??
      dialogRef.current?.querySelector(FOCUSABLE)
    target?.focus()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll lock
  useEffect(() => {
    if (!open) return
    lockScroll()
    return unlockScroll
  }, [open])

  // Escape to close + Tab focus trap
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const nodes = dialog.querySelectorAll(FOCUSABLE)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={['jeeby-cms-modal-backdrop', backdropClassName].filter(Boolean).join(' ')}
          style={backdropStyle}
          onMouseDown={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            ref={dialogRef}
            role={role}
            aria-modal="true"
            aria-labelledby={labelId}
            aria-describedby={descId}
            className={['jeeby-cms-modal-card', cardClassName].filter(Boolean).join(' ')}
            onMouseDown={e => e.stopPropagation()}
            initial={{ scale: reduced ? 1 : 0.96, y: reduced ? 0 : 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: reduced ? 1 : 0.96, y: reduced ? 0 : 4, transition: { duration: reduced ? 0.01 : 0.15, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: reduced ? 0.01 : 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
