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
        maxWidth: '400px', minWidth: '320px', margin: '0 auto',
        padding: '32px', background: '#fff', border: '1px solid #E5E7EB',
        borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 className="jeeby-cms-login-heading" style={{
          fontSize: '20px', fontWeight: 600, lineHeight: 1.2, marginBottom: '24px'
        }}>jeeby CMS</h1>
        <form className="jeeby-cms-login-form" onSubmit={handleSubmit} noValidate>
          <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
            <label htmlFor="cms-email" style={{
              display: 'block', fontSize: '14px', fontWeight: 600, lineHeight: 1.4, marginBottom: '4px', color: '#374151'
            }}>Email address</label>
            <input
              id="cms-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                display: 'block', width: '100%', padding: '8px 16px', fontSize: '16px',
                border: '1px solid #D1D5DB', borderRadius: '4px', boxSizing: 'border-box'
              }}
            />
          </div>
          <div className="jeeby-cms-field" style={{ marginBottom: '16px' }}>
            <label htmlFor="cms-password" style={{
              display: 'block', fontSize: '14px', fontWeight: 600, lineHeight: 1.4, marginBottom: '4px', color: '#374151'
            }}>Password</label>
            <input
              id="cms-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                display: 'block', width: '100%', padding: '8px 16px', fontSize: '16px',
                border: '1px solid #D1D5DB', borderRadius: '4px', boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit"
            className="jeeby-cms-btn-primary"
            disabled={submitting}
            aria-busy={submitting ? 'true' : undefined}
            style={{
              display: 'block', width: '100%', minHeight: '44px', padding: '8px 16px',
              fontSize: '16px', fontWeight: 600, color: '#fff', background: '#2563EB',
              border: 'none', borderRadius: '4px', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? 'Signing in\u2026' : 'Sign in'}
          </button>
          {error && (
            <p className="jeeby-cms-auth-error" role="alert" aria-live="assertive" style={{
              marginTop: '12px', color: '#DC2626', fontSize: '14px'
            }}>{error}</p>
          )}
        </form>
      </div>
    </main>
  )
}
