import { CalendarDays, Clock3, PanelsTopLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loadPresentationProject,
  presentationProjects,
} from '../shared/projects/presentationLibrary'

export function GalleryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return presentationProjects.filter((project) => {
      if (!normalizedQuery) {
        return true
      }

      const searchableText = [
        project.name,
        project.description,
        project.owner,
        project.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [query])

  const handleLoadProject = (projectId: string) => {
    const projectWasLoaded = loadPresentationProject(projectId)
    if (projectWasLoaded) {
      navigate(`/editor?project=${encodeURIComponent(projectId)}`)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const rest = seconds % 60
    return `${minutes}:${String(rest).padStart(2, '0')}`
  }

  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoDate))

  return (
    <main className="h-screen overflow-y-auto bg-[#0d0d11] px-4 py-7 text-[#f0f0f4] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Biblioteca de Proyectos</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-[#35353f] bg-[#25252e] px-4 py-2 text-sm text-[#f0f0f4] transition hover:bg-[#2e2e38]"
              to="/login"
            >
              Gestionar acceso
            </Link>
            <Link
              className="rounded-md border border-[#4f46e5] bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#818cf8]"
              to="/editor"
            >
              Nuevo proyecto
            </Link>
          </div>
        </header>

        <div className="mb-5 rounded-lg border border-[#2a2a34] bg-[#15151b] p-3">
          <input
            className="w-full min-w-[220px] flex-1 rounded-md border border-[#2a2a34] bg-[#0f0f14] px-3 py-2 text-sm text-[#f0f0f4] outline-none transition focus:border-[#6366f1]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, etiquetas o responsable"
            type="search"
            value={query}
          />
        </div>

        {visibleProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <article
                className="overflow-hidden rounded-xl border border-[#2a2a34] bg-[#16161d] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                key={project.id}
              >
                <div
                  className="relative aspect-video border-b border-white/10 p-3"
                  style={{ background: project.thumbnail.gradient }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.22),transparent_50%)]" />
                  <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-between p-3">
                    <div className="flex items-start justify-end">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-[2px]">
                        <Clock3 className="h-3 w-3" />
                        {formatDuration(project.durationSeconds)}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-[2px]">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(project.lastEditedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-[2px]">
                        <PanelsTopLeft className="h-3 w-3" />
                        {project.slides}
                      </span>
                    </div>
                  </div>
                  <div className="relative z-[1] mt-4 max-w-[75%] rounded-md bg-black/35 p-3 backdrop-blur-[1px]">
                    <p className="text-[15px] font-semibold leading-tight text-white">
                      {project.thumbnail.title}
                    </p>
                    <p className="mt-1 text-[11px] text-white/80">{project.thumbnail.subtitle}</p>
                    <div className="mt-2 space-y-1">
                      {project.thumbnail.bullets.map((item) => (
                        <span
                          className="block w-fit rounded bg-white/20 px-2 py-0.5 text-[10px] text-white/90"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="text-base font-semibold leading-tight">{project.name}</h2>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#2a2a34] pt-3">
                    <span className="truncate text-xs text-[#6b7280]">
                      {project.owner} · {project.collaborators} colaboradores · {project.resolution.w}x{project.resolution.h}
                    </span>
                    <button
                      className="rounded-md border border-[#4f46e5] bg-[#6366f1] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#818cf8]"
                      onClick={() => handleLoadProject(project.id)}
                      type="button"
                    >
                      Cargar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#35353f] bg-[#15151b] p-10 text-center">
            <p className="text-base font-medium">No hay resultados para esta busqueda</p>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Prueba con otro termino o limpia el campo de busqueda.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-md border border-[#35353f] bg-[#25252e] px-4 py-2 text-sm text-[#f0f0f4] transition hover:bg-[#2e2e38]"
            to="/editor"
          >
            Abrir editor vacio
          </Link>
        </div>
      </section>
    </main>
  )
}
