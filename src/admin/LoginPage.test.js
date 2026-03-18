import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Source inspection tests for LoginPage structure and accessibility
test('LoginPage source has explicit labels for email and password', () => {
  const src = readFileSync(new URL('./LoginPage.js', import.meta.url), 'utf8')
  assert.ok(src.includes('htmlFor="cms-email"'), 'Must have label for email input')
  assert.ok(src.includes('htmlFor="cms-password"'), 'Must have label for password input')
  assert.ok(src.includes('id="cms-email"'), 'Email input must have matching id')
  assert.ok(src.includes('id="cms-password"'), 'Password input must have matching id')
})

test('LoginPage source has correct input types and autocomplete', () => {
  const src = readFileSync(new URL('./LoginPage.js', import.meta.url), 'utf8')
  assert.ok(src.includes('type="email"'), 'Must have type="email"')
  assert.ok(src.includes('type="password"'), 'Must have type="password"')
  assert.ok(src.includes('autoComplete="email"'), 'Must have autoComplete="email"')
  assert.ok(src.includes('autoComplete="current-password"'), 'Must have autoComplete="current-password"')
})

test('LoginPage source has accessible error display', () => {
  const src = readFileSync(new URL('./LoginPage.js', import.meta.url), 'utf8')
  assert.ok(src.includes('role="alert"'), 'Error must have role="alert"')
  assert.ok(src.includes('aria-live="assertive"'), 'Error must have aria-live="assertive"')
})

test('LoginPage source has accessible submit button', () => {
  const src = readFileSync(new URL('./LoginPage.js', import.meta.url), 'utf8')
  assert.ok(src.includes('type="submit"'), 'Must use button type="submit"')
  assert.ok(src.includes('disabled={submitting}'), 'Must disable during submission')
  assert.ok(src.includes('aria-busy'), 'Must have aria-busy during submission')
})

test('LoginPage source uses useAuth signIn', () => {
  const src = readFileSync(new URL('./LoginPage.js', import.meta.url), 'utf8')
  assert.ok(src.includes("useAuth"), 'Must import useAuth')
  assert.ok(src.includes('signIn(email, password)') || src.includes('signIn(email,password)'), 'Must call signIn with email and password')
})

test('LoginPage source has generic error message', () => {
  const src = readFileSync(new URL('./LoginPage.js', import.meta.url), 'utf8')
  assert.ok(src.includes('Invalid email or password'), 'Must show generic error message per CONTEXT.md')
})

test('LoginPage is exported from LoginPage.js', async () => {
  let mod
  try { mod = await import('./LoginPage.js') } catch { return }
  assert.equal(typeof mod.LoginPage, 'function', 'LoginPage must be a function')
})
