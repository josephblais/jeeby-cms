"use client"
import { useState } from 'react'
import { useAuth } from '../index.js'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="jeeby-cms-login-page" role="main">
      <div className="jeeby-cms-login-card" style={{
        maxWidth: '400px', minWidth: '320px', margin: '0 auto', padding: '32px'
      }}>
        <h1 className="jeeby-cms-login-heading" style={{ marginBottom: '24px' }}>jeeby CMS</h1>
        <form className="jeeby-cms-login-form" onSubmit={handleSubmit} noValidate>
          <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
            <label htmlFor="cms-email" style={{ display: 'block', marginBottom: '4px' }}>Email address</label>
            <input
              id="cms-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 16px', boxSizing: 'border-box' }}
            />
          </div>
          <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
            <label htmlFor="cms-password" style={{ display: 'block', marginBottom: '4px' }}>Password</label>
            <input
              id="cms-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 16px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            className="jeeby-cms-btn-primary"
            disabled={submitting}
            aria-busy={submitting ? 'true' : undefined}
            style={{
              display: 'block', width: '100%', minHeight: '44px', padding: '8px 16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? 'Signing in\u2026' : 'Sign in'}
          </button>
          {error && (
            <p className="jeeby-cms-auth-error" role="alert" aria-live="assertive" style={{ marginTop: '12px' }}>{error}</p>
          )}
        </form>
      </div>
    </main>
  )
}
