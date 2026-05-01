import { CalendarDays, Clock3, PanelsTopLeft } from 'lucide-react'
import { type CSSProperties, type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createProjectAndLoadIntoStore,
  isProjectsApiEnabled,
  listProjects,
  loadApiProjectIntoStore,
} from '../shared/api/projectsApi'
import type { PresentationProject } from '../shared/projects/presentationLibrary'
import type { EditorElement, TextElement } from '../shared/types/editor'

type VisualFrameElement = Exclude<EditorElement, { type: 'audio' | 'transition' }>
type FrameElementContext = {
  element: VisualFrameElement
  zIndex: number
}

function isElementActiveAtStart(element: EditorElement): element is VisualFrameElement {
  if (element.type === 'audio' || element.type === 'transition') {
    return false
  }

  return element.startTime <= 0 && element.startTime + element.duration > 0
}

function getFirstFrameElements(project: PresentationProject): FrameElementContext[] {
  const firstFrameElements: FrameElementContext[] = []

  project.tracks.forEach((track, trackIndex) => {
    track.elements.forEach((element) => {
      if (isElementActiveAtStart(element)) {
        firstFrameElements.push({
          element,
          zIndex: project.tracks.length - trackIndex,
        })
      }
    })
  })

  return firstFrameElements
}

function buildBaseFrameStyle(
  element: VisualFrameElement,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  const safeW = Math.max(1, resolution.w)
  const safeH = Math.max(1, resolution.h)

  return {
    position: 'absolute',
    left: `${(element.x / safeW) * 100}%`,
    top: `${(element.y / safeH) * 100}%`,
    width: `${Math.max(0, (element.width / safeW) * 100)}%`,
    height: `${Math.max(0, (element.height / safeH) * 100)}%`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    opacity: element.opacity,
    zIndex,
  }
}

function buildTextFrameStyle(
  element: TextElement,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  const previewReferenceWidth = 320
  const fontScale = previewReferenceWidth / Math.max(resolution.w, 1)

  return {
    ...buildBaseFrameStyle(element, resolution, zIndex),
    color: element.textColor,
    backgroundColor: element.backgroundColor,
    fontFamily: element.fontFamily,
    fontSize: `${Math.max(7, element.fontSize * fontScale)}px`,
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
    letterSpacing: `${Math.max(0, element.letterSpacing * fontScale)}px`,
    textAlign: element.textAlign,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      element.textAlign === 'left'
        ? 'flex-start'
        : element.textAlign === 'right'
          ? 'flex-end'
          : 'center',
    padding: '2px 4px',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  }
}

export function GalleryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<PresentationProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProjectsFromApi() {
      if (!isProjectsApiEnabled()) {
        if (isMounted) {
          setProjects([])
          setLoadError('Configura VITE_API_BASE_URL para cargar proyectos reales desde la base de datos.')
          setIsLoadingProjects(false)
        }
        return
      }

      try {
        const apiProjects = await listProjects()
        if (isMounted) {
          setProjects(apiProjects)
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setProjects([])
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los proyectos.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false)
        }
      }
    }

    void loadProjectsFromApi()

    return () => {
      isMounted = false
    }
  }, [])

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return projects.filter((project) => {
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
  }, [projects, query])

  const handleLoadProject = async (project: PresentationProject) => {
    if (loadingProjectId) {
      return
    }

    setLoadingProjectId(project.id)
    setLoadError(null)

    try {
      const projectWasLoaded = await loadApiProjectIntoStore(project.id)
      if (projectWasLoaded) {
        navigate(`/editor?project=${encodeURIComponent(project.id)}`)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar este proyecto.')
    } finally {
      setLoadingProjectId(null)
    }
  }

  const handleCreateProject = async () => {
    if (isCreatingProject) {
      return
    }

    if (!isProjectsApiEnabled()) {
      navigate('/editor')
      return
    }

    setIsCreatingProject(true)
    setLoadError(null)

    try {
      const project = await createProjectAndLoadIntoStore({
        name: 'Nuevo proyecto',
        duration: 0,
        resolution: {
          w: 1920,
          h: 1080,
        },
      })

      navigate(`/editor?project=${encodeURIComponent(project.projectId)}`)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo crear el proyecto.')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, project: PresentationProject) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void handleLoadProject(project)
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
            <button
              className="rounded-md border border-[#4f46e5] bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#818cf8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreatingProject}
              onClick={() => void handleCreateProject()}
              type="button"
            >
              {isCreatingProject ? 'Creando...' : 'Nuevo proyecto'}
            </button>
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

        {loadError ? (
          <div className="mb-5 rounded-lg border border-[#7f1d1d] bg-[#2a1114] p-4 text-sm text-[#fecaca]">
            {loadError}
          </div>
        ) : null}

        {isLoadingProjects ? (
          <div className="rounded-lg border border-dashed border-[#35353f] bg-[#15151b] p-10 text-center">
            <p className="text-base font-medium">Cargando proyectos reales...</p>
            <p className="mt-1 text-sm text-[#9ca3af]">Estamos trayendo la biblioteca desde la base de datos.</p>
          </div>
        ) : visibleProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <article
                aria-label={`Cargar proyecto ${project.name}`}
                className="transform-gpu cursor-pointer overflow-hidden rounded-xl border border-[#2a2a34] bg-[#16161d] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-[#4a4a5a] hover:bg-[#191924] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d11]"
                key={project.id}
                onClick={() => void handleLoadProject(project)}
                onKeyDown={(event) => handleCardKeyDown(event, project)}
                role="button"
                tabIndex={0}
              >
                <div
                  className="relative aspect-video border-b border-white/10 p-3"
                  style={{ backgroundColor: '#090b12' }}
                >
                  <div className="pointer-events-none absolute inset-0 z-[1]">
                    {getFirstFrameElements(project).map(({ element, zIndex }) => {
                      if (element.type === 'shape') {
                        return (
                          <div
                            className="absolute"
                            key={element.id}
                            style={{
                              ...buildBaseFrameStyle(element, project.resolution, zIndex),
                              backgroundColor: element.fillColor,
                              outline: `${Math.max(0, element.strokeWidth)}px solid ${element.strokeColor}`,
                              borderRadius: `${Math.max(0, element.cornerRadius)}px`,
                            }}
                          />
                        )
                      }

                      if (element.type === 'text') {
                        return (
                          <div
                            className="absolute"
                            key={element.id}
                            style={buildTextFrameStyle(element, project.resolution, zIndex)}
                          >
                            {element.text}
                          </div>
                        )
                      }

                      if (element.type === 'image') {
                        return (
                          <div
                            className="absolute overflow-hidden"
                            key={element.id}
                            style={{
                              ...buildBaseFrameStyle(element, project.resolution, zIndex),
                              outline: `${Math.max(0, element.borderWidth)}px solid ${element.borderColor}`,
                            }}
                          >
                            <img
                              alt={element.name}
                              className="h-full w-full"
                              draggable={false}
                              src={element.source}
                              style={{ objectFit: element.fit }}
                            />
                          </div>
                        )
                      }

                      return (
                        <div
                          className="absolute overflow-hidden bg-black/30"
                          key={element.id}
                          style={buildBaseFrameStyle(element, project.resolution, zIndex)}
                        >
                          <video className="h-full w-full object-cover" muted preload="metadata" src={element.source} />
                        </div>
                      )
                    })}
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.12),transparent_55%)]" />
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
                      disabled={loadingProjectId === project.id}
                      className="rounded-md border border-[#4f46e5] bg-[#6366f1] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#818cf8]"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleLoadProject(project)
                      }}
                      type="button"
                    >
                      {loadingProjectId === project.id ? 'Cargando...' : 'Cargar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#35353f] bg-[#15151b] p-10 text-center">
            <p className="text-base font-medium">
              {query.trim() ? 'No hay resultados para esta busqueda' : 'No hay proyectos en la biblioteca'}
            </p>
            <p className="mt-1 text-sm text-[#9ca3af]">
              {query.trim()
                ? 'Prueba con otro termino o limpia el campo de busqueda.'
                : 'Cuando haya proyectos guardados en la base de datos apareceran aqui.'}
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
