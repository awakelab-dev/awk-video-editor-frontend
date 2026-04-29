import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  FolderOpen,
  Grid3X3,
  LayoutList,
  LogOut,
  Moon,
  PanelsTopLeft,
  Play,
  Settings,
  Share2,
  SquareLibrary,
  Sun,
  Files,
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

const subjectFolders = [
  {
    name: "Matematicas",
    themes: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
  },
  {
    name: "Lengua",
    themes: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
  },
  {
    name: "Historia",
    themes: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
  },
  {
    name: "Ciencias",
    themes: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
  },
] as const;

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
  isDarkMode: boolean;
  onLoad: (id: string) => void;
  formatDuration: (seconds: number) => string;
  formatDate: (isoDate: string) => string;
}

function ProjectCard({
  project,
  viewMode,
  isDarkMode,
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
        className={`transform-gpu cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/70 ${
          isDarkMode
            ? "border-[#2a2a34] bg-[#16161d] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:border-[#4a4a5a] hover:bg-[#191924] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)] focus-visible:ring-offset-[#0d0d11]"
            : "border-[#d5dbe8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#c7d2e5] hover:bg-[#f8faff] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] focus-visible:ring-offset-[#f3f5fb]"
        }`}
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
            <p className={`mt-1 line-clamp-2 text-sm ${isDarkMode ? "text-[#9ca3af]" : "text-[#64748b]"}`}>
              {project.description}
            </p>
            <div className={`mt-2 flex items-center gap-3 text-xs ${isDarkMode ? "text-[#6b7280]" : "text-[#64748b]"}`}>
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
                  className={`rounded px-1.5 py-0.5 text-[10px] ${isDarkMode ? "bg-white/5 text-white/60" : "bg-[#eef2ff] text-[#475569]"}`}
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
      className={`transform-gpu cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/70 focus-visible:ring-offset-2 ${
        isDarkMode
          ? "border-[#2a2a34] bg-[#16161d] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:border-[#4a4a5a] hover:bg-[#191924] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)] focus-visible:ring-offset-[#0d0d11]"
          : "border-[#d5dbe8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#c7d2e5] hover:bg-[#f8faff] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] focus-visible:ring-offset-[#f3f5fb]"
      }`}
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

        <div className={`flex items-center justify-between gap-2 border-t pt-3 ${isDarkMode ? "border-[#2a2a34]" : "border-[#e2e8f0]"}`}>
          <span className={`truncate text-xs ${isDarkMode ? "text-[#6b7280]" : "text-[#64748b]"}`}>
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
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    Matematicas: true,
    Lengua: false,
    Historia: false,
    Ciencias: false,
  });
  const classroomThemeProjects = useMemo<PresentationProject[]>(() => {
    const baseProject = presentationProjects[0];
    const nowIso = new Date().toISOString();

    return subjectFolders.flatMap((subject) =>
      subject.themes.map((theme) => ({
        ...baseProject,
        id: `classroom-${subject.name.toLowerCase()}-${theme.toLowerCase().replace(/\s+/g, "-")}`,
        name: `${subject.name} - ${theme}`,
        description: `Proyecto base para ${subject.name}, ${theme}.`,
        owner: "Profesorado",
        status: "draft",
        slides: 0,
        durationSeconds: 0,
        lastEditedAt: nowIso,
        collaborators: 1,
        tags: [subject.name, theme, "asignatura"],
        tracks: [],
        assets: [],
      })),
    );
  }, []);

  const allGalleryProjects = useMemo(
    () => [...presentationProjects, ...classroomThemeProjects],
    [classroomThemeProjects],
  );

  const totalProjects = allGalleryProjects.length;
  const completedProjects = allGalleryProjects.filter(
    (project) => project.status === "published",
  ).length;
  const inProgressProjects = allGalleryProjects.filter(
    (project) => project.status === "review",
  ).length;
  const draftProjects = allGalleryProjects.filter(
    (project) => project.status === "draft",
  ).length;

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allGalleryProjects.filter((project) => {
      const matchesFilter =
        activeFilter === "all" || project.status === activeFilter;
      if (!matchesFilter) {
        return false;
      }

      const matchesSubject =
        !activeSubjectFilter || project.tags.some((tag) => tag.toLowerCase() === activeSubjectFilter.toLowerCase());
      if (!matchesSubject) {
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
  }, [query, activeFilter, allGalleryProjects, activeSubjectFilter]);

  const handleLoadProject = (projectId: string) => {
    const projectWasLoaded = loadPresentationProject(projectId);
    if (projectWasLoaded) {
      navigate(`/editor?project=${encodeURIComponent(projectId)}`);
      return;
    }

    navigate("/editor");
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

  const toggleSubject = (subject: string) => {
    setExpandedSubjects((prev) => {
      const nextIsOpen = !prev[subject];
      setActiveSubjectFilter(nextIsOpen ? subject : null);
      return {
        ...prev,
        [subject]: nextIsOpen,
      };
    });
  };

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isUserMenuOpen]);

  return (
    <main
      className={`flex h-screen flex-col overflow-hidden px-4 py-7 sm:px-6 lg:px-10 ${
        isDarkMode ? "bg-[#0d0d11] text-[#f0f0f4]" : "bg-[#f3f5fb] text-[#111827]"
      }`}
    >
      <header className="relative mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div className="order-1">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AWK Editor</h1>
        </div>
        <div className="pointer-events-none absolute left-[19rem] top-1/2 hidden -translate-y-1/2 lg:block">
          <h2 className="text-2xl font-semibold leading-none sm:text-3xl">Galeria de proyectos</h2>
        </div>
        <div className="order-2 flex flex-wrap items-center gap-2 md:order-3">
          <Link
            className="rounded-md border border-[#4f46e5] bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#818cf8]"
            to="/editor"
          >
            Nuevo proyecto
          </Link>
          <div className="relative" ref={userMenuRef}>
            <button
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              aria-label="Abrir menu de usuario"
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                isDarkMode
                  ? "border-[#4f46e5]/80 bg-[#232334] text-[#c7d2fe]"
                  : "border-[#c7d2fe] bg-white text-[#4338ca]"
              }`}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              title="Usuario PL"
              type="button"
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${isDarkMode ? "bg-[#1b1b29]" : "bg-[#eef2ff]"}`}>PL</span>
            </button>
            {isUserMenuOpen ? (
              <div
                className={`absolute right-0 top-12 z-20 min-w-[170px] rounded-lg border p-1.5 shadow-lg ${
                  isDarkMode ? "border-[#2a2a34] bg-[#15151b]" : "border-[#d5dbe8] bg-white"
                }`}
                role="menu"
              >
                <button
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    isDarkMode ? "text-[#fca5a5] hover:bg-[#24171b]" : "text-[#b91c1c] hover:bg-[#fef2f2]"
                  }`}
                  onClick={() => setIsUserMenuOpen(false)}
                  role="menuitem"
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <section className="flex min-h-0 flex-1 w-full gap-4">
        <aside
          className={`flex w-72 shrink-0 flex-col overflow-y-auto rounded-xl border p-3 ${
            isDarkMode ? "border-[#2a2a34] bg-[#121219]" : "border-[#d5dbe8] bg-white"
          }`}
        >
          <div className="mb-5">
            <p className={`px-2 text-[11px] uppercase tracking-wide ${isDarkMode ? "text-[#8b93a7]" : "text-[#64748b]"}`}>Principal</p>
            <div className="mt-2 space-y-1.5">
              <button
                className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${
                  isDarkMode
                    ? "border-[#3f3f4a] bg-[#1d1d28] text-[#f0f0f4]"
                    : "border-[#c7d2e5] bg-[#eef2ff] text-[#1e293b]"
                }`}
                onClick={() => setActiveSubjectFilter(null)}
                type="button"
              >
                <SquareLibrary className="h-4 w-4 text-[#a5b4fc]" />
                Proyectos
              </button>
              <button
                className={`flex w-full items-center gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-left text-sm transition ${
                  isDarkMode ? "text-[#b3b9c7] hover:bg-[#1a1a24] hover:text-white" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
                type="button"
              >
                <Grid3X3 className="h-4 w-4 text-[#93c5fd]" />
                Plantillas
              </button>
              <button
                className={`flex w-full items-center gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-left text-sm transition ${
                  isDarkMode ? "text-[#b3b9c7] hover:bg-[#1a1a24] hover:text-white" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
                type="button"
              >
                <Share2 className="h-4 w-4 text-[#f9a8d4]" />
                Compartidos
              </button>
            </div>
          </div>

          <div className="mb-5">
            <p className={`px-2 text-[11px] uppercase tracking-wide ${isDarkMode ? "text-[#8b93a7]" : "text-[#64748b]"}`}>Archivos</p>
            <div className="mt-2 space-y-2">
              {subjectFolders.map((subject) => {
                const isOpen = expandedSubjects[subject.name];
                const isActive = activeSubjectFilter === subject.name;

                return (
                  <div key={subject.name}>
                    <button
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? isDarkMode
                            ? "border-[#4f46e5]/60 bg-[#1d1d28] text-white"
                            : "border-[#6366f1]/40 bg-[#eef2ff] text-[#312e81]"
                          : isDarkMode
                            ? "border-transparent text-[#d4d8e4] hover:bg-[#1a1a24]"
                            : "border-transparent text-[#475569] hover:bg-[#f1f5f9]"
                      }`}
                      onClick={() => toggleSubject(subject.name)}
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-[#93c5fd]" />
                        {subject.name}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-[#8b93a7]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#8b93a7]" />
                      )}
                    </button>
                    {isOpen ? (
                      <div className="ml-6 mt-1 space-y-1">
                        {subject.themes.map((theme) => (
                          <button
                            className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition ${
                              isDarkMode
                                ? "border-[#242432] bg-[#11111a] text-[#c7cedd] hover:bg-[#1a1a24] hover:text-white"
                                : "border-[#dbe3f1] bg-[#f8faff] text-[#475569] hover:bg-[#eef2ff] hover:text-[#1e293b]"
                            }`}
                            key={`${subject.name}-${theme}`}
                            type="button"
                          >
                            <Files className="h-3.5 w-3.5" />
                            {theme}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`mt-auto border-t pt-4 ${isDarkMode ? "border-[#2a2a34]" : "border-[#d5dbe8]"}`}>
            <p className={`px-2 text-[11px] uppercase tracking-wide ${isDarkMode ? "text-[#8b93a7]" : "text-[#64748b]"}`}>Sistema</p>
            <button
              className={`mt-2 flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-left text-sm transition ${
                isDarkMode ? "text-[#b3b9c7] hover:bg-[#1a1a24] hover:text-white" : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              type="button"
            >
              <Settings className="h-4 w-4 text-[#c4b5fd]" />
              Configuracion
            </button>
            {isSettingsOpen ? (
              <div
                className={`mt-2 flex items-center justify-between rounded-lg border p-2 ${
                  isDarkMode ? "border-[#2a2a34] bg-[#171721]" : "border-[#d5dbe8] bg-[#f8f9fd]"
                }`}
              >
                <Moon className={`h-4 w-4 ${isDarkMode ? "text-[#c7d2fe]" : "text-[#94a3b8]"}`} />
                <button
                  aria-label="Alternar modo oscuro"
                  className={`relative h-6 w-11 rounded-full transition ${
                    isDarkMode ? "bg-[#6366f1]" : "bg-[#cbd5e1]"
                  }`}
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  type="button"
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      isDarkMode ? "left-[1.35rem]" : "left-0.5"
                    }`}
                  />
                </button>
                <Sun className={`h-4 w-4 ${isDarkMode ? "text-[#94a3b8]" : "text-[#f59e0b]"}`} />
              </div>
            ) : null}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article
              className={`rounded-lg border p-3.5 ${
                isDarkMode ? "border-[#2a2a34] bg-[#15151b]" : "border-[#d5dbe8] bg-white"
              }`}
            >
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-[#9ca3af]" : "text-[#64748b]"}`}>
                Total proyectos
              </p>
              <p className={`mt-1 text-2xl font-semibold ${isDarkMode ? "text-[#f9fafb]" : "text-[#0f172a]"}`}>
                {totalProjects}
              </p>
            </article>
            <article
              className={`rounded-lg border p-3.5 ${
                isDarkMode ? "border-[#2a2a34] bg-[#15151b]" : "border-[#d5dbe8] bg-white"
              }`}
            >
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-[#9ca3af]" : "text-[#64748b]"}`}>
                Terminados
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#86efac]">
                {completedProjects}
              </p>
            </article>
            <article
              className={`rounded-lg border p-3.5 ${
                isDarkMode ? "border-[#2a2a34] bg-[#15151b]" : "border-[#d5dbe8] bg-white"
              }`}
            >
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-[#9ca3af]" : "text-[#64748b]"}`}>
                En progreso
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#facc15]">
                {inProgressProjects}
              </p>
            </article>
            <article
              className={`rounded-lg border p-3.5 ${
                isDarkMode ? "border-[#2a2a34] bg-[#15151b]" : "border-[#d5dbe8] bg-white"
              }`}
            >
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-[#9ca3af]" : "text-[#64748b]"}`}>
                Borrador
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#93c5fd]">
                {draftProjects}
              </p>
            </article>
          </section>

          <div
            className={`mb-5 flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
              isDarkMode ? "border-[#2a2a34] bg-[#15151b]" : "border-[#d5dbe8] bg-white"
            }`}
          >
            <input
              className={`w-full min-w-[220px] flex-1 rounded-md border px-3 py-2 text-sm outline-none transition focus:border-[#6366f1] ${
                isDarkMode
                  ? "border-[#2a2a34] bg-[#0f0f14] text-[#f0f0f4]"
                  : "border-[#d5dbe8] bg-[#f8f9fd] text-[#111827]"
              }`}
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
                        : isDarkMode
                          ? "border-[#2f2f3a] bg-[#1a1a22] text-[#d1d5db] hover:border-[#4b5563] hover:bg-[#22222d]"
                          : "border-[#d5dbe8] bg-white text-[#334155] hover:border-[#c7d2e5] hover:bg-[#f8faff]"
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
            <div className={`flex items-center gap-1 rounded-md border p-1 ${isDarkMode ? "border-[#2a2a34] bg-[#0f0f14]" : "border-[#d5dbe8] bg-[#f8f9fd]"}`}>
              <button
                className={`rounded p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-[#6366f1] text-white"
                    : isDarkMode
                      ? "text-[#6b7280] hover:text-white"
                      : "text-[#64748b] hover:text-[#0f172a]"
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
                    : isDarkMode
                      ? "text-[#6b7280] hover:text-white"
                      : "text-[#64748b] hover:text-[#0f172a]"
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
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    : "flex flex-col gap-3"
                }
              >
                {visibleProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode={viewMode}
                    isDarkMode={isDarkMode}
                    onLoad={handleLoadProject}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          ) : (
          <div
            className={`rounded-lg border border-dashed p-10 text-center ${
              isDarkMode ? "border-[#35353f] bg-[#15151b]" : "border-[#c7d2e5] bg-white"
            }`}
          >
              <p className="text-base font-medium">
                No hay resultados para esta busqueda
              </p>
              <p className={`mt-1 text-sm ${isDarkMode ? "text-[#9ca3af]" : "text-[#64748b]"}`}>
                Prueba con otro termino o limpia el campo de busqueda.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className={`rounded-md border px-4 py-2 text-sm transition ${
                isDarkMode
                  ? "border-[#35353f] bg-[#25252e] text-[#f0f0f4] hover:bg-[#2e2e38]"
                  : "border-[#d5dbe8] bg-white text-[#334155] hover:bg-[#f8faff]"
              }`}
              to="/editor"
            >
              Abrir editor vacio
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}


