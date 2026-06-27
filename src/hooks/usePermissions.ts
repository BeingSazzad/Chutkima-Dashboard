import { useGetRolesQuery } from '@/services/endpoints/rolesApi'
import { useAuth } from './useAuth'

/**
 * Resolve the signed-in admin's role into module access + export rights.
 * Unknown role falls back to full access (so we never lock the only admin out).
 */
export function usePermissions() {
  const { user } = useAuth()
  const { data: roles = [] } = useGetRolesQuery()
  const role = roles.find((r) => r.id === user?.role)
  const full = !role || role.modules.includes('*')
  return {
    role,
    /** Can the current admin open this module (nav route path)? */
    allows: (moduleKey: string) => full || !!role?.modules.includes(moduleKey),
    canExport: role ? role.canExport : true,
    canExportCustomers: role ? role.canExportCustomers : true,
  }
}
