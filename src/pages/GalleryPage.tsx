import { Link } from 'react-router-dom'

export function GalleryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0d11] px-6 text-[#f0f0f4]">
      <section className="w-full max-w-3xl rounded-xl border border-[#2a2a34] bg-[#1a1a20] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#6b7280]">
          Future page scaffold
        </p>
        <h1 className="text-2xl font-semibold">Video Gallery</h1>
        <p className="mt-3 text-sm text-[#9ca3af]">
          This route is ready for your future videos grid/list implementation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-md border border-[#35353f] bg-[#25252e] px-4 py-2 text-sm text-[#f0f0f4] transition hover:bg-[#2e2e38]"
            to="/editor"
          >
            Go to Editor
          </Link>
          <Link
            className="rounded-md border border-[#35353f] bg-[#25252e] px-4 py-2 text-sm text-[#f0f0f4] transition hover:bg-[#2e2e38]"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      </section>
    </main>
  )
}
