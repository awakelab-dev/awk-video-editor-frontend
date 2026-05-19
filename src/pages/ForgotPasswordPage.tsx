import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clapperboard, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../shared/auth/authStore'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const resetPassword = useAuthStore((state) => state.resetPassword)

  const [step, setStep] = useState<'email' | 'reset' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ email?: string; newPassword?: string; confirmPassword?: string }>({})

  const inputClassName = (hasError?: string) =>
    `w-full rounded-md border bg-[#1a1a22] px-3 py-2.5 text-sm text-[#f0f0f4] outline-none transition placeholder:text-[#4b5563] ${
      hasError
        ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20'
        : 'border-[#2a2a34] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20'
    }`

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    if (!email.trim()) {
      setErrors({ email: 'El email es obligatorio' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Introduce un email válido' })
      return
    }

    setIsLoading(true)
    const result = await forgotPassword(email)
    setIsLoading(false)

    if (!result.ok) {
      setAuthError(result.error)
      return
    }

    // In simulation, we store the token and move to reset step
    setToken(result.token)
    setStep('reset')
    setErrors({})
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    const nextErrors: typeof errors = {}
    if (!newPassword) {
      nextErrors.newPassword = 'La contraseña es obligatoria'
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = 'Mínimo 6 caracteres'
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    const result = await resetPassword(token, newPassword)
    setIsLoading(false)

    if (!result.ok) {
      setAuthError(result.error)
      return
    }

    setStep('success')
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
            <h1 className="text-2xl font-semibold tracking-[-0.01em]">
              {step === 'email' && 'Recuperar contraseña'}
              {step === 'reset' && 'Nueva contraseña'}
              {step === 'success' && '¡Listo!'}
            </h1>
            <p className="mt-1.5 text-sm text-[#9ca3af]">
              {step === 'email' && 'Introduce tu email para continuar'}
              {step === 'reset' && 'Elige una nueva contraseña segura'}
              {step === 'success' && 'Tu contraseña ha sido actualizada'}
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

          {step === 'email' && (
            <form className="space-y-4" onSubmit={handleRequestReset} noValidate>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="fp-email">
                  Email
                </label>
                <input
                  autoComplete="email"
                  className={inputClassName(errors.email)}
                  id="fp-email"
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
                    Enviando…
                  </span>
                ) : (
                  'Continuar'
                )}
              </button>

              <p className="text-center text-xs text-[#9ca3af]">
                <button
                  className="font-medium text-[#6366f1] transition hover:text-[#818cf8]"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  Volver al inicio de sesión
                </button>
              </p>
            </form>
          )}

          {step === 'reset' && (
            <form className="space-y-4" onSubmit={handleReset} noValidate>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="fp-new">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className={`${inputClassName(errors.newPassword)} pr-10`}
                    id="fp-new"
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }))
                    }}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
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
                {errors.newPassword && (
                  <p className="mt-1.5 text-[11px] text-[#ef4444]">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#d1d5db]" htmlFor="fp-confirm">
                  Confirmar contraseña
                </label>
                <input
                  autoComplete="new-password"
                  className={inputClassName(errors.confirmPassword)}
                  id="fp-confirm"
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
                {isLoading ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <div className="rounded-md border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-2 text-xs text-[#86efac]">
                Contraseña actualizada correctamente
              </div>
              <button
                className="inline-flex w-full items-center justify-center rounded-md bg-[#6366f1] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition hover:bg-[#818cf8]"
                onClick={() => navigate('/login')}
                type="button"
              >
                Iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
