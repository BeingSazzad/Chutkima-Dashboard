import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout as logoutAction } from '@/store/authSlice'

/** Convenience access to the authenticated user + auth actions. */
export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, token } = useAppSelector((s) => s.auth)

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    logout: () => dispatch(logoutAction()),
  }
}
