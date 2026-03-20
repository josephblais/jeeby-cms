"use client"
import { createContext, useContext } from 'react'

// Lets PageEditor register pending-changes state with AdminPanel so the
// sign-out button can prompt before discarding unpublished work.
//
// Value: { setGuard(guard), clearGuard() }
// guard: { hasPending: () => bool, pageName: string, onPublish: async () => void }
export const SignOutGuardContext = createContext(null)
export const useSignOutGuard = () => useContext(SignOutGuardContext)
