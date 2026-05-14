import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from './authStore'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession)
  const location = useLocation()

  if (!isAuthenticated && accessToken && isRestoringSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d11] text-sm text-[#9ca3af]">
        Restaurando sesión...
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <>{children}</>
}
