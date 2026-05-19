import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Clapperboard,
  Copy,
  Moon,
  Redo2,
  Scissors,
  Settings,
  Sun,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEditorStore } from "../store";

type EditorTheme = "dark" | "light";

const EDITOR_THEME_STORAGE_KEY = "awk:editor-theme";

type ToolbarIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  theme?: EditorTheme;
  onClick?: () => void;
};

function ToolbarIconButton({
  ariaLabel,
  children,
  disabled = false,
  theme = "dark",
  onClick,
}: ToolbarIconButtonProps) {
  const idleTextClass = theme === "dark" ? "text-[#9ca3af]" : "text-[#475569]";
  const hoverClass =
    theme === "dark"
      ? "hover:bg-[#2e2e38] hover:text-[#f0f0f4]"
      : "hover:bg-[#dbe7f3] hover:text-[#0f172a]";

  return (
    <button
      aria-label={ariaLabel}
      className={`flex h-8 w-8 items-center justify-center rounded-[4px] transition ${idleTextClass} ${disabled ? "cursor-not-allowed opacity-40" : hoverClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function AppToolbar() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const projectName = useEditorStore((state) => state.projectName);
  const removeSelectedElement = useEditorStore(
    (state) => state.removeSelectedElement,
  );
  const canDeleteSelection = selectedElementId !== null;
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("dark");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      EDITOR_THEME_STORAGE_KEY,
    ) as EditorTheme | null;
    if (savedTheme === "dark" || savedTheme === "light") {
      setEditorTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.editorTheme = editorTheme;
    localStorage.setItem(EDITOR_THEME_STORAGE_KEY, editorTheme);
  }, [editorTheme]);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!settingsMenuRef.current?.contains(target)) {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <header
      className={`flex h-[52px] items-center justify-between gap-4 border-b px-4 ${
        editorTheme === "dark"
          ? "border-[#2a2a34] bg-[#16161a]"
          : "border-[#d7dee8] bg-[#ffffff]"
      }`}
    >
      <div className="flex items-center gap-5">
        <a
          className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.02em]"
          href="#"
        >
          <Clapperboard className="h-5 w-5 text-[#6366f1]" />
          <span>VideoForge</span>
        </a>
        <nav className="hidden items-center gap-0.5 lg:flex">
          {["Archivo", "Editar", "Ver", "Efectos"].map((item) => (
            <button
              className={`rounded-[4px] px-3 py-1.5 text-[13px] transition ${
                editorTheme === "dark"
                  ? "text-[#9ca3af] hover:bg-[#25252e] hover:text-[#f0f0f4]"
                  : "text-[#475569] hover:bg-[#e2e8f0] hover:text-[#0f172a]"
              }`}
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div
        className={`hidden items-center rounded-[6px] p-[3px] xl:flex ${
          editorTheme === "dark" ? "bg-[#25252e]" : "bg-[#e9eff6]"
        }`}
      >
        <ToolbarIconButton ariaLabel="Deshacer" theme={editorTheme}>
          <Undo2 className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton ariaLabel="Rehacer" theme={editorTheme}>
          <Redo2 className="h-4 w-4" />
        </ToolbarIconButton>
        <span
          className={`mx-1 h-5 w-px ${
            editorTheme === "dark" ? "bg-[#2a2a34]" : "bg-[#cfd8e3]"
          }`}
        />
        <ToolbarIconButton ariaLabel="Cortar" theme={editorTheme}>
          <Scissors className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton ariaLabel="Copiar" theme={editorTheme}>
          <Copy className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Eliminar"
          disabled={!canDeleteSelection}
          theme={editorTheme}
          onClick={removeSelectedElement}
        >
          <Trash2 className="h-4 w-4" />
        </ToolbarIconButton>
        <span
          className={`mx-1 h-5 w-px ${
            editorTheme === "dark" ? "bg-[#2a2a34]" : "bg-[#cfd8e3]"
          }`}
        />
        <ToolbarIconButton ariaLabel="Acercar" theme={editorTheme}>
          <ZoomIn className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton ariaLabel="Alejar" theme={editorTheme}>
          <ZoomOut className="h-4 w-4" />
        </ToolbarIconButton>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`hidden max-w-40 truncate text-[13px] md:block ${
            editorTheme === "dark" ? "text-[#6b7280]" : "text-[#64748b]"
          }`}
        >
          {projectName}
        </span>
        <a
          className={`hidden rounded-[6px] border px-3 py-[7px] text-[12px] font-medium transition lg:inline-flex ${
            editorTheme === "dark"
              ? "border-[#35353f] bg-[#25252e] text-[#f0f0f4] hover:bg-[#2e2e38]"
              : "border-[#cfd8e3] bg-[#e9eff6] text-[#0f172a] hover:bg-[#dbe7f3]"
          }`}
          href="/gallery"
        >
          Biblioteca
        </a>

        <div className="relative" ref={settingsMenuRef}>
          <ToolbarIconButton
            ariaLabel="Configuración"
            theme={editorTheme}
            onClick={() => setIsSettingsOpen((previous) => !previous)}
          >
            <Settings className="h-4 w-4" />
          </ToolbarIconButton>

          {isSettingsOpen ? (
            <div
              className={`absolute right-0 top-10 z-50 min-w-[186px] rounded-[8px] border p-2 ${
                editorTheme === "dark"
                  ? "border-[#2a2a34] bg-[#1a1a20] shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
                  : "border-[#d7dee8] bg-[#ffffff] shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
              }`}
            >
              <p
                className={`px-2 pb-1 text-[11px] uppercase tracking-[0.04em] ${
                  editorTheme === "dark" ? "text-[#6b7280]" : "text-[#64748b]"
                }`}
              >
                Apariencia
              </p>
              <div
                className={`mt-1 flex items-center justify-between rounded-[8px] border p-2 ${
                  editorTheme === "dark"
                    ? "border-[#2a2a34] bg-[#171721]"
                    : "border-[#d7dee8] bg-[#f8fafc]"
                }`}
              >
                <Moon
                  className={`h-4 w-4 ${
                    editorTheme === "dark" ? "text-[#c7d2fe]" : "text-[#94a3b8]"
                  }`}
                />
                <button
                  aria-label="Alternar modo oscuro"
                  className={`relative h-6 w-11 rounded-full transition ${
                    editorTheme === "dark" ? "bg-[#6366f1]" : "bg-[#cbd5e1]"
                  }`}
                  onClick={() =>
                    setEditorTheme((previous) =>
                      previous === "dark" ? "light" : "dark",
                    )
                  }
                  type="button"
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      editorTheme === "dark" ? "left-0.5" : "left-[1.35rem]"
                    }`}
                  />
                </button>
                <Sun
                  className={`h-4 w-4 ${
                    editorTheme === "dark" ? "text-[#94a3b8]" : "text-[#f59e0b]"
                  }`}
                />
              </div>
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#6366f1] px-4 py-[7px] text-[13px] font-medium text-white transition hover:bg-[#818cf8]"
          type="button"
        >
          <Upload className="h-4 w-4" />
          Exportar
        </button>
      </div>
    </header>
  );
}
