import { Maximize2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../../../shared/store'
import type { EditorElement, ImageElement, ShapeElement, TextElement, VideoElement } from '../../../shared/types/editor'
import { usePlaybackEngine } from '../hooks/usePlaybackEngine'
import { clamp, formatTimecode, getPlaybackDuration, isElementActiveAtTime } from '../utils/timeline'

type ActiveVisualContext = {
  trackId: string
  trackIndex: number
  element: Exclude<EditorElement, { type: 'audio' }>
}

function buildBaseVisualStyle(
  element: Exclude<EditorElement, { type: 'audio' }>,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  const safeW = Math.max(resolution.w, 1)
  const safeH = Math.max(resolution.h, 1)

  return {
    position: 'absolute',
    left: `${(element.x / safeW) * 100}%`,
    top: `${(element.y / safeH) * 100}%`,
    width: `${clamp((element.width / safeW) * 100, 0, 100)}%`,
    height: `${clamp((element.height / safeH) * 100, 0, 100)}%`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    opacity: element.opacity,
    zIndex,
  }
}

function buildTextElementStyle(
  element: TextElement,
  resolution: { w: number; h: number },
  previewScale: number,
  zIndex: number,
): CSSProperties {
  return {
    ...buildBaseVisualStyle(element, resolution, zIndex),
    color: element.textColor,
    backgroundColor: element.backgroundColor,
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize * previewScale}px`,
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
    letterSpacing: `${element.letterSpacing * previewScale}px`,
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
    padding: `${4 * previewScale}px ${8 * previewScale}px`,
    textShadow: `0 ${2 * previewScale}px ${6 * previewScale}px rgba(0,0,0,0.55)`,
  }
}

function buildShapeElementStyle(
  element: ShapeElement,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  return {
    ...buildBaseVisualStyle(element, resolution, zIndex),
    backgroundColor: element.fillColor,
    border: 'none',
    outline: `${Math.max(0, element.strokeWidth)}px solid ${element.strokeColor}`,
    outlineOffset: '0px',
    borderRadius: `${Math.max(0, element.cornerRadius)}px`,
  }
}

function buildMediaElementStyle(
  element: ImageElement | VideoElement,
  resolution: { w: number; h: number },
  zIndex: number,
): CSSProperties {
  return {
    ...buildBaseVisualStyle(element, resolution, zIndex),
    overflow: 'hidden',
    borderRadius: '6px',
    background: 'rgba(17,17,24,0.85)',
  }
}

function buildElementStyle(
  element: Exclude<EditorElement, { type: 'audio' }>,
  resolution: { w: number; h: number },
  previewScale: number,
  zIndex: number,
): CSSProperties {
  if (element.type === 'text') {
    return buildTextElementStyle(element, resolution, previewScale, zIndex)
  }

  if (element.type === 'shape') {
    return buildShapeElementStyle(element, resolution, zIndex)
  }

  return buildMediaElementStyle(element, resolution, zIndex)
}

export function PlaybackWorkspace() {
  usePlaybackEngine()

  const tracks = useEditorStore((state) => state.tracks)
  const currentTime = useEditorStore((state) => state.currentTime)
  const resolution = useEditorStore((state) => state.resolution)
  const projectDuration = useEditorStore((state) => state.duration)
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const selectElement = useEditorStore((state) => state.selectElement)
  const updateElementProperty = useEditorStore((state) => state.updateElementProperty)
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const play = useEditorStore((state) => state.play)
  const pause = useEditorStore((state) => state.pause)
  const seek = useEditorStore((state) => state.seek)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null)

  const playbackDuration = useMemo(() => getPlaybackDuration(projectDuration, tracks), [projectDuration, tracks])

  useEffect(() => {
    if (!previewRef.current) {
      return
    }

    const updateScale = () => {
      if (!previewRef.current) {
        return
      }

      const previewWidth = previewRef.current.clientWidth
      const previewHeight = previewRef.current.clientHeight
      const safeW = Math.max(resolution.w, 1)
      const safeH = Math.max(resolution.h, 1)
      const nextScale = Math.min(previewWidth / safeW, previewHeight / safeH)

      setPreviewScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(previewRef.current)

    return () => {
      observer.disconnect()
    }
  }, [resolution.h, resolution.w])

  const activeVisualElements = useMemo<ActiveVisualContext[]>(() => {
    const visible: ActiveVisualContext[] = []

    tracks.forEach((track, trackIndex) => {
      track.elements.forEach((element) => {
        if (element.type === 'audio') {
          return
        }

        if (isElementActiveAtTime(element, currentTime)) {
          visible.push({ trackId: track.id, trackIndex, element })
        }
      })
    })

    return visible
  }, [currentTime, tracks])

  const hasProjectContent = useMemo(
    () => tracks.some((track) => track.elements.length > 0),
    [tracks],
  )

  const handleVisualMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>,
    context: ActiveVisualContext,
  ) => {
    selectElement(context.element.id, 'canvas')

    if (!previewRef.current || event.button !== 0) {
      return
    }

    event.preventDefault()

    const dragStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: context.element.x,
      startY: context.element.y,
      trackId: context.trackId,
      elementId: context.element.id,
    }

    const safeScale = Math.max(previewScale, 0.001)

    let lastX = dragStart.startX
    let lastY = dragStart.startY
    setDraggingElementId(context.element.id)

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - dragStart.pointerX) / safeScale
      const deltaY = (moveEvent.clientY - dragStart.pointerY) / safeScale
      const nextX = Math.round(dragStart.startX + deltaX)
      const nextY = Math.round(dragStart.startY + deltaY)

      if (nextX === lastX && nextY === lastY) {
        return
      }

      lastX = nextX
      lastY = nextY
      updateElementProperty(dragStart.trackId, dragStart.elementId, 'x', nextX)
      updateElementProperty(dragStart.trackId, dragStart.elementId, 'y', nextY)
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setDraggingElementId(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleSkipBackward = () => {
    seek(clamp(currentTime - 1, 0, playbackDuration))
  }

  const handleSkipForward = () => {
    seek(clamp(currentTime + 1, 0, playbackDuration))
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  return (
    <section className="row-start-1 flex min-h-0 flex-col overflow-hidden bg-[#0d0d11]">
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <figure className="flex h-full w-full items-center justify-center">
          <div
            className="relative flex aspect-video w-full max-w-[800px] items-center justify-center overflow-hidden rounded-[8px] bg-black shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
            data-testid="playback-preview"
            ref={previewRef}
          >
            {activeVisualElements.map((context) => {
              const isSelected = selectedElementId === context.element.id
              const isDragging = draggingElementId === context.element.id
              const style = buildElementStyle(context.element, resolution, previewScale, context.trackIndex + 1)

              if (context.element.type === 'text') {
                return (
                  <div
                    className={`select-none ${isDragging ? 'cursor-grabbing' : 'cursor-move'} ${isSelected ? 'ring-1 ring-white/60' : ''}`}
                    data-testid="playback-text-overlay"
                    key={context.element.id}
                    onMouseDown={(event) => handleVisualMouseDown(event, context)}
                    style={style}
                  >
                    {context.element.text}
                  </div>
                )
              }

              if (context.element.type === 'image') {
                return (
                  <div
                    className={`select-none overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-move'} ${isSelected ? 'ring-1 ring-white/60' : ''}`}
                    data-testid="playback-image-overlay"
                    key={context.element.id}
                    onMouseDown={(event) => handleVisualMouseDown(event, context)}
                    style={style}
                  >
                    <img
                      alt={context.element.name}
                      className="h-full w-full"
                      draggable={false}
                      src={context.element.source}
                      style={{ objectFit: context.element.fit }}
                    />
                  </div>
                )
              }

              if (context.element.type === 'video') {
                return (
                  <div
                    className={`relative flex select-none items-center justify-center text-[11px] font-semibold text-white/70 ${isDragging ? 'cursor-grabbing' : 'cursor-move'} ${isSelected ? 'ring-1 ring-white/60' : ''}`}
                    data-testid="playback-video-overlay"
                    key={context.element.id}
                    onMouseDown={(event) => handleVisualMouseDown(event, context)}
                    style={style}
                  >
                    <span className="rounded bg-black/55 px-2 py-1">Video: {context.element.name}</span>
                  </div>
                )
              }

              return (
                <div
                  className={`select-none ${isDragging ? 'cursor-grabbing' : 'cursor-move'} ${isSelected ? 'ring-1 ring-white/60' : ''}`}
                  data-testid="playback-shape-overlay"
                  key={context.element.id}
                  onMouseDown={(event) => handleVisualMouseDown(event, context)}
                  style={style}
                />
              )
            })}
            {!hasProjectContent && (
              <div className="flex flex-col items-center gap-3 text-[#6b7280]">
                <Play className="h-12 w-12 opacity-30" />
                <p className="text-[13px]">Vista previa del video</p>
              </div>
            )}
          </div>
        </figure>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-2 max-[1024px]:px-3.5 max-[1024px]:pb-2.5 max-[1024px]:pt-1.5">
        <div className="flex items-center gap-1">
          <button
            aria-label="Retroceder"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            onClick={handleSkipBackward}
            type="button"
          >
            <SkipBack className="h-[15px] w-[15px]" />
          </button>
          <button
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366f1] text-white transition hover:bg-[#818cf8]"
            onClick={handlePlayPause}
            type="button"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            aria-label="Avanzar"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            onClick={handleSkipForward}
            type="button"
          >
            <SkipForward className="h-[15px] w-[15px]" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[13px] font-medium tabular-nums">
          <span className="text-[#f0f0f4]">{formatTimecode(currentTime)}</span>
          <span className="mx-0.5 text-[#6b7280]">/</span>
          <span className="text-[#6b7280]">{formatTimecode(playbackDuration)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="Volumen"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <Volume2 className="h-[15px] w-[15px]" />
          </button>
          <div className="h-1 w-[70px] overflow-hidden rounded bg-[#25252e] max-[1024px]:hidden">
            <div className="h-full w-3/4 rounded bg-[#9ca3af] transition hover:bg-[#6366f1]" />
          </div>
          <button
            aria-label="Pantalla completa"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <Maximize2 className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </section>
  )
}
