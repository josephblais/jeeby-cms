"use client"
import { useState } from 'react'
import { useAuth } from '../index.js'
import { useT } from './useT.js'

export function LoginPage({ siteName }) {
  const { signIn } = useAuth()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      // Success: onAuthStateChanged fires -> AdminPanel re-renders to shell
    } catch (err) {
      // Firebase error codes: auth/invalid-credential, auth/user-not-found, etc.
      // Map all to generic message per CONTEXT.md
      setError(t('invalidCredentials'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="jeeby-cms-login-page" role="main">
      <div className="jeeby-cms-login-card">
        <div className="jeeby-cms-login-brand">
          <h1 className="jeeby-cms-login-heading">{siteName ?? 'Admin'}</h1>
        </div>
        <div className="jeeby-cms-login-form-pane">
          <form className="jeeby-cms-login-form" onSubmit={handleSubmit} noValidate>
          <div className="jeeby-cms-field">
            <label htmlFor="cms-email">{t('emailAddress')}</label>
            <input
              id="cms-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="jeeby-cms-field">
            <label htmlFor="cms-password">{t('password')}</label>
            <div className="jeeby-cms-password-wrapper">
              <input
                id="cms-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="jeeby-cms-password-toggle"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? (
                  /* Eye-off icon — password visible, click to hide */
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 2l12 12" />
                    <path d="M6.5 6.6A3 3 0 0 0 8 11a3 3 0 0 0 3-3 3 3 0 0 0-.4-1.5" />
                    <path d="M9.88 3.28A8.9 8.9 0 0 0 8 3C4.5 3 1.5 5.5 1 8c.3 1.3 1 2.5 2 3.4" />
                    <path d="M12.6 10.7C13.6 9.8 14.4 9 15 8c-.5-2.5-3.5-5-7-5" />
                  </svg>
                ) : (
                  /* Eye icon — password hidden, click to show */
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 8C1.5 5.5 4.5 3 8 3s6.5 2.5 7 5c-.5 2.5-3.5 5-7 5S1.5 10.5 1 8z" />
                    <circle cx="8" cy="8" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="jeeby-cms-btn-primary"
            disabled={submitting}
            aria-busy={submitting ? 'true' : undefined}
            style={{ cursor: submitting ? 'not-allowed' : 'pointer', display: 'block', width: '100%' }}
          >
            {submitting ? t('signingIn') : t('signIn')}
          </button>
          {error && (
            <p className="jeeby-cms-auth-error" role="alert" aria-live="assertive">{error}</p>
          )}
          </form>
        </div>
      </div>
    </main>
  )
}
