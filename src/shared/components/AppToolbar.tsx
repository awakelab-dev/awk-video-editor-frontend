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
  onClick?: () => void;
};

function ToolbarIconButton({
  ariaLabel,
  children,
  disabled = false,
  onClick,
}: ToolbarIconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition ${disabled ? "cursor-not-allowed opacity-40" : "hover:bg-[#2e2e38] hover:text-[#f0f0f4]"}`}
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
    <header className="flex h-[52px] items-center justify-between gap-4 border-b border-[#2a2a34] bg-[#16161a] px-4">
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
              className="rounded-[4px] px-3 py-1.5 text-[13px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="hidden items-center rounded-[6px] bg-[#25252e] p-[3px] xl:flex">
        <ToolbarIconButton ariaLabel="Deshacer">
          <Undo2 className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton ariaLabel="Rehacer">
          <Redo2 className="h-4 w-4" />
        </ToolbarIconButton>
        <span className="mx-1 h-5 w-px bg-[#2a2a34]" />
        <ToolbarIconButton ariaLabel="Cortar">
          <Scissors className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton ariaLabel="Copiar">
          <Copy className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Eliminar"
          disabled={!canDeleteSelection}
          onClick={removeSelectedElement}
        >
          <Trash2 className="h-4 w-4" />
        </ToolbarIconButton>
        <span className="mx-1 h-5 w-px bg-[#2a2a34]" />
        <ToolbarIconButton ariaLabel="Acercar">
          <ZoomIn className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton ariaLabel="Alejar">
          <ZoomOut className="h-4 w-4" />
        </ToolbarIconButton>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden max-w-40 truncate text-[13px] text-[#6b7280] md:block">
          {projectName}
        </span>
        <a
          className="hidden rounded-[6px] border border-[#35353f] bg-[#25252e] px-3 py-[7px] text-[12px] font-medium text-[#f0f0f4] transition hover:bg-[#2e2e38] lg:inline-flex"
          href="/gallery"
        >
          Biblioteca
        </a>

        <div className="relative" ref={settingsMenuRef}>
          <ToolbarIconButton
            ariaLabel="Configuración"
            onClick={() => setIsSettingsOpen((previous) => !previous)}
          >
            <Settings className="h-4 w-4" />
          </ToolbarIconButton>

          {isSettingsOpen ? (
            <div className="absolute right-0 top-10 z-50 min-w-[186px] rounded-[8px] border border-[#2a2a34] bg-[#1a1a20] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
              <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.04em] text-[#6b7280]">
                Apariencia
              </p>

              <button
                className={`flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-left text-[12px] transition ${
                  editorTheme === "dark"
                    ? "bg-[#25252e] text-[#f0f0f4]"
                    : "text-[#9ca3af] hover:bg-[#25252e]"
                }`}
                onClick={() => {
                  setEditorTheme("dark");
                  setIsSettingsOpen(false);
                }}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <Moon className="h-3.5 w-3.5" />
                  Modo noche
                </span>
                {editorTheme === "dark" ? (
                  <span className="text-[#818cf8]">●</span>
                ) : null}
              </button>

              <button
                className={`mt-1 flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-left text-[12px] transition ${
                  editorTheme === "light"
                    ? "bg-[#25252e] text-[#f0f0f4]"
                    : "text-[#9ca3af] hover:bg-[#25252e]"
                }`}
                onClick={() => {
                  setEditorTheme("light");
                  setIsSettingsOpen(false);
                }}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5" />
                  Modo claro
                </span>
                {editorTheme === "light" ? (
                  <span className="text-[#818cf8]">●</span>
                ) : null}
              </button>
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
