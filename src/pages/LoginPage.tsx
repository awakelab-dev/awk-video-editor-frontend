import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Clapperboard, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuthStore } from '../shared/auth/authStore'

type LocationState = { from?: { pathname?: string } }
type AuthMode = 'login' | 'register'
type FormErrors = {
  email?: string
  username?: string
  password?: string
}

function validatePasswordPolicy(password: string, email: string, username: string) {
  if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres'
  if (password.length > 64) return 'La contraseña no puede superar 64 caracteres'
  if (!/[a-z]/.test(password)) return 'Añade al menos una minúscula'
  if (!/[A-Z]/.test(password)) return 'Añade al menos una mayúscula'
  if (!/\d/.test(password)) return 'Añade al menos un número'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Añade al menos un carácter especial'

  const normalizedPassword = password.toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim().toLowerCase()

  if (normalizedEmail && normalizedPassword.includes(normalizedEmail)) {
    return 'La contraseña no debe contener el email'
  }

  if (normalizedUsername && normalizedPassword.includes(normalizedUsername)) {
    return 'La contraseña no debe contener el nombre de usuario'
  }

  return undefined
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/gallery'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectTo])

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'El email es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Introduce un email válido'
    }

    if (mode === 'register' && !username.trim()) {
      nextErrors.username = 'El nombre de usuario es obligatorio'
    }

    if (!password) {
      nextErrors.password = 'La contraseña es obligatoria'
    } else if (mode === 'register') {
      const passwordError = validatePasswordPolicy(password, email, username)
      if (passwordError) {
        nextErrors.password = passwordError
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError(null)
    if (!validate()) return

    setIsLoading(true)
    const result =
      mode === 'login'
        ? await login(email, password)
        : await register({ email, username, password })
    setIsLoading(false)

    if (!result.ok) {
      setAuthError(result.error)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setAuthError(null)
    setErrors({})
  }

  const inputClassName = (hasError?: string) =>
    `w-full rounded-md border bg-[#1a1a22] px-3 py-2.5 text-sm text-[#f0f0f4] outline-none transition placeholder:text-[#4b5563] ${
      hasError
        ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20'
        : 'border-[#2a2a34] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20'
    }`

  const title = mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'
  const subtitle =
    mode === 'login'
      ? 'Inicia sesión para continuar editando'
      : 'Regístrate para acceder a tus proyectos'
  const submitLabel = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
  const LoadingIcon = mode === 'login' ? LogIn : UserPlus

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a12] px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_42%,#0a0a12_78%)]" />
      </div>

      <div className="absolute left-6 top-6 z-10 flex items-center gap-2 text-sm font-bold tracking-[-0.02em] text-[#f0f0f4]">
        <Clapperboard className="h-5 w-5 text-[#6366f1]" />
        <span>VideoForge</span>
      </div>

      <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[11px] text-[#4b5563]">
        © 2026 VideoForge. Todos los derechos reservados.
      </p>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-[#2a2a34] bg-[#0f0f15]/95 p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1]/10 ring-1 ring-[#6366f1]/30">
              <Clapperboard className="h-6 w-6 text-[#6366f1]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em]">{title}</h1>
            <p className="mt-1.5 text-sm text-[#9ca3af]">{subtitle}</p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-md border border-[#2a2a34] bg-[#1a1a22] p-1">
            <button
              className={`rounded px-3 py-2 text-sm font-medium transition ${
                mode === 'login' ? 'bg-[#6366f1] text-white' : 'text-[#9ca3af] hover:text-[#f0f0f4]'
              }`}
              onClick={() => switchMode('login')}
              type="button"
            >
              Acceder
            </button>
            <button
              className={`rounded px-3 py-2 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-[#6366f1] text-white'
                  : 'text-[#9ca3af] hover:text-[#f0f0f4]'
              }`}
              onClick={() => switchMode('register')}
              type="button"
            >
              Registro
            </button>
          </div>

          {authError && (
            <div
              aria-live="assertive"
              className="mb-4 rounded-md border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fca5a5]"
              role="alert"
            >
              {authError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="auth-email">
                Email
              </label>
              <input
                autoComplete="email"
                className={inputClassName(errors.email)}
                id="auth-email"
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="tu@empresa.com"
                type="email"
                value={email}
              />
              {errors.email && <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.email}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="auth-username">
                  Usuario
                </label>
                <input
                  autoComplete="username"
                  className={inputClassName(errors.username)}
                  id="auth-username"
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }))
                  }}
                  placeholder="apidev"
                  type="text"
                  value={username}
                />
                {errors.username && (
                  <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="auth-password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`${inputClassName(errors.password)} pr-10`}
                  id="auth-password"
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] transition hover:text-[#f0f0f4]"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.password}</p>
              )}
            </div>

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#6366f1] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition hover:bg-[#818cf8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </>
              ) : (
                <>
                  <LoadingIcon className="h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
