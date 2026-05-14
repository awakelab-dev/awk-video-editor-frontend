import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ApiError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
  type RegisterInput,
} from './authApi'

type AuthActionResult = { ok: true } | { ok: false; error: string }

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isRestoringSession: boolean
  login: (email: string, password: string) => Promise<AuthActionResult>
  register: (input: RegisterInput) => Promise<AuthActionResult>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
  clearAuth: () => void
}

function getAuthErrorMessage(error: unknown, fallbackMessage = 'No se pudo conectar con el servidor de autenticación') {
  if (error instanceof ApiError) {
    if (error.body.errors?.length) {
      return error.body.errors.map((validationError) => validationError.message).join(' ')
    }

    if (error.status === 401) {
      return 'Email o contraseña incorrectos'
    }

    if (error.status === 429) {
      return 'Demasiados intentos. Espera un momento antes de reintentar.'
    }

    return error.message || 'No se pudo iniciar sesión'
  }

  return fallbackMessage
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function clearSession() {
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isRestoringSession: false,
      login: async (email, password) => {
        try {
          const auth = await loginUser({
            email: normalizeEmail(email),
            password,
          })

          set({
            user: auth.user,
            accessToken: auth.accessToken,
            isAuthenticated: true,
          })

          return { ok: true }
        } catch (error) {
          set(clearSession())
          return { ok: false, error: getAuthErrorMessage(error) }
        }
      },
      register: async ({ email, username, password }) => {
        try {
          const normalizedEmail = normalizeEmail(email)

          await registerUser({
            email: normalizedEmail,
            username: username.trim(),
            password,
          })

          const auth = await loginUser({
            email: normalizedEmail,
            password,
          })

          set({
            user: auth.user,
            accessToken: auth.accessToken,
            isAuthenticated: true,
          })

          return { ok: true }
        } catch (error) {
          set(clearSession())
          return {
            ok: false,
            error: getAuthErrorMessage(error, 'No se pudo completar el registro'),
          }
        }
      },
      logout: async () => {
        const token = get().accessToken

        try {
          if (token) {
            await logoutUser(token)
          }
        } finally {
          set(clearSession())
        }
      },
      restoreSession: async () => {
        const token = get().accessToken

        if (!token) {
          set({ ...clearSession(), isRestoringSession: false })
          return
        }

        set({ isRestoringSession: true })

        try {
          const user = await getCurrentUser(token)
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isRestoringSession: false,
          })
        } catch {
          set({ ...clearSession(), isRestoringSession: false })
        }
      },
      clearAuth: () => set(clearSession()),
    }),
    {
      name: 'videoforge-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: Boolean(state.accessToken),
      }),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AuthState> | undefined
        return {
          user: state?.accessToken ? state.user ?? null : null,
          accessToken: state?.accessToken ?? null,
          isAuthenticated: Boolean(state?.accessToken),
          isRestoringSession: false,
        }
      },
    },
  ),
)
