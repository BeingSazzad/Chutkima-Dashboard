import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { AuthUser } from '@/types/api.types'

interface PermissionGateProps {
  /** Roles allowed to see the children. */
  roles: AuthUser['role'][]
  children: ReactNode
  fallback?: ReactNode
}

/** Renders children only when the current user's role is permitted. */
export function PermissionGate({ roles, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}
