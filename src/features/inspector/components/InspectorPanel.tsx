import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ChevronDown, Minus, Plus, RotateCw, SlidersHorizontal, Square, Type, Volume2 } from 'lucide-react'
import { useEditorStore } from '../../../shared/store'
import type { EditorElement } from '../../../shared/types/editor'

type KeysOfUnion<T> = T extends T ? keyof T : never
type ValueOfUnion<T, K extends PropertyKey> = T extends T ? (K extends keyof T ? T[K] : never) : never
type EditorElementKey = KeysOfUnion<EditorElement>
type EditorElementValue<K extends EditorElementKey> = ValueOfUnion<EditorElement, K>

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
const textFontOptions = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Impact', value: 'Impact, sans-serif' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function opacityToPercent(opacity: number) {
  const safeOpacity = Number.isFinite(opacity) ? opacity : 1
  return safeOpacity <= 1
    ? Math.round(clamp(safeOpacity, 0, 1) * 100)
    : Math.round(clamp(safeOpacity, 0, 100))
}

function volumeToPercent(volume: number) {
  const safeVolume = Number.isFinite(volume) ? volume : 1
  return Math.round(clamp(safeVolume, 0, 1) * 100)
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

function buildShapePreviewStyle(shape: Extract<EditorElement, { type: 'shape' }>): CSSProperties {
  const sourceWidth = Math.max(1, shape.width)
  const sourceHeight = Math.max(1, shape.height)
  const maxPreviewSize = 74
  const scale = Math.min(maxPreviewSize / sourceWidth, maxPreviewSize / sourceHeight)
  const previewWidth = Math.max(14, Math.round(sourceWidth * scale))
  const previewHeight = Math.max(14, Math.round(sourceHeight * scale))

  const baseStyle: CSSProperties = {
    width: `${previewWidth}px`,
    height: `${previewHeight}px`,
    backgroundColor: shape.fillColor,
    outline: `${Math.max(0, shape.strokeWidth)}px solid ${shape.strokeColor}`,
    outlineOffset: '0px',
    transform: `rotate(${shape.rotation}deg)`,
    transformOrigin: 'center center',
    transition: 'transform 120ms ease-out',
  }

  if (shape.shapeType === 'ellipse') {
    return {
      ...baseStyle,
      borderRadius: '9999px',
    }
  }

  if (shape.shapeType === 'triangle') {
    return {
      ...baseStyle,
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    }
  }

  if (shape.shapeType === 'polygon') {
    return {
      ...baseStyle,
      clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
    }
  }

  if (shape.shapeType === 'line') {
    return {
      width: `${previewWidth}px`,
      height: `${Math.max(2, Math.round(Math.max(1, shape.strokeWidth)))}px`,
      backgroundColor: shape.strokeColor,
      borderRadius: '9999px',
      transform: `rotate(${shape.rotation}deg)`,
      transformOrigin: 'center center',
      transition: 'transform 120ms ease-out',
    }
  }

  return {
    ...baseStyle,
    borderRadius: `${Math.max(0, shape.cornerRadius)}px`,
  }
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
  const selectedAudioElement = selectedElement?.type === 'audio' ? selectedElement : null
  const selectedShapeElement = selectedElement?.type === 'shape' ? selectedElement : null
  const isSquareElement =
    selectedShapeElement?.shapeType === 'rectangle'
      ? Math.abs(selectedShapeElement.width - selectedShapeElement.height) < 0.001
      : false
  const shapePanelTitle = selectedShapeElement
    ? selectedShapeElement.shapeType === 'rectangle'
      ? isSquareElement
        ? 'Cuadrado'
        : 'Rectángulo'
      : selectedShapeElement.shapeType === 'ellipse'
        ? 'Círculo'
        : selectedShapeElement.shapeType === 'line'
          ? 'Línea'
          : selectedShapeElement.shapeType === 'triangle'
            ? 'Triángulo'
            : 'Polígono'
    : ''

  const selectedOpacityPercent = selectedElement ? opacityToPercent(selectedElement.opacity) : 100

  const updateSelectedProperty = <K extends EditorElementKey>(property: K, value: EditorElementValue<K>) => {
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
                {!textFontOptions.some(
                  (fontOption) => fontOption.value === selectedTextElement.fontFamily,
                ) && (
                  <option value={selectedTextElement.fontFamily}>{selectedTextElement.fontFamily}</option>
                )}
                {textFontOptions.map((fontOption) => (
                  <option key={fontOption.value} value={fontOption.value}>
                    {fontOption.label}
                  </option>
                ))}
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

            <PropertyRow label="Rotación">
              <input
                aria-label="Rotación texto"
                className="w-full"
                max={180}
                min={-180}
                onChange={(event) => {
                  const nextRotation = Number(event.target.value)
                  if (!Number.isFinite(nextRotation)) {
                    return
                  }
                  updateSelectedProperty('rotation', nextRotation)
                }}
                step={1}
                type="range"
                value={Math.round(selectedTextElement.rotation)}
              />
              <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">
                {Math.round(selectedTextElement.rotation)}°
              </span>
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
        ) : selectedAudioElement ? (
          <PropertySection icon={<Volume2 className="h-[15px] w-[15px]" />} title="Audio">
            <PropertyRow label="Volumen">
              <input
                aria-label="Volumen audio"
                className="w-full"
                max={100}
                min={0}
                onChange={(event) => {
                  const nextPercent = Number(event.target.value)
                  if (!Number.isFinite(nextPercent)) {
                    return
                  }
                  updateSelectedProperty('volume', clamp(nextPercent, 0, 100) / 100)
                }}
                step={1}
                type="range"
                value={volumeToPercent(selectedAudioElement.volume)}
              />
              <span className="min-w-8 text-right text-[11px] tabular-nums text-[#9ca3af]">
                {volumeToPercent(selectedAudioElement.volume)}%
              </span>
            </PropertyRow>

            <PropertyRow label="Silencio">
              <button
                aria-label="Silencio audio"
                className={`${inputClassName} inline-flex w-[92px] items-center justify-center px-0 text-[11px] font-medium ${
                  selectedAudioElement.muted
                    ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#fbbf24]'
                    : 'text-[#9ca3af]'
                }`}
                onClick={() => updateSelectedProperty('muted', !selectedAudioElement.muted)}
                type="button"
              >
                {selectedAudioElement.muted ? 'Activado' : 'Desactivado'}
              </button>
            </PropertyRow>

            <PropertyRow label="Fade In">
              <NumericField
                ariaLabel="Fade In"
                max={Math.max(0, selectedAudioElement.duration)}
                min={0}
                onValueChange={(nextValue) =>
                  updateSelectedProperty('fadeIn', clamp(nextValue, 0, Math.max(0, selectedAudioElement.duration)))
                }
                step={0.1}
                value={Number(selectedAudioElement.fadeIn.toFixed(2))}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">s</span>
            </PropertyRow>

            <PropertyRow label="Fade Out">
              <NumericField
                ariaLabel="Fade Out"
                max={Math.max(0, selectedAudioElement.duration)}
                min={0}
                onValueChange={(nextValue) =>
                  updateSelectedProperty('fadeOut', clamp(nextValue, 0, Math.max(0, selectedAudioElement.duration)))
                }
                step={0.1}
                value={Number(selectedAudioElement.fadeOut.toFixed(2))}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">s</span>
            </PropertyRow>
          </PropertySection>
        ) : selectedShapeElement ? (
          <PropertySection
            icon={<Square className="h-[15px] w-[15px]" />}
            title={shapePanelTitle}
          >
            <PropertyRow label="Tamaño">
              <NumericField
                ariaLabel="Tamaño"
                min={1}
                onValueChange={(nextSize) => {
                  const safeSize = clamp(nextSize, 1, 9999)
                  const currentWidth = Math.max(1, selectedShapeElement.width)
                  const aspectRatio = selectedShapeElement.height / currentWidth
                  const nextHeight = Math.max(1, Math.round(safeSize * aspectRatio))

                  updateSelectedProperty('width', safeSize)
                  updateSelectedProperty('height', nextHeight)
                }}
                step={1}
                value={Math.round(selectedShapeElement.width)}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Posicion X">
              <NumericField
                ariaLabel="Posicion X"
                onValueChange={(nextValue) => updateSelectedProperty('x', nextValue)}
                value={selectedShapeElement.x}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Posicion Y">
              <NumericField
                ariaLabel="Posicion Y"
                onValueChange={(nextValue) => updateSelectedProperty('y', nextValue)}
                value={selectedShapeElement.y}
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Borde: Grosor">
              <NumericField
                ariaLabel="Grosor borde"
                min={0}
                onValueChange={(nextValue) =>
                  updateSelectedProperty('strokeWidth', Math.max(0, nextValue))
                }
                step={1}
                value={selectedShapeElement.strokeWidth}
                widthClassName="w-[62px]"
              />
              <span className="w-4 text-[10px] text-[#6b7280]">px</span>
            </PropertyRow>

            <PropertyRow label="Borde: Color">
              <input
                aria-label="Color borde"
                className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[4px] border border-[#35353f] bg-transparent p-0"
                onChange={(event) => updateSelectedProperty('strokeColor', event.target.value)}
                type="color"
                value={selectedShapeElement.strokeColor}
              />
              <input
                aria-label="Codigo color borde"
                className={`${inputClassName} w-[90px] text-right tabular-nums`}
                onChange={(event) => updateSelectedProperty('strokeColor', event.target.value)}
                value={selectedShapeElement.strokeColor}
              />
            </PropertyRow>

            <PropertyRow label="Relleno">
              <input
                aria-label="Relleno"
                className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[4px] border border-[#35353f] bg-transparent p-0"
                onChange={(event) => updateSelectedProperty('fillColor', event.target.value)}
                type="color"
                value={selectedShapeElement.fillColor}
              />
              <input
                aria-label="Codigo relleno"
                className={`${inputClassName} w-[90px] text-right tabular-nums`}
                onChange={(event) => updateSelectedProperty('fillColor', event.target.value)}
                value={selectedShapeElement.fillColor}
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

            <div className="mt-2 rounded-[6px] border border-[#2a2a34] bg-[#202028] p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#9ca3af]">Vista de la forma</span>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                  <RotateCw className="h-[13px] w-[13px]" />
                  <span>{Math.round(selectedShapeElement.rotation)}°</span>
                </div>
              </div>

              <div className="mb-2.5 flex h-[110px] items-center justify-center rounded-[6px] border border-[#2a2a34] bg-[#16161c]">
                <div
                  data-testid="inspector-shape-preview"
                  style={buildShapePreviewStyle(selectedShapeElement)}
                />
              </div>

              <div className="flex items-center gap-2">
                <RotateCw className="h-[14px] w-[14px] text-[#7f8695]" />
                <input
                  aria-label="Rotación forma"
                  className="w-full"
                  max={180}
                  min={-180}
                  onChange={(event) => {
                    const nextRotation = Number(event.target.value)
                    if (!Number.isFinite(nextRotation)) {
                      return
                    }
                    updateSelectedProperty('rotation', nextRotation)
                  }}
                  step={1}
                  type="range"
                  value={Math.round(selectedShapeElement.rotation)}
                />
              </div>
            </div>
          </PropertySection>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-xs text-[#6b7280]">
            Selecciona un texto o una forma para editar sus propiedades.
          </div>
        )}
      </div>
    </aside>
  )
}
