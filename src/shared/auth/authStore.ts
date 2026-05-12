import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ApiError, loginUser, logoutUser, type AuthUser } from './authApi'

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}

function getAuthErrorMessage(error: unknown) {
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

  return 'No se pudo conectar con el servidor de autenticación'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: async (email, password) => {
        try {
          const auth = await loginUser({
            email: email.trim().toLowerCase(),
            password,
          })

          set({
            user: auth.user,
            accessToken: auth.accessToken,
            isAuthenticated: true,
          })

          return { ok: true }
        } catch (error) {
          set({ user: null, accessToken: null, isAuthenticated: false })
          return { ok: false, error: getAuthErrorMessage(error) }
        }
      },
      logout: async () => {
        const token = get().accessToken

        try {
          if (token) {
            await logoutUser(token)
          }
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false })
        }
      },
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
        }
      },
    },
  ),
)
