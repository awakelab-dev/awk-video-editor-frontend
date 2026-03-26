import { useMemo } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal, Type } from 'lucide-react'
import { useEditorStore } from '../../../shared/store'
import type { TextElement } from '../../../shared/types/editor'

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

type SelectedTextContext = {
  trackId: string
  element: TextElement
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function opacityToPercent(opacity: number) {
  const safeOpacity = Number.isFinite(opacity) ? opacity : 1
  return safeOpacity <= 1 ? Math.round(clamp(safeOpacity, 0, 1) * 100) : Math.round(clamp(safeOpacity, 0, 100))
}

function findSelectedTextContext(selectedElementId: string | null, tracks: ReturnType<typeof useEditorStore.getState>['tracks']): SelectedTextContext | null {
  if (!selectedElementId) {
    return null
  }

  for (const track of tracks) {
    const element = track.elements.find((trackElement) => trackElement.id === selectedElementId)

    if (element?.type === 'text') {
      return {
        trackId: track.id,
        element,
      }
    }
  }

  return null
}

export function InspectorPanel() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const tracks = useEditorStore((state) => state.tracks)
  const updateElementProperty = useEditorStore((state) => state.updateElementProperty)

  const selectedTextContext = useMemo(
    () => findSelectedTextContext(selectedElementId, tracks),
    [selectedElementId, tracks],
  )

  const selectedTextElement = selectedTextContext?.element ?? null
  const selectedOpacityPercent = selectedTextElement ? opacityToPercent(selectedTextElement.opacity) : 100

  const updateSelectedTextProperty = <K extends keyof TextElement>(
    property: K,
    value: TextElement[K],
  ) => {
    if (!selectedTextContext) {
      return
    }

    updateElementProperty(selectedTextContext.trackId, selectedTextContext.element.id, property, value)
  }

  const handleNumericPropertyChange =
    <K extends keyof TextElement>(property: K) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value)

      if (!Number.isFinite(nextValue)) {
        return
      }

      updateSelectedTextProperty(property, nextValue as TextElement[K])
    }

  return (
    <aside className="row-start-1 flex min-h-0 flex-col border-l border-[#2a2a34] bg-[#1a1a20]">
      <header className="border-b border-[#2a2a34] px-4 pb-3 pt-4">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#9ca3af]">
          <SlidersHorizontal className="h-[15px] w-[15px]" />
          Propiedades
        </h2>
        <span className="mt-1 block text-[11px] text-[#6b7280]">
          {selectedTextElement ? selectedTextElement.name : 'Sin elemento seleccionado'}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!selectedTextElement ? (
          <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-xs text-[#6b7280]">
            Haz click en un elemento para modificar sus propiedades.
          </div>
        ) : (
          <PropertySection icon={<Type className="h-[15px] w-[15px]" />} title="Texto">
            <PropertyRow label="Fuente">
              <select
                aria-label="Fuente"
                className={`${inputClassName} w-full appearance-none pr-6`}
                onChange={(event) => updateSelectedTextProperty('fontFamily', event.target.value)}
                value={selectedTextElement.fontFamily}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
              </select>
            </PropertyRow>

            <PropertyRow label="Tamano">
              <input
                aria-label="Tamano"
                className={`${inputClassName} w-[72px] text-right tabular-nums`}
                min={1}
                onChange={handleNumericPropertyChange('fontSize')}
                step={1}
                type="number"
                value={selectedTextElement.fontSize}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Color">
              <input
                aria-label="Color"
                className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[4px] border border-[#35353f] bg-transparent p-0"
                onChange={(event) => updateSelectedTextProperty('textColor', event.target.value)}
                type="color"
                value={selectedTextElement.textColor}
              />
              <input
                aria-label="Codigo color"
                className={`${inputClassName} w-[90px] text-right tabular-nums`}
                onChange={(event) => updateSelectedTextProperty('textColor', event.target.value)}
                value={selectedTextElement.textColor}
              />
            </PropertyRow>

            <PropertyRow label="Posicion X">
              <input
                aria-label="Posicion X"
                className={`${inputClassName} w-[72px] text-right tabular-nums`}
                onChange={handleNumericPropertyChange('x')}
                type="number"
                value={selectedTextElement.x}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Posicion Y">
              <input
                aria-label="Posicion Y"
                className={`${inputClassName} w-[72px] text-right tabular-nums`}
                onChange={handleNumericPropertyChange('y')}
                type="number"
                value={selectedTextElement.y}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Opacidad">
              <input
                aria-label="Opacidad"
                className="w-full"
                max={100}
                min={0}
                onChange={(event) => {
                  const nextPercent = Number(event.target.value)

                  if (!Number.isFinite(nextPercent)) {
                    return
                  }

                  updateSelectedTextProperty('opacity', clamp(nextPercent, 0, 100) / 100)
                }}
                type="range"
                value={selectedOpacityPercent}
              />
              <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">
                {selectedOpacityPercent}%
              </span>
            </PropertyRow>
          </PropertySection>
        )}
      </div>
    </aside>
  )
}
