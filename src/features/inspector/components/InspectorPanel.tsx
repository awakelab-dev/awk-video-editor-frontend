import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, Minus, Plus, SlidersHorizontal, Square, Type } from 'lucide-react'
import { useEditorStore } from '../../../shared/store'
import type { EditorElement } from '../../../shared/types/editor'

type SectionProps = {
  title: string
  icon: ReactNode
  children: ReactNode
}

type PropertyRowProps = {
  label: string
  children: ReactNode
}

type SelectedElementContext = {
  trackId: string
  element: EditorElement
}

type NumericFieldProps = {
  ariaLabel: string
  max?: number
  min?: number
  onValueChange: (value: number) => void
  step?: number
  value: number
  widthClassName?: string
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
const numericInputClassName = `${inputClassName} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`
const stepperButtonClassName =
  'flex h-full w-6 items-center justify-center bg-[#212129] text-[#7f8695] transition hover:bg-[#2a2a34] hover:text-[#c3c7cf]'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function opacityToPercent(opacity: number) {
  const safeOpacity = Number.isFinite(opacity) ? opacity : 1
  return safeOpacity <= 1
    ? Math.round(clamp(safeOpacity, 0, 1) * 100)
    : Math.round(clamp(safeOpacity, 0, 100))
}

function findSelectedElementContext(
  selectedElementId: string | null,
  tracks: ReturnType<typeof useEditorStore.getState>['tracks'],
): SelectedElementContext | null {
  if (!selectedElementId) {
    return null
  }

  for (const track of tracks) {
    const element = track.elements.find((trackElement) => trackElement.id === selectedElementId)

    if (element) {
      return {
        trackId: track.id,
        element,
      }
    }
  }

  return null
}

function NumericField({
  ariaLabel,
  max,
  min,
  onValueChange,
  step = 1,
  value,
  widthClassName = 'w-[72px]',
}: NumericFieldProps) {
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  const sanitizeValue = (nextValue: number) => {
    let safeValue = nextValue
    if (typeof min === 'number') {
      safeValue = Math.max(min, safeValue)
    }
    if (typeof max === 'number') {
      safeValue = Math.min(max, safeValue)
    }
    return safeValue
  }

  const applyValue = (nextValue: number) => {
    if (!Number.isFinite(nextValue)) {
      return
    }

    const safeValue = sanitizeValue(nextValue)
    valueRef.current = safeValue

    onValueChange(safeValue)
  }

  const clearHoldTimers = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  const startHold = (direction: 1 | -1) => {
    applyValue(valueRef.current + direction * step)
    clearHoldTimers()

    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        applyValue(valueRef.current + direction * step)
      }, 70)
    }, 300)
  }

  useEffect(() => clearHoldTimers, [])

  return (
    <div className="flex items-center gap-1">
      <input
        aria-label={ariaLabel}
        className={`${numericInputClassName} ${widthClassName} text-right tabular-nums`}
        max={max}
        min={min}
        onChange={(event) => applyValue(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
      <div className="flex h-7 overflow-hidden rounded-[4px] border border-[#2a2a34]">
        <button
          aria-label={`${ariaLabel} disminuir`}
          className={stepperButtonClassName}
          onMouseDown={() => startHold(-1)}
          onMouseLeave={clearHoldTimers}
          onMouseUp={clearHoldTimers}
          type="button"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label={`${ariaLabel} aumentar`}
          className={stepperButtonClassName}
          onMouseDown={() => startHold(1)}
          onMouseLeave={clearHoldTimers}
          onMouseUp={clearHoldTimers}
          type="button"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function InspectorPanel() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const tracks = useEditorStore((state) => state.tracks)
  const updateElementProperty = useEditorStore((state) => state.updateElementProperty)

  const selectedElementContext = useMemo(
    () => findSelectedElementContext(selectedElementId, tracks),
    [selectedElementId, tracks],
  )

  const selectedElement = selectedElementContext?.element ?? null
  const selectedTextElement = selectedElement?.type === 'text' ? selectedElement : null
  const selectedRectangleElement =
    selectedElement?.type === 'shape' && selectedElement.shapeType === 'rectangle'
      ? selectedElement
      : null

  const selectedOpacityPercent = selectedElement ? opacityToPercent(selectedElement.opacity) : 100

  const updateSelectedProperty = (
    property: keyof EditorElement,
    value: EditorElement[keyof EditorElement],
  ) => {
    if (!selectedElementContext) {
      return
    }

    updateElementProperty(
      selectedElementContext.trackId,
      selectedElementContext.element.id,
      property,
      value,
    )
  }

  return (
    <aside className="row-start-1 flex min-h-0 flex-col border-l border-[#2a2a34] bg-[#1a1a20]">
      <header className="border-b border-[#2a2a34] px-4 pb-3 pt-4">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#9ca3af]">
          <SlidersHorizontal className="h-[15px] w-[15px]" />
          Propiedades
        </h2>
        <span className="mt-1 block text-[11px] text-[#6b7280]">
          {selectedElement ? selectedElement.name : 'Sin elemento seleccionado'}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!selectedElement ? (
          <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-xs text-[#6b7280]">
            Haz click en un elemento para modificar sus propiedades.
          </div>
        ) : selectedTextElement ? (
          <PropertySection icon={<Type className="h-[15px] w-[15px]" />} title="Texto">
            <PropertyRow label="Fuente">
              <select
                aria-label="Fuente"
                className={`${inputClassName} w-full appearance-none pr-6`}
                onChange={(event) => updateSelectedProperty('fontFamily', event.target.value)}
                value={selectedTextElement.fontFamily}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
              </select>
            </PropertyRow>

            <PropertyRow label="Tamaño">
              <NumericField
                ariaLabel="Tamaño"
                min={1}
                onValueChange={(nextValue) => updateSelectedProperty('fontSize', nextValue)}
                step={1}
                value={selectedTextElement.fontSize}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Color">
              <input
                aria-label="Color"
                className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[4px] border border-[#35353f] bg-transparent p-0"
                onChange={(event) => updateSelectedProperty('textColor', event.target.value)}
                type="color"
                value={selectedTextElement.textColor}
              />
              <input
                aria-label="Codigo color"
                className={`${inputClassName} w-[90px] text-right tabular-nums`}
                onChange={(event) => updateSelectedProperty('textColor', event.target.value)}
                value={selectedTextElement.textColor}
              />
            </PropertyRow>

            <PropertyRow label="Posicion X">
              <NumericField
                ariaLabel="Posicion X"
                onValueChange={(nextValue) => updateSelectedProperty('x', nextValue)}
                value={selectedTextElement.x}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Posicion Y">
              <NumericField
                ariaLabel="Posicion Y"
                onValueChange={(nextValue) => updateSelectedProperty('y', nextValue)}
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

                  updateSelectedProperty('opacity', clamp(nextPercent, 0, 100) / 100)
                }}
                type="range"
                value={selectedOpacityPercent}
              />
              <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">
                {selectedOpacityPercent}%
              </span>
            </PropertyRow>

            <div className="pt-1">
              <label
                className="mb-1.5 block text-[11px] text-[#6b7280]"
                htmlFor="inspector-text-content"
              >
                Texto:
              </label>
              <textarea
                id="inspector-text-content"
                aria-label="Texto"
                className="min-h-[84px] w-full resize-y rounded-[4px] border border-[#2a2a34] bg-[#25252e] px-2 py-1.5 text-xs text-[#f0f0f4] outline-none transition focus:border-[#6366f1]"
                onChange={(event) => updateSelectedProperty('text', event.target.value)}
                value={selectedTextElement.text}
              />
            </div>
          </PropertySection>
        ) : selectedRectangleElement ? (
          <PropertySection icon={<Square className="h-[15px] w-[15px]" />} title="Rectángulo">
            <PropertyRow label="Tamaño">
              <NumericField
                ariaLabel="Tamaño"
                min={1}
                onValueChange={(nextSize) => {
                  const safeSize = clamp(nextSize, 1, 9999)
                  const currentWidth = Math.max(1, selectedRectangleElement.width)
                  const aspectRatio = selectedRectangleElement.height / currentWidth
                  const nextHeight = Math.max(1, Math.round(safeSize * aspectRatio))

                  updateSelectedProperty('width', safeSize)
                  updateSelectedProperty('height', nextHeight)
                }}
                step={1}
                value={Math.round(selectedRectangleElement.width)}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Posicion X">
              <NumericField
                ariaLabel="Posicion X"
                onValueChange={(nextValue) => updateSelectedProperty('x', nextValue)}
                value={selectedRectangleElement.x}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Posicion Y">
              <NumericField
                ariaLabel="Posicion Y"
                onValueChange={(nextValue) => updateSelectedProperty('y', nextValue)}
                value={selectedRectangleElement.y}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Borde">
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-end gap-1.5">
                  <NumericField
                    ariaLabel="Grosor borde"
                    min={0}
                    onValueChange={(nextValue) => updateSelectedProperty('strokeWidth', nextValue)}
                    step={1}
                    value={selectedRectangleElement.strokeWidth}
                    widthClassName="w-[62px]"
                  />
                  <span className="w-4 text-[10px] text-[#6b7280]">px</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <input
                    aria-label="Color borde"
                    className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[4px] border border-[#35353f] bg-transparent p-0"
                    onChange={(event) => updateSelectedProperty('strokeColor', event.target.value)}
                    type="color"
                    value={selectedRectangleElement.strokeColor}
                  />
                  <input
                    aria-label="Codigo color borde"
                    className={`${inputClassName} w-[90px] text-right tabular-nums`}
                    onChange={(event) => updateSelectedProperty('strokeColor', event.target.value)}
                    value={selectedRectangleElement.strokeColor}
                  />
                </div>
              </div>
            </PropertyRow>

            <PropertyRow label="Relleno">
              <input
                aria-label="Relleno"
                className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[4px] border border-[#35353f] bg-transparent p-0"
                onChange={(event) => updateSelectedProperty('fillColor', event.target.value)}
                type="color"
                value={selectedRectangleElement.fillColor}
              />
              <input
                aria-label="Codigo relleno"
                className={`${inputClassName} w-[90px] text-right tabular-nums`}
                onChange={(event) => updateSelectedProperty('fillColor', event.target.value)}
                value={selectedRectangleElement.fillColor}
              />
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

                  updateSelectedProperty('opacity', clamp(nextPercent, 0, 100) / 100)
                }}
                type="range"
                value={selectedOpacityPercent}
              />
              <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">
                {selectedOpacityPercent}%
              </span>
            </PropertyRow>
          </PropertySection>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-xs text-[#6b7280]">
            Selecciona un texto o un rectángulo para editar sus propiedades.
          </div>
        )}
      </div>
    </aside>
  )
}
