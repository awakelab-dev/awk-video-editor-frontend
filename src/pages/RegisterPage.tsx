import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clapperboard, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../shared/auth/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({})

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!name.trim()) nextErrors.name = 'El nombre es obligatorio'
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
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setAuthError(null)
    if (!validate()) return

    setIsLoading(true)
    const result = await register(name.trim(), email.trim(), password)
    setIsLoading(false)

    if (!result.ok) {
      setAuthError(result.error)
      return
    }

    navigate('/gallery', { replace: true })
  }

  const inputClassName = (hasError?: string) =>
    `w-full rounded-md border bg-[#1a1a22] px-3 py-2.5 text-sm text-[#f0f0f4] outline-none transition placeholder:text-[#4b5563] ${
      hasError
        ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20'
        : 'border-[#2a2a34] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20'
    }`

  if (isAuthenticated) {
    navigate('/gallery', { replace: true })
    return null
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a12] px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#6366f1]/20 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-[420px] w-[420px] rounded-full bg-[#8b5cf6]/15 blur-[120px]" />
        <div className="absolute left-1/2 top-0 h-[260px] w-[600px] -translate-x-1/2 rounded-full bg-[#6366f1]/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a12_85%)]" />
      </div>

      <div className="absolute left-6 top-6 z-10 flex items-center gap-2 text-sm font-bold tracking-[-0.02em] text-[#f0f0f4]">
        <Clapperboard className="h-5 w-5 text-[#6366f1]" />
        <span>VideoForge</span>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-[#2a2a34] bg-[#0f0f15]/90 p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1]/10 ring-1 ring-[#6366f1]/30">
              <Clapperboard className="h-6 w-6 text-[#6366f1]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em]">Crear cuenta</h1>
            <p className="mt-1.5 text-sm text-[#9ca3af]">
              Regístrate para empezar a editar
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
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="reg-name">
                Nombre
              </label>
              <input
                autoComplete="name"
                className={inputClassName(errors.name)}
                id="reg-name"
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder="Tu nombre"
                type="text"
                value={name}
              />
              {errors.name && (
                <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="reg-email">
                Email
              </label>
              <input
                autoComplete="email"
                className={inputClassName(errors.email)}
                id="reg-email"
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
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="reg-password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  autoComplete="new-password"
                  className={`${inputClassName(errors.password)} pr-10`}
                  id="reg-password"
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

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="reg-confirm">
                Confirmar contraseña
              </label>
              <input
                autoComplete="new-password"
                className={inputClassName(errors.confirmPassword)}
                id="reg-confirm"
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                }}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.confirmPassword}</p>
              )}
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
                  Creando cuenta…
                </span>
              ) : (
                'Registrarse'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#9ca3af]">
            ¿Ya tienes cuenta?{' '}
            <button
              className="font-medium text-[#6366f1] transition hover:text-[#818cf8]"
              onClick={() => navigate('/login')}
              type="button"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
