import { Maximize2, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'

export function PlaybackWorkspace() {
  return (
    <section className="row-start-1 flex min-h-0 flex-col overflow-hidden bg-[#0d0d11]">
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <figure className="flex h-full w-full items-center justify-center">
          <div className="relative flex aspect-video w-full max-w-[800px] items-center justify-center overflow-hidden rounded-[8px] bg-black shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-center gap-3 text-[#6b7280]">
              <Play className="h-12 w-12 opacity-30" />
              <p className="text-[13px]">Vista previa del video</p>
            </div>
          </div>
        </figure>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-2 max-[1024px]:px-3.5 max-[1024px]:pb-2.5 max-[1024px]:pt-1.5">
        <div className="flex items-center gap-1">
          <button
            aria-label="Retroceder"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <SkipBack className="h-[15px] w-[15px]" />
          </button>
          <button
            aria-label="Reproducir"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366f1] text-white transition hover:bg-[#818cf8]"
            type="button"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            aria-label="Avanzar"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            type="button"
          >
            <SkipForward className="h-[15px] w-[15px]" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[13px] font-medium tabular-nums">
          <span className="text-[#f0f0f4]">00:00:15:04</span>
          <span className="mx-0.5 text-[#6b7280]">/</span>
          <span className="text-[#6b7280]">00:02:30:00</span>
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
