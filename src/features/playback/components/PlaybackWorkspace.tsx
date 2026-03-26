import { Maximize2, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../../shared/store'
import type { TextElement } from '../../../shared/types/editor'

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function isTextElementActiveAtTime(element: TextElement, currentTime: number): boolean {
  return currentTime >= element.startTime && currentTime < element.startTime + element.duration
}

function buildTextElementStyle(
  element: TextElement,
  resolution: { w: number; h: number },
  previewScale: number,
): CSSProperties {
  const safeW = Math.max(resolution.w, 1)
  const safeH = Math.max(resolution.h, 1)

  return {
    position: 'absolute',
    left: `${clampPercent((element.x / safeW) * 100)}%`,
    top: `${clampPercent((element.y / safeH) * 100)}%`,
    width: `${clampPercent((element.width / safeW) * 100)}%`,
    height: `${clampPercent((element.height / safeH) * 100)}%`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: 2,
    opacity: element.opacity,
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
    pointerEvents: 'none',
  }
}

export function PlaybackWorkspace() {
  const tracks = useEditorStore((state) => state.tracks)
  const currentTime = useEditorStore((state) => state.currentTime)
  const resolution = useEditorStore((state) => state.resolution)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [previewScale, setPreviewScale] = useState(1)

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

  const activeTextElement =
    tracks
      .flatMap((track) => track.elements)
      .find(
        (element): element is TextElement =>
          element.type === 'text' && isTextElementActiveAtTime(element, currentTime),
      ) ?? null
  const hasRenderedContent = activeTextElement !== null

  return (
    <section className="row-start-1 flex min-h-0 flex-col overflow-hidden bg-[#0d0d11]">
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <figure className="flex h-full w-full items-center justify-center">
          <div
            className="relative flex aspect-video w-full max-w-[800px] items-center justify-center overflow-hidden rounded-[8px] bg-black shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
            ref={previewRef}
          >
            {activeTextElement && (
              <div style={buildTextElementStyle(activeTextElement, resolution, previewScale)}>
                {activeTextElement.text}
              </div>
            )}
            {!hasRenderedContent && (
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
