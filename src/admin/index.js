// src/admin/index.js — admin entry
// No "use client" at entry level. Admin components will self-mark in later phases.

export function AdminPanel() {
  return null
}

export function withCMSAuth() {
  return function middleware(_req, _res, next) {
    if (next) next()
  }
}
