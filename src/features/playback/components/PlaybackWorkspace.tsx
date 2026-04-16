import { Maximize2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../../../shared/store'
import type { AudioElement, EditorElement, ImageElement, ShapeElement, TextElement, VideoElement } from '../../../shared/types/editor'
import { usePlaybackEngine } from '../hooks/usePlaybackEngine'
import { clamp, formatTimecode, getMaxTrackEnd, getPlaybackDuration, isElementActiveAtTime } from '../utils/timeline'

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

function getAudioFadeGain(element: AudioElement, currentTime: number): number {
  const clipDuration = Math.max(0, element.duration)
  const playheadInClip = clamp(currentTime - element.startTime, 0, clipDuration)
  const safeFadeIn = clamp(element.fadeIn, 0, clipDuration)
  const safeFadeOut = clamp(element.fadeOut, 0, clipDuration)

  const fadeInGain =
    safeFadeIn > 0 ? clamp(playheadInClip / safeFadeIn, 0, 1) : 1
  const remainingTime = Math.max(0, clipDuration - playheadInClip)
  const fadeOutGain =
    safeFadeOut > 0 ? clamp(remainingTime / safeFadeOut, 0, 1) : 1

  return clamp(Math.min(fadeInGain, fadeOutGain), 0, 1)
}

function getVideoTrimBounds(element: VideoElement): { trimStart: number; trimEnd: number; playableDuration: number } {
  const trimStart = Math.max(0, element.trimStart)
  const trimEnd = Math.max(trimStart, element.trimEnd)
  const playableDuration = Math.max(0.001, trimEnd - trimStart)

  return { trimStart, trimEnd, playableDuration }
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
  const masterVolume = useEditorStore((state) => state.masterVolume)
  const setMasterVolume = useEditorStore((state) => state.setMasterVolume)
  const play = useEditorStore((state) => state.play)
  const pause = useEditorStore((state) => state.pause)
  const seek = useEditorStore((state) => state.seek)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const lastNonZeroVolumeRef = useRef(1)

  const playbackDuration = useMemo(() => getPlaybackDuration(projectDuration, tracks), [projectDuration, tracks])
  const timelineEndTime = useMemo(() => getMaxTrackEnd(tracks), [tracks])

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

        if (element.type === 'video') {
          const clipLocalTime = Math.max(0, currentTime - element.startTime)
          const { playableDuration } = getVideoTrimBounds(element)
          if (clipLocalTime >= playableDuration) {
            return
          }
        }

        if (isElementActiveAtTime(element, currentTime)) {
          visible.push({ trackId: track.id, trackIndex, element })
        }
      })
    })

    return visible
  }, [currentTime, tracks])

  const activeAudioElements = useMemo<AudioElement[]>(() => {
    return tracks
      .flatMap((track) => track.elements)
      .filter((element): element is AudioElement => element.type === 'audio' && isElementActiveAtTime(element, currentTime))
  }, [currentTime, tracks])

  const activeVideoElements = useMemo<VideoElement[]>(() => {
    return tracks
      .flatMap((track) => track.elements)
      .filter((element): element is VideoElement => {
        if (element.type !== 'video') {
          return false
        }

        const clipLocalTime = Math.max(0, currentTime - element.startTime)
        const { playableDuration } = getVideoTrimBounds(element)
        return clipLocalTime < playableDuration
      })
  }, [currentTime, tracks])

  useEffect(() => {
    if (masterVolume > 0) {
      lastNonZeroVolumeRef.current = masterVolume
    }
  }, [masterVolume])

  useEffect(() => {
    // Ensure we pause and cleanup audios that are no longer active.
    const activeIds = new Set(activeAudioElements.map((a) => a.id))

    for (const [id, audio] of audioRefs.current.entries()) {
      if (!activeIds.has(id)) {
        audio.pause()
        audioRefs.current.delete(id)
      }
    }

    for (const element of activeAudioElements) {
      let audio = audioRefs.current.get(element.id)
      if (!audio) {
        audio = new Audio(element.source)
        audio.preload = 'auto'
        audioRefs.current.set(element.id, audio)
      }

      audio.playbackRate = element.playbackRate
      audio.muted = element.muted || masterVolume <= 0
      const fadeGain = getAudioFadeGain(element, currentTime)
      audio.volume = clamp(element.volume * masterVolume * fadeGain, 0, 1)

      const targetTime = Math.max(0, currentTime - element.startTime)
      if (Number.isFinite(targetTime) && Math.abs(audio.currentTime - targetTime) > 0.15) {
        try {
          audio.currentTime = targetTime
        } catch {
          // ignore seek failures
        }
      }

      if (isPlaying) {
        audio.play().catch(() => {
          // autoplay restrictions may block until user gesture
        })
      } else {
        audio.pause()
      }
    }
  }, [activeAudioElements, currentTime, isPlaying, masterVolume])

  useEffect(() => {
    const activeIds = new Set(activeVideoElements.map((video) => video.id))

    for (const [id, video] of videoRefs.current.entries()) {
      if (!activeIds.has(id)) {
        video.pause()
      }
    }

    for (const element of activeVideoElements) {
      const video = videoRefs.current.get(element.id)
      if (!video) {
        continue
      }

      const { trimStart, trimEnd } = getVideoTrimBounds(element)

      video.playbackRate = element.playbackRate
      video.muted = element.muted || masterVolume <= 0
      video.volume = clamp(element.volume * masterVolume, 0, 1)

      const clipLocalTime = Math.max(0, currentTime - element.startTime)
      const unclampedTime = trimStart + clipLocalTime
      const targetTime = clamp(unclampedTime, trimStart, trimEnd)
      if (Number.isFinite(targetTime) && Math.abs(video.currentTime - targetTime) > 0.15) {
        try {
          video.currentTime = targetTime
        } catch {
          // ignore seek failures
        }
      }

      if (isPlaying) {
        video.play().catch(() => {
          // autoplay restrictions may block until user gesture
        })
      } else {
        video.pause()
      }
    }
  }, [activeVideoElements, currentTime, isPlaying, masterVolume])

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
    seek(0)
  }

  const handleSkipForward = () => {
    seek(timelineEndTime)
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handleMasterVolumeChange = (nextPercent: number) => {
    const safePercent = clamp(nextPercent, 0, 100)
    setMasterVolume(safePercent / 100)
  }

  const toggleMasterMute = () => {
    if (masterVolume <= 0) {
      setMasterVolume(lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1)
      return
    }

    setMasterVolume(0)
  }

  const masterVolumePercent = Math.round(clamp(masterVolume * 100, 0, 100))

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
              const style = buildElementStyle(
                context.element,
                resolution,
                previewScale,
                tracks.length - context.trackIndex,
              )

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
                const imageStyle: CSSProperties = {
                  ...style,
                  overflow: 'visible',
                  outline: `${Math.max(0, context.element.borderWidth)}px solid ${context.element.borderColor}`,
                  outlineOffset: '0px',
                }

                return (
                  <div
                    className={`select-none overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-move'} ${isSelected ? 'ring-1 ring-white/60' : ''}`}
                    data-testid="playback-image-overlay"
                    key={context.element.id}
                    onMouseDown={(event) => handleVisualMouseDown(event, context)}
                    style={imageStyle}
                  >
                    <img
                      alt={context.element.name}
                      className="h-full w-full"
                      draggable={false}
                      src={context.element.source}
                      style={{
                        objectFit: context.element.fit,
                        borderRadius: 'inherit',
                      }}
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
                    <video
                      className="pointer-events-none h-full w-full object-cover"
                      playsInline
                      preload="auto"
                      ref={(node) => {
                        if (node) {
                          videoRefs.current.set(context.element.id, node)
                        } else {
                          videoRefs.current.delete(context.element.id)
                        }
                      }}
                      src={context.element.source}
                    />
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
            aria-label={masterVolume > 0 ? 'Silenciar' : 'Activar sonido'}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#9ca3af] transition hover:bg-[#25252e] hover:text-[#f0f0f4]"
            onClick={toggleMasterMute}
            type="button"
          >
            <Volume2 className="h-[15px] w-[15px]" />
          </button>
          <div className="relative h-1 w-[70px] overflow-hidden rounded bg-[#25252e] max-[1024px]:hidden">
            <div
              className="h-full rounded bg-[#9ca3af] transition hover:bg-[#6366f1]"
              style={{ width: `${masterVolumePercent}%` }}
            />
            <input
              aria-label="Volumen master"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              data-testid="playback-master-volume"
              max={100}
              min={0}
              onChange={(event) => handleMasterVolumeChange(Number(event.target.value))}
              step={1}
              type="range"
              value={masterVolumePercent}
            />
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
