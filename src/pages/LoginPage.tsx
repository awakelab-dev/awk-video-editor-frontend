import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Clapperboard, Eye, EyeOff, Info } from 'lucide-react'
import { DEMO_CREDENTIALS, useAuthStore } from '../shared/auth/authStore'

type LocationState = { from?: { pathname?: string } }

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/gallery'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectTo])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showDemoHelp, setShowDemoHelp] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!email.trim()) {
      nextErrors.email = 'El email es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Introduce un email válido'
    }
    if (!password) {
      nextErrors.password = 'La contraseña es obligatoria'
    } else if (password.length < 6) {
      nextErrors.password = 'Mínimo 6 caracteres'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setAuthError(null)
    if (!validate()) return

    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)

    if (!result.ok) {
      setAuthError(result.error)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setErrors({})
    setAuthError(null)
  }

  const inputClassName = (hasError?: string) =>
    `w-full rounded-md border bg-[#1a1a22] px-3 py-2.5 text-sm text-[#f0f0f4] outline-none transition placeholder:text-[#4b5563] ${
      hasError
        ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20'
        : 'border-[#2a2a34] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20'
    }`

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a12] px-4 py-10">
      {/* Ambient background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#6366f1]/20 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-[420px] w-[420px] rounded-full bg-[#8b5cf6]/15 blur-[120px]" />
        <div className="absolute left-1/2 top-0 h-[260px] w-[600px] -translate-x-1/2 rounded-full bg-[#6366f1]/10 blur-[100px]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a12_85%)]" />
      </div>

      {/* Top brand */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-2 text-sm font-bold tracking-[-0.02em] text-[#f0f0f4]">
        <Clapperboard className="h-5 w-5 text-[#6366f1]" />
        <span>VideoForge</span>
      </div>

      {/* Bottom copyright */}
      <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[11px] text-[#4b5563]">
        © 2026 VideoForge. Todos los derechos reservados.
      </p>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-[#2a2a34] bg-[#0f0f15]/90 p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1]/10 ring-1 ring-[#6366f1]/30">
              <Clapperboard className="h-6 w-6 text-[#6366f1]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em]">Bienvenido de nuevo</h1>
            <p className="mt-1.5 text-sm text-[#9ca3af]">
              Inicia sesión para continuar editando
            </p>
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
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="login-email">
                Email
              </label>
              <input
                autoComplete="email"
                className={inputClassName(errors.email)}
                id="login-email"
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="tu@empresa.com"
                type="email"
                value={email}
              />
              {errors.email && (
                <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="login-password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className={`${inputClassName(errors.password)} pr-10`}
                  id="login-password"
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <input
                  checked={rememberMe}
                  className="h-3.5 w-3.5 rounded border-[#2a2a34] bg-[#25252e] accent-[#6366f1]"
                  onChange={(e) => setRememberMe(e.target.checked)}
                  type="checkbox"
                />
                Recordarme
              </label>
              <button className="text-xs font-medium text-[#6366f1] transition hover:text-[#818cf8]" type="button">
                ¿Olvidaste la contraseña?
              </button>
            </div>

            <button
              className="inline-flex w-full items-center justify-center rounded-md bg-[#6366f1] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition hover:bg-[#818cf8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando sesión…
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2a2a34]" />
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#4b5563]">o continúa con</span>
            <div className="h-px flex-1 bg-[#2a2a34]" />
          </div>

          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#2a2a34] bg-[#1a1a20] px-4 py-2.5 text-sm font-medium text-[#f0f0f4] transition hover:border-[#3a3a48] hover:bg-[#22222d]"
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="mt-5 text-center text-xs text-[#9ca3af]">
            ¿No tienes cuenta?{' '}
            <button className="font-medium text-[#6366f1] transition hover:text-[#818cf8]" type="button">
              Regístrate
            </button>
          </p>
        </div>

        {/* Demo accounts helper outside the card */}
        <div className="mt-4 rounded-xl border border-[#2a2a34] bg-[#0f0f15]/70 p-3 backdrop-blur-sm">
          <button
            className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-[#9ca3af] transition hover:text-[#f0f0f4]"
            onClick={() => setShowDemoHelp((prev) => !prev)}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              Cuentas de demostración
            </span>
            <span className="text-[10px] text-[#6b7280]">{showDemoHelp ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          {showDemoHelp && (
            <ul className="mt-3 space-y-2">
              {DEMO_CREDENTIALS.map((credential) => (
                <li key={credential.email}>
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded border border-[#2a2a34] bg-[#1a1a20] px-2.5 py-2 text-left text-[11px] text-[#d1d5db] transition hover:border-[#6366f1] hover:bg-[#1f1f2d]"
                    onClick={() => fillDemoCredentials(credential.email, credential.password)}
                    type="button"
                  >
                    <span className="flex flex-col">
                      <span className="font-mono text-[11px]">{credential.email}</span>
                      <span className="font-mono text-[10px] text-[#6b7280]">contraseña: {credential.password}</span>
                    </span>
                    <span className="text-[10px] font-medium text-[#6366f1]">Usar</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
