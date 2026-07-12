import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as platformAuth from '../lib/platformAuth'
import type { PlatformUser } from '../types/platform'

interface PlatformAuthContextValue {
  user: PlatformUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<PlatformUser>
  logout: () => void
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | undefined>(undefined)

/** Single source of truth for the multi-role platform session, consumed by
 * the Navbar, Hero and every protected `/platform/*` page. Validates the
 * stored token against `/auth/me` once on load so a stale/expired token
 * doesn't leave the UI in a falsely-authenticated state. */
export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(() => platformAuth.getSession()?.user ?? null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const session = platformAuth.getSession()
    if (!session) {
      setIsLoading(false)
      return
    }
    platformAuth.fetchMe().then((validated) => {
      if (cancelled) return
      setUser(validated)
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const session = await platformAuth.login(username, password)
    setUser(session.user)
    return session.user
  }, [])

  const logout = useCallback(() => {
    platformAuth.logout()
    setUser(null)
  }, [])

  const value = useMemo<PlatformAuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout])

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext)
  if (!ctx) throw new Error('usePlatformAuth must be used within a PlatformAuthProvider')
  return ctx
}
