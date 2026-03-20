import type { ReactNode } from 'react'
import {
  ChevronDown,
  Eye,
  Maximize2,
  SlidersHorizontal,
  Type,
  Zap,
} from 'lucide-react'

type SectionProps = {
  title: string
  icon: ReactNode
  children: ReactNode
}

type PropertyRowProps = {
  label: string
  children: ReactNode
}

function PropertySection({ title, icon, children }: SectionProps) {
  return (
    <section className="border-b border-[#2a2a34]">
      <button
        aria-expanded
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold text-[#9ca3af] transition hover:bg-white/[0.02]"
        type="button"
      >
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-[15px] w-[15px] opacity-50" />
      </button>
      <div className="space-y-1.5 px-3.5 pb-3.5 pt-1.5">{children}</div>
    </section>
  )
}

function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex min-h-[30px] items-center gap-2">
      <label className="min-w-16 whitespace-nowrap text-[11px] text-[#6b7280] max-[1024px]:min-w-[52px] max-[1024px]:text-[10px]">
        {label}
      </label>
      <div className="flex flex-1 items-center justify-end gap-1.5">{children}</div>
    </div>
  )
}

const inputClassName =
  'h-7 rounded-[4px] border border-[#2a2a34] bg-[#25252e] px-2 text-xs text-[#f0f0f4] outline-none transition focus:border-[#6366f1]'

export function InspectorPanel() {
  return (
    <aside className="row-start-1 flex min-h-0 flex-col border-l border-[#2a2a34] bg-[#1a1a20]">
      <header className="border-b border-[#2a2a34] px-4 pb-3 pt-4">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#9ca3af]">
          <SlidersHorizontal className="h-[15px] w-[15px]" />
          Propiedades
        </h2>
        <span className="mt-1 block text-[11px] text-[#6b7280]">Clip: intro_final.mp4</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PropertySection icon={<Maximize2 className="h-[15px] w-[15px]" />} title="Transformar">
          <PropertyRow label="Posición X">
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="960" readOnly />
            <span className="w-4 text-[10px] text-[#6b7280]">px</span>
          </PropertyRow>
          <PropertyRow label="Posición Y">
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="540" readOnly />
            <span className="w-4 text-[10px] text-[#6b7280]">px</span>
          </PropertyRow>
          <PropertyRow label="Escala">
            <input className="w-full" defaultValue="100" max="200" min="0" type="range" />
            <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">100%</span>
          </PropertyRow>
          <PropertyRow label="Rotación">
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="0" readOnly />
            <span className="w-4 text-[10px] text-[#6b7280]">°</span>
          </PropertyRow>
          <PropertyRow label="Opacidad">
            <input className="w-full" defaultValue="100" max="100" min="0" type="range" />
            <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">100%</span>
          </PropertyRow>
        </PropertySection>

        <PropertySection icon={<Eye className="h-[15px] w-[15px]" />} title="Apariencia">
          <PropertyRow label="Fondo">
            <span className="inline-block h-[22px] w-[22px] shrink-0 rounded-[4px] border-2 border-[#35353f] bg-[#1a1a2e]" />
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="#1A1A2E" readOnly />
          </PropertyRow>
          <PropertyRow label="Borde">
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="0" readOnly />
            <span className="w-4 text-[10px] text-[#6b7280]">px</span>
          </PropertyRow>
          <PropertyRow label="Radio">
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="0" readOnly />
            <span className="w-4 text-[10px] text-[#6b7280]">px</span>
          </PropertyRow>
          <PropertyRow label="Sombra">
            <select className={`${inputClassName} w-full appearance-none pr-6`}>
              <option>Ninguna</option>
              <option>Suave</option>
              <option>Media</option>
              <option>Fuerte</option>
            </select>
          </PropertyRow>
        </PropertySection>

        <PropertySection icon={<Zap className="h-[15px] w-[15px]" />} title="Efectos">
          <PropertyRow label="Desenfoque">
            <input className="w-full" defaultValue="0" max="20" min="0" type="range" />
            <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">0</span>
          </PropertyRow>
          <PropertyRow label="Brillo">
            <input className="w-full" defaultValue="0" max="100" min="-100" type="range" />
            <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">0</span>
          </PropertyRow>
          <PropertyRow label="Contraste">
            <input className="w-full" defaultValue="0" max="100" min="-100" type="range" />
            <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">0</span>
          </PropertyRow>
          <PropertyRow label="Saturación">
            <input className="w-full" defaultValue="0" max="100" min="-100" type="range" />
            <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">0</span>
          </PropertyRow>
        </PropertySection>

        <PropertySection icon={<Type className="h-[15px] w-[15px]" />} title="Texto">
          <PropertyRow label="Fuente">
            <select className={`${inputClassName} w-full appearance-none pr-6`}>
              <option>Inter</option>
              <option>Roboto</option>
              <option>Montserrat</option>
              <option>Open Sans</option>
              <option>Poppins</option>
            </select>
          </PropertyRow>
          <PropertyRow label="Tamaño">
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="48" readOnly />
            <span className="w-4 text-[10px] text-[#6b7280]">px</span>
          </PropertyRow>
          <PropertyRow label="Color">
            <span className="inline-block h-[22px] w-[22px] shrink-0 rounded-[4px] border-2 border-[#35353f] bg-white" />
            <input className={`${inputClassName} w-[72px] text-right tabular-nums`} defaultValue="#FFFFFF" readOnly />
          </PropertyRow>
          <PropertyRow label="Peso">
            <select className={`${inputClassName} w-full appearance-none pr-6`}>
              <option>Light (300)</option>
              <option>Regular (400)</option>
              <option>Medium (500)</option>
              <option>Semi Bold (600)</option>
              <option>Bold (700)</option>
            </select>
          </PropertyRow>
        </PropertySection>
      </div>
    </aside>
  )
}
