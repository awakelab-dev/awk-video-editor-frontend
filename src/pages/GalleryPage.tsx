import {
  CalendarDays,
  Clock3,
  Grid3X3,
  LayoutList,
  PanelsTopLeft,
  Play,
} from "lucide-react";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loadPresentationProject,
  presentationProjects,
  type PresentationProject,
  type PresentationProjectStatus,
} from "../shared/projects/presentationLibrary";
import type { EditorElement, TextElement } from "../shared/types/editor";

type VisualFrameElement = Exclude<
  EditorElement,
  { type: "audio" | "transition" }
>;
type FrameElementContext = {
  element: VisualFrameElement;
  zIndex: number;
};

type ProjectFilter = "all" | PresentationProjectStatus;
type ViewMode = "grid" | "list";

const filterOptions: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "draft", label: "Borrador" },
  { id: "review", label: "En revision" },
  { id: "published", label: "Publicados" },
];

function isElementActiveAtTime(
  element: EditorElement,
  time: number,
): element is VisualFrameElement {
  if (element.type === "audio" || element.type === "transition") {
    return false;
  }

  return (
    element.startTime <= time && element.startTime + element.duration > time
  );
}

function getFrameElementsAtTime(
  project: PresentationProject,
  time: number,
): FrameElementContext[] {
  const frameElements: FrameElementContext[] = [];

  project.tracks.forEach((track, trackIndex) => {
    track.elements.forEach((element) => {
      if (isElementActiveAtTime(element, time)) {
        frameElements.push({
          element,
          zIndex: project.tracks.length - trackIndex,
        });
      }
    });
  });

  return frameElements;
}

function getFirstFrameElements(
  project: PresentationProject,
): FrameElementContext[] {
  return getFrameElementsAtTime(project, 0);
}

function buildBaseFrameStyle(
  element: VisualFrameElement,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  const safeW = Math.max(1, resolution.w);
  const safeH = Math.max(1, resolution.h);

  return {
    position: "absolute",
    left: `${(element.x / safeW) * 100}%`,
    top: `${(element.y / safeH) * 100}%`,
    width: `${Math.max(0, (element.width / safeW) * 100)}%`,
    height: `${Math.max(0, (element.height / safeH) * 100)}%`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: "center center",
    opacity: element.opacity,
    zIndex,
  };
}

function buildTextFrameStyle(
  element: TextElement,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  const previewReferenceWidth = 320;
  const fontScale = previewReferenceWidth / Math.max(resolution.w, 1);

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
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent:
      element.textAlign === "left"
        ? "flex-start"
        : element.textAlign === "right"
          ? "flex-end"
          : "center",
    padding: "2px 4px",
    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
  };
}

function getSlideTimes(project: PresentationProject): number[] {
  const times = new Set<number>();
  times.add(0);
  for (const track of project.tracks) {
    for (const element of track.elements) {
      times.add(element.startTime);
      times.add(element.startTime + element.duration);
    }
  }
  return [...times]
    .sort((a, b) => a - b)
    .filter((t) => t >= 0 && t < project.durationSeconds);
}

function useAnimatedPreview(project: PresentationProject, isHovered: boolean) {
  const [previewTime, setPreviewTime] = useState(0);
  const animationRef = useRef<number>(0);
  const slideTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  const slideDuration = 800;
  const pauseBeforeLoop = 600;

  useEffect(() => {
    slideTimesRef.current = getSlideTimes(project);
  }, [project]);

  useEffect(() => {
    if (!isHovered) {
      setPreviewTime(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const slideTimes = slideTimesRef.current;
    if (slideTimes.length === 0) {
      return;
    }

    const totalCycleDuration =
      slideTimes.length * slideDuration + pauseBeforeLoop;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const cycleElapsed = elapsed % totalCycleDuration;
      const slideIndex = Math.min(
        Math.floor(cycleElapsed / slideDuration),
        slideTimes.length - 1,
      );

      setPreviewTime(slideTimes[slideIndex]);
      animationRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered, project]);

  return previewTime;
}

interface ProjectCardProps {
  project: PresentationProject;
  viewMode: ViewMode;
  onLoad: (id: string) => void;
  formatDuration: (seconds: number) => string;
  formatDate: (isoDate: string) => string;
}

function ProjectCard({
  project,
  viewMode,
  onLoad,
  formatDuration,
  formatDate,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const previewTime = useAnimatedPreview(project, isHovered);
  const frameElements = isHovered
    ? getFrameElementsAtTime(project, previewTime)
    : getFirstFrameElements(project);

  const handleClick = () => onLoad(project.id);

  const renderPreview = () => (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {frameElements.map(({ element, zIndex }) => {
        if (element.type === "shape") {
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
          );
        }

        if (element.type === "text") {
          return (
            <div
              className="absolute"
              key={element.id}
              style={buildTextFrameStyle(element, project.resolution, zIndex)}
            >
              {element.text}
            </div>
          );
        }

        if (element.type === "image") {
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
          );
        }

        return (
          <div
            className="absolute overflow-hidden bg-black/30"
            key={element.id}
            style={buildBaseFrameStyle(element, project.resolution, zIndex)}
          >
            <video
              className="h-full w-full object-cover"
              muted
              preload="metadata"
              src={element.source}
            />
          </div>
        );
      })}
    </div>
  );

  const renderOverlay = () => (
    <>
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-between p-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-1">
            {isHovered && (
              <span className="animate-pulse inline-flex items-center gap-1 rounded-full bg-[#6366f1]/80 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-[2px]">
                <Play className="h-3 w-3" fill="currentColor" />
                Preview
              </span>
            )}
          </div>
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
    </>
  );

  if (viewMode === "list") {
    return (
      <article
        aria-label={`Cargar proyecto ${project.name}`}
        className="transform-gpu cursor-pointer overflow-hidden rounded-xl border border-[#2a2a34] bg-[#16161d] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:border-[#4a4a5a] hover:bg-[#191924] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d11]"
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-4 p-4">
          <div
            className="relative aspect-video w-48 flex-shrink-0 overflow-hidden rounded-lg border border-white/10"
            style={{ backgroundColor: "#090b12" }}
          >
            {renderPreview()}
            {renderOverlay()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold leading-tight">
              {project.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-[#9ca3af]">
              {project.description}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-[#6b7280]">
              <span>{project.owner}</span>
              <span>·</span>
              <span>{project.collaborators} colaboradores</span>
              <span>·</span>
              <span>
                {project.resolution.w}x{project.resolution.h}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <button
            className="flex-shrink-0 rounded-md border border-[#4f46e5] bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#818cf8]"
            onClick={(event) => {
              event.stopPropagation();
              onLoad(project.id);
            }}
            type="button"
          >
            Cargar
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      aria-label={`Cargar proyecto ${project.name}`}
      className="transform-gpu cursor-pointer overflow-hidden rounded-xl border border-[#2a2a34] bg-[#16161d] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-[#4a4a5a] hover:bg-[#191924] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d11]"
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
      <div
        className="relative aspect-video border-b border-white/10 p-3"
        style={{ backgroundColor: "#090b12" }}
      >
        {renderPreview()}
        {renderOverlay()}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h2 className="text-base font-semibold leading-tight">
            {project.name}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#2a2a34] pt-3">
          <span className="truncate text-xs text-[#6b7280]">
            {project.owner} · {project.collaborators} colaboradores ·{" "}
            {project.resolution.w}x{project.resolution.h}
          </span>
          <button
            className="rounded-md border border-[#4f46e5] bg-[#6366f1] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#818cf8]"
            onClick={(event) => {
              event.stopPropagation();
              onLoad(project.id);
            }}
            type="button"
          >
            Cargar
          </button>
        </div>
      </div>
    </article>
  );
}

export function GalleryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return presentationProjects.filter((project) => {
      const matchesFilter =
        activeFilter === "all" || project.status === activeFilter;
      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        project.name,
        project.description,
        project.owner,
        project.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [query, activeFilter]);

  const handleLoadProject = (projectId: string) => {
    const projectWasLoaded = loadPresentationProject(projectId);
    if (projectWasLoaded) {
      navigate(`/editor?project=${encodeURIComponent(projectId)}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  };

  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(isoDate));

  return (
    <main className="h-screen overflow-hidden bg-[#0d0d11] px-4 py-7 text-[#f0f0f4] sm:px-6 lg:px-8">
      <section className="mx-auto flex h-full w-full max-w-7xl flex-col">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Biblioteca de Proyectos
            </h1>
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

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#2a2a34] bg-[#15151b] p-3">
          <input
            className="w-full min-w-[220px] flex-1 rounded-md border border-[#2a2a34] bg-[#0f0f14] px-3 py-2 text-sm text-[#f0f0f4] outline-none transition focus:border-[#6366f1]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, etiquetas o responsable"
            type="search"
            value={query}
          />
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => {
              const isActive = filter.id === activeFilter;

              return (
                <button
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-[#6366f1] bg-[#6366f1] text-white"
                      : "border-[#2f2f3a] bg-[#1a1a22] text-[#d1d5db] hover:border-[#4b5563] hover:bg-[#22222d]"
                  }`}
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#2a2a34] bg-[#0f0f14] p-1">
            <button
              className={`rounded p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-[#6366f1] text-white"
                  : "text-[#6b7280] hover:text-white"
              }`}
              onClick={() => setViewMode("grid")}
              title="Vista grid"
              type="button"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              className={`rounded p-1.5 transition ${
                viewMode === "list"
                  ? "bg-[#6366f1] text-white"
                  : "text-[#6b7280] hover:text-white"
              }`}
              onClick={() => setViewMode("list")}
              title="Vista lista"
              type="button"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {visibleProjects.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-3 overflow-y-auto pr-1"
            }
          >
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onLoad={handleLoadProject}
                formatDuration={formatDuration}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#35353f] bg-[#15151b] p-10 text-center">
            <p className="text-base font-medium">
              No hay resultados para esta busqueda
            </p>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Prueba con otro termino o limpia el campo de busqueda.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-md border border-[#35353f] bg-[#25252e] px-4 py-2 text-sm text-[#f0f0f4] transition hover:bg-[#2e2e38]"
            to="/editor"
          >
            Abrir editor vacio
          </Link>
        </div>
      </section>
    </main>
  );
}
