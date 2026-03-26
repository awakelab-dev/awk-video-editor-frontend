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

type TrackKind = 'video' | 'text' | 'audio'
type ClipType = 'video' | 'overlay' | 'text' | 'audio' | 'effect'

type TrackHeader = {
  id: string
  name: string
  kind: TrackKind
}

type TimelineClip = {
  id: string
  name: string
  left: number
  width: number
  type: ClipType
  selected?: boolean
  withWave?: boolean
}

const trackHeaders: TrackHeader[] = [
  { id: 'V1', name: 'Video 1', kind: 'video' },
  { id: 'V2', name: 'Video 2', kind: 'video' },
  { id: 'T1', name: 'Texto', kind: 'text' },
  { id: 'A1', name: 'Audio 1', kind: 'audio' },
  { id: 'A2', name: 'Audio 2', kind: 'audio' },
]

const marks = ['00:00', '00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45', '02:00', '02:15']

const clipsByTrack: TimelineClip[][] = [
  [
    { id: 'v1a', name: 'intro_final.mp4', left: 0, width: 28, type: 'video', selected: true },
    { id: 'v1b', name: 'escena_01.mp4', left: 30, width: 35, type: 'video' },
    { id: 'v1c', name: 'cierre.mp4', left: 67, width: 25, type: 'video' },
  ],
  [{ id: 'v2a', name: 'overlay.png', left: 15, width: 20, type: 'overlay' }],
  [
    { id: 't1a', name: 'Título Principal', left: 5, width: 18, type: 'text' },
    { id: 't1b', name: 'Créditos', left: 68, width: 15, type: 'text' },
  ],
  [{ id: 'a1a', name: 'musica_fondo.mp3', left: 0, width: 92, type: 'audio', withWave: true }],
  [
    { id: 'a2a', name: 'sfx_transicion.wav', left: 30, width: 15, type: 'effect' },
    { id: 'a2b', name: 'sfx_cierre.wav', left: 65, width: 12, type: 'effect' },
  ],
]

const badgeByKind: Record<TrackKind, string> = {
  video: 'bg-[#6366f1]/[0.12] text-[#6366f1]',
  text: 'bg-[#f59e0b]/[0.15] text-[#f59e0b]',
  audio: 'bg-[#22c55e]/[0.15] text-[#22c55e]',
}

const clipByType: Record<ClipType, string> = {
  video: 'bg-gradient-to-b from-[#818cf8] to-[#6366f1]',
  overlay: 'bg-gradient-to-b from-[#a78bfa] to-[#8b5cf6]',
  text: 'bg-gradient-to-b from-[#fbbf24] to-[#f59e0b]',
  audio: 'bg-gradient-to-b from-[#4ade80] to-[#22c55e]',
  effect: 'bg-gradient-to-b from-[#2dd4bf] to-[#14b8a6]',
}

function styleFromPosition(left: number, width: number): CSSProperties {
  return {
    left: `${left}%`,
    width: `${width}%`,
  }
}

export function TimelinePanel() {
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
            type="button"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-[3px] w-20 overflow-hidden rounded bg-[#25252e]">
            <div className="h-full w-1/2 rounded bg-[#6b7280]" />
          </div>
          <button
            aria-label="Acercar timeline"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#6b7280] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="min-w-[30px] text-[11px] tabular-nums text-[#6b7280]">100%</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <div className="w-[180px] shrink-0 border-r border-[#2a2a34] pt-7 max-[1440px]:w-[165px] max-[1280px]:w-[150px] max-[1024px]:w-[130px]">
          {trackHeaders.map((track) => (
            <div
              className="group flex h-[38px] items-center gap-2 border-b border-white/[0.03] px-2.5 max-[1024px]:h-[34px]"
              key={track.id}
            >
              <span
                className={`inline-flex h-[18px] w-6 shrink-0 items-center justify-center rounded-[3px] text-[9px] font-bold ${badgeByKind[track.kind]}`}
              >
                {track.id}
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
                  {track.kind === 'audio' ? (
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
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-visible">
          <div className="relative min-w-[1100px]">
            <div className="sticky top-0 z-[5] h-7 border-b border-[#2a2a34] bg-[#1e1e26]">
              {marks.map((mark, index) => (
                <span
                  className="absolute top-0 text-[10px] leading-7 text-[#6b7280] tabular-nums after:absolute after:bottom-0 after:left-[-4px] after:h-2 after:w-px after:bg-[#35353f]"
                  key={mark}
                  style={{ left: `${index * 10}%`, transform: 'translateX(4px)' }}
                >
                  {mark}
                </span>
              ))}
            </div>

            <div className="pointer-events-none absolute bottom-0 left-[10%] top-0 z-10 w-0.5">
              <div className="absolute left-[-5px] top-2 h-3 w-3 bg-[#ef4444] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
              <div className="absolute bottom-0 left-0 top-5 w-0.5 bg-[#ef4444]/80" />
            </div>

            <div>
              {clipsByTrack.map((clips, trackIndex) => (
                <div
                  className="relative h-[38px] border-b border-white/[0.03] hover:bg-white/[0.01] max-[1024px]:h-[34px]"
                  key={`track-${trackIndex}`}
                >
                  {clips.map((clip) => (
                    <div
                      className={`absolute top-[3px] flex h-[calc(100%-6px)] items-center overflow-hidden rounded-[4px] ${clipByType[clip.type]} ${clip.selected ? 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.15)]' : ''}`}
                      key={clip.id}
                      style={styleFromPosition(clip.left, clip.width)}
                    >
                      {clip.withWave && (
                        <div className="absolute inset-x-[6px] inset-y-1 z-[1] rounded-[2px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_4px)]" />
                      )}
                      <span className="relative z-[2] truncate px-2 text-[10px] font-semibold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                        {clip.name}
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
