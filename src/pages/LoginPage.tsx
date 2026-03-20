import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0d11] px-6 text-[#f0f0f4]">
      <section className="w-full max-w-md rounded-xl border border-[#2a2a34] bg-[#1a1a20] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#6b7280]">
          Future page scaffold
        </p>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-3 text-sm text-[#9ca3af]">
          Authentication UI foundation is ready. API integration can be added
          later.
        </p>
        <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block">
            <span className="mb-1 block text-xs text-[#9ca3af]">Email</span>
            <input
              className="w-full rounded-md border border-[#2a2a34] bg-[#25252e] px-3 py-2 text-sm outline-none transition focus:border-[#6366f1]"
              placeholder="you@domain.com"
              type="email"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[#9ca3af]">Password</span>
            <input
              className="w-full rounded-md border border-[#2a2a34] bg-[#25252e] px-3 py-2 text-sm outline-none transition focus:border-[#6366f1]"
              placeholder="••••••••"
              type="password"
            />
          </label>
          <button
            className="inline-flex w-full items-center justify-center rounded-md bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#818cf8]"
            type="submit"
          >
            Sign in
          </button>
        </form>
        <Link
          className="mt-4 inline-flex rounded-md border border-[#35353f] bg-[#25252e] px-4 py-2 text-sm text-[#f0f0f4] transition hover:bg-[#2e2e38]"
          to="/editor"
        >
          Back to Editor
        </Link>
      </section>
    </main>
  )
}
