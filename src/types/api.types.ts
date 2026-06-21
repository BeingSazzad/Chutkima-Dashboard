/** Transport-level types for API requests/responses. */

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'dispatcher'
  avatar: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface ApiError {
  status: number
  message: string
}
