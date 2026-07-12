import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePlatformAuth } from '../../contexts/PlatformAuthContext'

/** Gate for every `/platform/*` route: redirects to the login page (with a
 * `?redirect=` deep link back to the page the user tried to reach) when
 * there is no valid session, and shows a loading state while the session
 * is being validated against `/auth/me` on first load. */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = usePlatformAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/platform/login?redirect=${redirect}`} replace />
  }

  return <>{children}</>
}
