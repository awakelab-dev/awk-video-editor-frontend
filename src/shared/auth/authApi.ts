export type ApiValidationError = {
  field: string
  message: string
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
  errors?: ApiValidationError[]
  requestId?: string
}

export type AuthUser = {
  userId: string
  email: string
  username: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type LoginData = {
  accessToken: string
  token?: string
  bearerToken?: string
  tokenType: 'Bearer'
  expiresIn: string
  user: AuthUser
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  username: string
  password: string
}

export class ApiError extends Error {
  status: number
  body: ApiResponse<unknown>

  constructor(message: string, status: number, body: ApiResponse<unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://127.0.0.1:4000'
).replace(/\/$/, '')

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const contentType = response.headers.get('content-type')
  const body = contentType?.includes('application/json')
    ? ((await response.json()) as ApiResponse<T>)
    : ({
        success: response.ok,
        message: response.statusText || 'API error',
      } as ApiResponse<T>)

  if (!response.ok) {
    throw new ApiError(body.message || 'API error', response.status, body as ApiResponse<unknown>)
  }

  return body
}

export async function registerUser(input: RegisterInput) {
  const result = await apiFetch<{ user: AuthUser }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!result.data?.user) {
    throw new Error('Register response did not include user')
  }

  return result.data.user
}

export async function loginUser(credentials: LoginCredentials) {
  const result = await apiFetch<LoginData>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  const data = result.data
  if (!data?.accessToken) {
    throw new Error('Login response did not include accessToken')
  }

  return data
}

export async function getCurrentUser(token: string) {
  const result = await apiFetch<{ user: AuthUser }>('/api/v1/auth/me', { method: 'GET' }, token)

  if (!result.data?.user) {
    throw new Error('Current user response did not include user')
  }

  return result.data.user
}

export async function logoutUser(token: string) {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' }, token)
}
