import type { ReactNode } from "react";
import {
  Clapperboard,
  Copy,
  Redo2,
  Scissors,
  Settings,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEditorStore } from "../store";
import type { TextElement } from "../types/editor";

type ToolbarIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
};

function ToolbarIconButton({ ariaLabel, children }: ToolbarIconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#2e2e38] hover:text-[#f0f0f4]"
      type="button"
    >
      {children}
    </button>
  );
}

export function AppToolbar() {
  const handleAddTestText = () => {
    const store = useEditorStore.getState();
    const targetTrackId = "track-text-debug";

    if (!store.tracks.some((track) => track.id === targetTrackId)) {
      store.createTrack({
        id: targetTrackId,
        name: "Debug Text Track",
        elements: [],
      });
    }

    const elementId = `el-text-${Date.now()}`;
    const testTextElement: TextElement = {
      id: elementId,
      type: "text",
      name: "Texto de prueba",
      startTime: 0,
      duration: 5,
      opacity: 1,
      x: 620,
      y: 120,
      width: 760,
      height: 140,
      rotation: 0,
      text: "Este es un texto de prueba para verificar la funcionalidad de agregar elementos al editor.",
      fontFamily: "Inter",
      fontSize: 48,
      fontWeight: 700,
      textColor: "#FFFFFF",
      backgroundColor: "transparent",
      lineHeight: 1.1,
      letterSpacing: 0,
      textAlign: "left",
    };

    store.addElement(targetTrackId, testTextElement);
    store.selectElement(elementId, "timeline");
    console.log("Editor store after TEMP Add Text:", useEditorStore.getState());
    console.log(
      "Tracks after TEMP Add Text:",
      useEditorStore.getState().tracks,
    );
  };

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
        <ToolbarIconButton ariaLabel="Eliminar">
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
          Proyecto Demo
        </span>
        <ToolbarIconButton ariaLabel="Configuración">
          <Settings className="h-4 w-4" />
        </ToolbarIconButton>
        <button
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#2a2a34] bg-[#25252e] px-3 py-[7px] text-[12px] font-medium text-[#f0f0f4] transition hover:border-[#6366f1] hover:text-[#818cf8]"
          onClick={handleAddTestText}
          type="button"
        >
          TEMP Add Text
        </button>
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
