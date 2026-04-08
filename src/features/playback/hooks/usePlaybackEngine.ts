import { useEffect, useMemo, useRef } from 'react'
import { useEditorStore } from '../../../shared/store'
import { PlaybackEngine } from '../engine/playbackEngine'

export function usePlaybackEngine() {
  const tracks = useEditorStore((state) => state.tracks)
  const projectDuration = useEditorStore((state) => state.duration)
  const currentTime = useEditorStore((state) => state.currentTime)
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const temporalSignature = useMemo(
    () =>
      tracks
        .map((track) =>
          `${track.id}:${track.elements
            .map((element) => `${element.id}@${element.startTime}-${element.duration}`)
            .join('|')}`,
        )
        .join('||'),
    [tracks],
  )

  const engineRef = useRef<PlaybackEngine | null>(null)
  const syncingToEngineRef = useRef(false)
  const lastEngineTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const engine = new PlaybackEngine({
      onUpdate: (time) => {
        if (syncingToEngineRef.current) {
          return
        }

        lastEngineTimeRef.current = time
        useEditorStore.getState().seek(time)
      },
      onComplete: () => {
        const state = useEditorStore.getState()
        const duration = engineRef.current?.getDuration() ?? state.currentTime
        state.seek(duration)
        state.pause()
      },
    })

    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) {
      return
    }

    const state = useEditorStore.getState()
    engine.buildFromTracks(state.tracks, projectDuration)
    syncingToEngineRef.current = true
    engine.seek(state.currentTime)
    syncingToEngineRef.current = false

    if (state.isPlaying) {
      engine.play()
    } else {
      engine.pause()
    }
  }, [projectDuration, temporalSignature])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) {
      return
    }

    if (lastEngineTimeRef.current !== null && Math.abs(lastEngineTimeRef.current - currentTime) < 0.0001) {
      return
    }

    syncingToEngineRef.current = true
    engine.seek(currentTime)
    syncingToEngineRef.current = false
  }, [currentTime])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) {
      return
    }

    if (isPlaying) {
      engine.play()
    } else {
      engine.pause()
    }
  }, [isPlaying])
}
