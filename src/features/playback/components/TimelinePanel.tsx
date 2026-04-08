import {
  Eye,
  Lock,
  Plus,
  Scissors,
  Trash2,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { CSSProperties, DragEvent, MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react'
import { useEditorStore } from '../../../shared/store'
import { clamp, formatSeconds, getPlaybackDuration } from '../utils/timeline'

type TrackKind = 'video' | 'image' | 'audio' | 'text' | 'shape' | 'empty'

const badgeByKind: Record<TrackKind, string> = {
  video: 'bg-[#6366f1]/[0.12] text-[#6366f1]',
  image: 'bg-[#8b5cf6]/[0.12] text-[#a78bfa]',
  audio: 'bg-[#22c55e]/[0.15] text-[#22c55e]',
  text: 'bg-[#f59e0b]/[0.15] text-[#f59e0b]',
  shape: 'bg-[#14b8a6]/[0.15] text-[#14b8a6]',
  empty: 'bg-[#374151]/[0.2] text-[#9ca3af]',
}

const clipByType: Record<Exclude<TrackKind, 'empty'>, string> = {
  video: 'bg-gradient-to-b from-[#818cf8] to-[#6366f1]',
  image: 'bg-gradient-to-b from-[#a78bfa] to-[#8b5cf6]',
  text: 'bg-gradient-to-b from-[#fbbf24] to-[#f59e0b]',
  audio: 'bg-gradient-to-b from-[#4ade80] to-[#22c55e]',
  shape: 'bg-gradient-to-b from-[#2dd4bf] to-[#14b8a6]',
}

type DraggedTimelineElement = {
  elementId: string
  sourceTrackId: string
  duration: number
}

const DRAG_DATA_MIME = 'application/x-awk-track-element'
const NEW_TRACK_DROP_ID = '__new-track__'

function buildTrackId(seed: number): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `track-${crypto.randomUUID()}`
  }

  return `track-${Date.now()}-${seed}`
}

function getTrackKind(elementType?: string): TrackKind {
  if (
    elementType === 'video' ||
    elementType === 'image' ||
    elementType === 'audio' ||
    elementType === 'text' ||
    elementType === 'shape'
  ) {
    return elementType
  }
  return 'empty'
}

function styleFromTime(startTime: number, duration: number, timelineDuration: number): CSSProperties {
  const safeDuration = Math.max(timelineDuration, 0.001)
  const left = (Math.max(startTime, 0) / safeDuration) * 100
  const width = (Math.max(duration, 0.1) / safeDuration) * 100

  return {
    left: `${left}%`,
    width: `${Math.max(width, 1.5)}%`,
  }
}

function startTimeFromPointer(
  clientX: number,
  targetRect: DOMRect,
  timelineDuration: number,
  elementDuration: number,
): number {
  const safeWidth = Math.max(targetRect.width, 1)
  const ratio = clamp((clientX - targetRect.left) / safeWidth, 0, 1)
  const rawTime = ratio * timelineDuration
  const maxStartTime = Math.max(timelineDuration - Math.max(0, elementDuration), 0)
  return clamp(rawTime, 0, maxStartTime)
}

function readDraggedElement(event: DragEvent<HTMLElement>): DraggedTimelineElement | null {
  const payload = event.dataTransfer.getData(DRAG_DATA_MIME)
  if (!payload) {
    return null
  }

  try {
    const parsed = JSON.parse(payload) as Partial<DraggedTimelineElement>
    if (
      typeof parsed.elementId !== 'string' ||
      typeof parsed.sourceTrackId !== 'string' ||
      typeof parsed.duration !== 'number'
    ) {
      return null
    }

    return {
      elementId: parsed.elementId,
      sourceTrackId: parsed.sourceTrackId,
      duration: parsed.duration,
    }
  } catch {
    return null
  }
}

export function TimelinePanel() {
  const tracks = useEditorStore((state) => state.tracks)
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const selectElement = useEditorStore((state) => state.selectElement)
  const moveElement = useEditorStore((state) => state.moveElement)
  const createTrack = useEditorStore((state) => state.createTrack)
  const currentTime = useEditorStore((state) => state.currentTime)
  const projectDuration = useEditorStore((state) => state.duration)
  const zoomLevel = useEditorStore((state) => state.zoomLevel)
  const setzoom = useEditorStore((state) => state.setzoom)
  const seek = useEditorStore((state) => state.seek)
  const pause = useEditorStore((state) => state.pause)
  const play = useEditorStore((state) => state.play)
  const [draggedElement, setDraggedElement] = useState<DraggedTimelineElement | null>(null)
  const [dropPreview, setDropPreview] = useState<{ trackId: string; startTime: number } | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const timelineSurfaceRef = useRef<HTMLDivElement | null>(null)
  const resumePlaybackAfterScrubRef = useRef(false)

  const playbackDuration = getPlaybackDuration(projectDuration, tracks)
  const timelineDuration = Math.max(playbackDuration, 1)
  const pixelsPerSecond = 12 * (zoomLevel / 100)
  const timelineCanvasWidth = Math.max(1100, timelineDuration * pixelsPerSecond)
  const markCount = 10
  const marks = Array.from({ length: markCount }, (_, index) => {
    const time = (timelineDuration / (markCount - 1)) * index
    return formatSeconds(time)
  })
  const playheadLeftPercent = (clamp(currentTime, 0, timelineDuration) / timelineDuration) * 100
  const zoomProgress = Math.min(100, Math.max(0, ((zoomLevel - 50) / 350) * 100))

  const handleClipDragStart = (
    event: DragEvent<HTMLDivElement>,
    sourceTrackId: string,
    elementId: string,
    duration: number,
  ) => {
    const payload: DraggedTimelineElement = {
      elementId,
      sourceTrackId,
      duration,
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(DRAG_DATA_MIME, JSON.stringify(payload))
    event.dataTransfer.setData('text/plain', elementId)
    setDraggedElement(payload)
    selectElement(elementId, 'timeline')
  }

  const handleLaneDragOver = (event: DragEvent<HTMLDivElement>, trackId: string) => {
    const payload = readDraggedElement(event) ?? draggedElement
    if (!payload) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const nextStartTime = startTimeFromPointer(
      event.clientX,
      event.currentTarget.getBoundingClientRect(),
      timelineDuration,
      payload.duration,
    )

    setDropPreview((current) => {
      if (current && current.trackId === trackId && Math.abs(current.startTime - nextStartTime) < 0.05) {
        return current
      }
      return { trackId, startTime: nextStartTime }
    })
  }

  const handleProvisionalLaneDragOver = (event: DragEvent<HTMLDivElement>) => {
    handleLaneDragOver(event, NEW_TRACK_DROP_ID)
  }

  const handleLaneDrop = (event: DragEvent<HTMLDivElement>, targetTrackId: string) => {
    event.preventDefault()
    const payload = readDraggedElement(event) ?? draggedElement
    if (!payload) {
      return
    }

    const nextStartTime = startTimeFromPointer(
      event.clientX,
      event.currentTarget.getBoundingClientRect(),
      timelineDuration,
      payload.duration,
    )

    moveElement(payload.sourceTrackId, payload.elementId, targetTrackId, nextStartTime)
    selectElement(payload.elementId, 'timeline')
    setDraggedElement(null)
    setDropPreview(null)
  }

  const handleProvisionalLaneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const payload = readDraggedElement(event) ?? draggedElement
    if (!payload) {
      return
    }

    const nextStartTime = startTimeFromPointer(
      event.clientX,
      event.currentTarget.getBoundingClientRect(),
      timelineDuration,
      payload.duration,
    )

    const nextTrackId = buildTrackId(tracks.length + 1)
    const nextTrack = {
      id: nextTrackId,
      name: `Pista ${tracks.length + 1}`,
      elements: [],
    }

    createTrack(nextTrack)
    moveElement(payload.sourceTrackId, payload.elementId, nextTrackId, nextStartTime)
    selectElement(payload.elementId, 'timeline')
    setDraggedElement(null)
    setDropPreview(null)
  }

  const handleClipDragEnd = () => {
    setDraggedElement(null)
    setDropPreview(null)
  }

  const handleTimelineWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
    if (dominantDelta === 0) {
      return
    }

    const secondsPerPixel = timelineDuration / Math.max(timelineCanvasWidth, 1)
    const sensitivity = event.shiftKey ? 0.2 : 0.5
    const nextTime = clamp(currentTime + dominantDelta * secondsPerPixel * sensitivity, 0, timelineDuration)
    seek(nextTime)
  }

  const startScrubbing = (event: ReactMouseEvent<HTMLElement>) => {
    if (!timelineSurfaceRef.current || event.button !== 0) {
      return
    }

    event.preventDefault()
    const wasPlaying = useEditorStore.getState().isPlaying
    resumePlaybackAfterScrubRef.current = wasPlaying

    if (wasPlaying) {
      pause()
    }

    const scrubToClientX = (clientX: number) => {
      if (!timelineSurfaceRef.current) {
        return
      }

      const nextTime = startTimeFromPointer(
        clientX,
        timelineSurfaceRef.current.getBoundingClientRect(),
        timelineDuration,
        0,
      )
      seek(nextTime)
    }

    scrubToClientX(event.clientX)
    setIsScrubbing(true)

    const onMouseMove = (moveEvent: MouseEvent) => {
      scrubToClientX(moveEvent.clientX)
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setIsScrubbing(false)

      if (resumePlaybackAfterScrubRef.current) {
        play()
      }
      resumePlaybackAfterScrubRef.current = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <section className="col-span-3 row-start-2 flex min-h-0 flex-col border-t border-[#2a2a34] bg-[#1a1a20]">
      <header className="flex items-center justify-between gap-3 border-b border-[#2a2a34] px-3 py-1.5">
        <div className="flex items-center gap-0.5">
          <button
            aria-label="Agregar pista"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            aria-label="Cortar en playhead"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <Scissors className="h-4 w-4" />
          </button>
          <button
            aria-label="Eliminar selección"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-[#2a2a34]" />
          <button
            aria-label="Bloquear todo"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="Alejar timeline"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            onClick={() => setzoom(Math.max(50, zoomLevel - 10))}
            type="button"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-[3px] w-20 overflow-hidden rounded bg-[#25252e]">
            <div className="h-full rounded bg-[#6b7280]" style={{ width: `${zoomProgress}%` }} />
          </div>
          <button
            aria-label="Acercar timeline"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            onClick={() => setzoom(Math.min(400, zoomLevel + 10))}
            type="button"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="min-w-[38px] text-[11px] tabular-nums text-[#6b7280]">{zoomLevel}%</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-[180px] shrink-0 overflow-y-auto border-r border-[#2a2a34] pt-7 max-[1440px]:w-[165px] max-[1280px]:w-[150px] max-[1024px]:w-[130px]">
          {tracks.map((track, index) => {
            const kind = getTrackKind(track.elements[0]?.type)
            return (
              <div
                className="group flex h-[38px] items-center gap-2 border-b border-white/[0.03] px-2.5 max-[1024px]:h-[34px]"
                key={track.id}
              >
                <span
                  className={`inline-flex h-[18px] w-6 shrink-0 items-center justify-center rounded-[3px] text-[9px] font-bold ${badgeByKind[kind]}`}
                >
                  {`T${index + 1}`}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#9ca3af]">
                  {track.name}
                </span>
                <div className="hidden items-center gap-0.5 group-hover:flex">
                  <button
                    aria-label={`Control primario ${track.name}`}
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
                    type="button"
                  >
                    {kind === 'audio' ? (
                      <Volume2 className="h-[13px] w-[13px]" />
                    ) : (
                      <Eye className="h-[13px] w-[13px]" />
                    )}
                  </button>
                  <button
                    aria-label={`Bloquear ${track.name}`}
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
                    type="button"
                  >
                    <Lock className="h-[13px] w-[13px]" />
                  </button>
                </div>
              </div>
            )
          })}
          {draggedElement && (
            <div
              className="flex h-[38px] items-center gap-2 border-b border-[#6366f1]/40 bg-[#6366f1]/[0.06] px-2.5 max-[1024px]:h-[34px]"
              data-testid="timeline-new-track-label"
            >
              <span className="inline-flex h-[18px] w-6 shrink-0 items-center justify-center rounded-[3px] bg-[#6366f1]/20 text-[9px] font-bold text-[#a5b4fc]">
                +
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#a5b4fc]">
                Nueva pista
              </span>
            </div>
          )}
        </div>

        <div
          className="min-w-0 flex-1 overflow-x-auto overflow-y-visible"
          data-testid="timeline-scroll-area"
          onWheel={handleTimelineWheel}
        >
          <div
            className="relative"
            data-testid="timeline-surface"
            ref={timelineSurfaceRef}
            style={{ minWidth: `${timelineCanvasWidth}px`, width: `${timelineCanvasWidth}px` }}
          >
            <div
              className="sticky top-0 z-[5] h-7 border-b border-[#2a2a34] bg-[#1e1e26]"
              onMouseDown={startScrubbing}
              role="presentation"
            >
              {marks.map((mark, index) => (
                <span
                  className="absolute top-0 text-[10px] leading-7 text-[#6b7280] tabular-nums after:absolute after:bottom-0 after:left-[-4px] after:h-2 after:w-px after:bg-[#35353f]"
                  key={`${mark}-${index}`}
                  style={{ left: `${(index / (marks.length - 1)) * 100}%`, transform: 'translateX(4px)' }}
                >
                  {mark}
                </span>
              ))}
            </div>

            <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5" style={{ left: `${playheadLeftPercent}%` }}>
              <button
                aria-label="Mover playhead"
                className={`pointer-events-auto absolute left-[-5px] top-2 h-3 w-3 bg-[#ef4444] [clip-path:polygon(0_0,100%_0,50%_100%)] ${isScrubbing ? 'brightness-125' : ''}`}
                data-testid="timeline-playhead-handle"
                onMouseDown={startScrubbing}
                type="button"
              />
              <div className="absolute bottom-0 left-0 top-5 w-0.5 bg-[#ef4444]/80" />
            </div>

            <div>
              {tracks.map((track) => (
                <div
                  className="relative h-[38px] border-b border-white/[0.03] hover:bg-white/[0.01] max-[1024px]:h-[34px]"
                  key={`lane-${track.id}`}
                  onDragLeave={() =>
                    setDropPreview((current) => (current?.trackId === track.id ? null : current))
                  }
                  onDragOver={(event) => handleLaneDragOver(event, track.id)}
                  onDrop={(event) => handleLaneDrop(event, track.id)}
                >
                  {dropPreview?.trackId === track.id && (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-white/70"
                      style={{ left: `${(dropPreview.startTime / timelineDuration) * 100}%` }}
                    />
                  )}
                  {track.elements.map((element) => (
                    <div
                      className={`absolute top-[3px] flex h-[calc(100%-6px)] cursor-grab items-center overflow-hidden rounded-[4px] active:cursor-grabbing ${clipByType[element.type]} ${element.id === selectedElementId ? 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.15)]' : ''}`}
                      draggable
                      onDragEnd={handleClipDragEnd}
                      onDragStart={(event) =>
                        handleClipDragStart(event, track.id, element.id, element.duration)
                      }
                      key={element.id}
                      onClick={() => selectElement(element.id, 'timeline')}
                      style={styleFromTime(element.startTime, element.duration, timelineDuration)}
                    >
                      {element.type === 'audio' && (
                        <div className="absolute inset-x-[6px] inset-y-1 z-[1] rounded-[2px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_4px)]" />
                      )}
                      <span className="relative z-[2] truncate px-2 text-[10px] font-semibold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                        {element.name}
                      </span>
                      <div className="absolute inset-y-0 left-0 w-1.5 cursor-col-resize rounded-l-[4px] transition hover:bg-white/20" />
                      <div className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize rounded-r-[4px] transition hover:bg-white/20" />
                    </div>
                  ))}
                </div>
              ))}
              {draggedElement && (
                <div
                  className="relative h-[38px] border-b border-dashed border-[#6366f1]/50 bg-[#6366f1]/[0.05] hover:bg-[#6366f1]/[0.08] max-[1024px]:h-[34px]"
                  data-testid="timeline-new-track-lane"
                  onDragLeave={() =>
                    setDropPreview((current) => (current?.trackId === NEW_TRACK_DROP_ID ? null : current))
                  }
                  onDragOver={handleProvisionalLaneDragOver}
                  onDrop={handleProvisionalLaneDrop}
                >
                  {dropPreview?.trackId === NEW_TRACK_DROP_ID && (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-[#c7d2fe]"
                      style={{ left: `${(dropPreview.startTime / timelineDuration) * 100}%` }}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center px-3 text-[10px] font-medium uppercase tracking-[0.04em] text-[#a5b4fc]/90">
                    Soltar para crear nueva pista
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
