import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id: string
  email: string
  name: string
}

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
}

// Demo accounts — no backend, only for the simulation.
const DEMO_ACCOUNTS: Array<{ email: string; password: string; name: string }> = [
  { email: 'demo@videoforge.com', password: 'demo1234', name: 'Demo User' },
  { email: 'pablo@videoforge.com', password: 'pablo123', name: 'Pablo' },
  { email: 'admin@videoforge.com', password: 'admin1234', name: 'Admin' },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 800))

        const normalizedEmail = email.trim().toLowerCase()
        const match = DEMO_ACCOUNTS.find(
          (account) => account.email === normalizedEmail && account.password === password,
        )

        if (!match) {
          return { ok: false, error: 'Email o contraseña incorrectos' }
        }

        set({
          user: {
            id: normalizedEmail,
            email: match.email,
            name: match.name,
          },
          isAuthenticated: true,
        })

        return { ok: true }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'videoforge-auth',
    },
  ),
)

export const DEMO_CREDENTIALS = DEMO_ACCOUNTS
