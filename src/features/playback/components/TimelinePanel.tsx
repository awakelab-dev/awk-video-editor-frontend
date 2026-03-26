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
import type { CSSProperties } from 'react'
import { useEditorStore } from '../../../shared/store'

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

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function styleFromTime(startTime: number, duration: number, timelineDuration: number): CSSProperties {
  const safeDuration = Math.max(timelineDuration, 1)
  const left = (Math.max(startTime, 0) / safeDuration) * 100
  const width = (Math.max(duration, 0.1) / safeDuration) * 100

  return {
    left: `${left}%`,
    width: `${Math.max(width, 1.5)}%`,
  }
}

export function TimelinePanel() {
  const tracks = useEditorStore((state) => state.tracks)
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const selectElement = useEditorStore((state) => state.selectElement)
  const currentTime = useEditorStore((state) => state.currentTime)
  const projectDuration = useEditorStore((state) => state.duration)
  const zoomLevel = useEditorStore((state) => state.zoomLevel)
  const setzoom = useEditorStore((state) => state.setzoom)

  const maxTrackEnd =
    tracks.flatMap((track) => track.elements).reduce((max, element) => {
      return Math.max(max, element.startTime + element.duration)
    }, 0) || 0
  const timelineDuration = Math.max(projectDuration, maxTrackEnd, 120)
  const markCount = 10
  const marks = Array.from({ length: markCount }, (_, index) => {
    const time = (timelineDuration / (markCount - 1)) * index
    return formatSeconds(time)
  })
  const playheadLeftPercent = Math.min(100, (Math.max(0, currentTime) / timelineDuration) * 100)
  const zoomProgress = Math.min(100, Math.max(0, ((zoomLevel - 50) / 350) * 100))

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
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-visible">
          <div className="relative min-w-[1100px]">
            <div className="sticky top-0 z-[5] h-7 border-b border-[#2a2a34] bg-[#1e1e26]">
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
              <div className="absolute left-[-5px] top-2 h-3 w-3 bg-[#ef4444] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
              <div className="absolute bottom-0 left-0 top-5 w-0.5 bg-[#ef4444]/80" />
            </div>

            <div>
              {tracks.map((track) => (
                <div
                  className="relative h-[38px] border-b border-white/[0.03] hover:bg-white/[0.01] max-[1024px]:h-[34px]"
                  key={`lane-${track.id}`}
                >
                  {track.elements.map((element) => (
                    <div
                      className={`absolute top-[3px] flex h-[calc(100%-6px)] items-center overflow-hidden rounded-[4px] ${clipByType[element.type]} ${element.id === selectedElementId ? 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.15)]' : ''}`}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
