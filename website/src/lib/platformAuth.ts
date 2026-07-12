import { PLATFORM_SESSION_KEY, platformFetchMe, platformLogin } from './platformApi'
import type { PlatformSession, PlatformUser } from '../types/platform'

/** Reads the persisted platform session (token + user) from localStorage. */
export function getSession(): PlatformSession | null {
  try {
    const raw = localStorage.getItem(PLATFORM_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlatformSession
    if (!parsed?.token || !parsed?.user) return null
    return parsed
  } catch {
    return null
  }
}

function setSession(session: PlatformSession | null) {
  try {
    if (session) localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(PLATFORM_SESSION_KEY)
  } catch { /* ignore */ }
}

/** Logs in against the multi-role platform auth endpoint and persists the session. */
export async function login(username: string, password: string): Promise<PlatformSession> {
  const res = await platformLogin({ username, password })
  const session: PlatformSession = { token: res.token, user: res.user }
  setSession(session)
  return session
}

/** Clears the persisted platform session. */
export function logout() {
  setSession(null)
}

/** Validates/refreshes the current session against the backend. Clears the
 * session and returns null if the token is invalid or expired. */
export async function fetchMe(): Promise<PlatformUser | null> {
  const current = getSession()
  if (!current) return null
  try {
    const user = await platformFetchMe(current.token)
    setSession({ token: current.token, user })
    return user
  } catch {
    setSession(null)
    return null
  }
}
