import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id: string
  email: string
  name: string
}

// Accounts stored in localStorage key so registration persists across reloads
const ACCOUNTS_KEY = 'videoforge-accounts'

function loadAccounts(): Array<{ email: string; password: string; name: string }> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveAccounts(accounts: Array<{ email: string; password: string; name: string }>) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

// Demo accounts — no backend, only for the simulation.
const DEMO_ACCOUNTS: Array<{ email: string; password: string; name: string }> = [
  { email: 'demo@videoforge.com', password: 'demo1234', name: 'Demo User' },
  { email: 'pablo@videoforge.com', password: 'pablo123', name: 'Pablo' },
  { email: 'admin@videoforge.com', password: 'admin1234', name: 'Admin' },
]

// Merge demo + registered accounts (registered take priority)
function getAllAccounts() {
  const registered = loadAccounts()
  const map = new Map<string, { email: string; password: string; name: string }>()
  for (const a of DEMO_ACCOUNTS) map.set(a.email, a)
  for (const a of registered) map.set(a.email, a)
  return [...map.values()]
}

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  register: (name: string, email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<{ ok: true; token: string } | { ok: false; error: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        await new Promise((resolve) => setTimeout(resolve, 800))

        const normalizedEmail = email.trim().toLowerCase()
        const match = getAllAccounts().find(
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

      register: async (name, email, password) => {
        await new Promise((resolve) => setTimeout(resolve, 600))

        const normalizedEmail = email.trim().toLowerCase()
        const all = getAllAccounts()

        if (all.some((a) => a.email === normalizedEmail)) {
          return { ok: false, error: 'Este email ya está registrado' }
        }

        const newAccount = { email: normalizedEmail, password, name: name.trim() }
        const registered = loadAccounts()
        registered.push(newAccount)
        saveAccounts(registered)

        set({
          user: {
            id: normalizedEmail,
            email: normalizedEmail,
            name: newAccount.name,
          },
          isAuthenticated: true,
        })

        return { ok: true }
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      forgotPassword: async (email) => {
        await new Promise((resolve) => setTimeout(resolve, 600))

        const normalizedEmail = email.trim().toLowerCase()
        const all = getAllAccounts()
        const match = all.find((a) => a.email === normalizedEmail)

        if (!match) {
          return { ok: false, error: 'No existe una cuenta con ese email' }
        }

        // Simulate token generation (in real life this is server-side)
        const token = `reset-${normalizedEmail}-${Date.now()}`
        localStorage.setItem(`videoforge-reset-token-${normalizedEmail}`, token)
        return { ok: true, token }
      },

      resetPassword: async (token, newPassword) => {
        await new Promise((resolve) => setTimeout(resolve, 600))

        const all = getAllAccounts()
        const account = all.find((a) => {
          const stored = localStorage.getItem(`videoforge-reset-token-${a.email}`)
          return stored === token
        })

        if (!account) {
          return { ok: false, error: 'Token inválido o expirado' }
        }

        // Update password in registered accounts
        const registered = loadAccounts()
        const idx = registered.findIndex((a) => a.email === account.email)
        if (idx >= 0) {
          registered[idx].password = newPassword
          saveAccounts(registered)
        } else {
          // It was a demo account — promote to registered
          registered.push({ ...account, password: newPassword })
          saveAccounts(registered)
        }

        localStorage.removeItem(`videoforge-reset-token-${account.email}`)
        return { ok: true }
      },
    }),
    {
      name: 'videoforge-auth',
    },
  ),
)

export const DEMO_CREDENTIALS = DEMO_ACCOUNTS
