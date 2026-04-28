import { useCallback } from 'react'
import { createElement, isElementsApiEnabled } from '../../../shared/api/textElementsApi'
import { useEditorStore } from '../../../shared/store'
import type { AudioElement, Track } from '../../../shared/types/editor'

const AUDIO_TRACK_ID = 'track-audio'
const AUDIO_TRACK_NAME = 'Audio'

type AddAudioOptions = {
  assetId: string
  label?: string
  duration?: number
}

function createAudioTrack(): Track {
  return {
    id: AUDIO_TRACK_ID,
    name: AUDIO_TRACK_NAME,
    elements: [],
  }
}

function buildAudioElement(
  sequence: number,
  asset: { id: string; fileName: string; source: string; duration?: number },
  options: AddAudioOptions,
  startTime: number,
): AudioElement {
  const baseLabel = options.label ?? asset.fileName
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `audio-${Date.now()}-${sequence}`

  return {
    id,
    type: 'audio',
    name,
    startTime,
    // Use known duration if present; otherwise a placeholder that will be replaced after metadata loads.
    duration: options.duration ?? asset.duration ?? 5,
    opacity: 1,
    effects: [],
    source: asset.source,
    playbackRate: 1,
    volume: 1,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
  }
}

export function useAddAudioElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const projectId = useEditorStore((state) => state.projectId)
  const assets = useEditorStore((state) => state.assets)
  const currentTime = useEditorStore((state) => state.currentTime)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)
  const updateElementProperty = useEditorStore((state) => state.updateElementProperty)

  return useCallback(
    (options: AddAudioOptions) => {
      const asset = assets.find((a) => a.id === options.assetId)
      if (!asset) {
        console.warn('[ElementLibrary][audio] asset not found', options)
        return null
      }

      let audioTrack = tracks.find((track) => track.id === AUDIO_TRACK_ID)
      if (!audioTrack) {
        audioTrack = createAudioTrack()
        createTrack(audioTrack)
      }

      const sequence = audioTrack.elements.filter((element) => element.type === 'audio').length
      const element = buildAudioElement(sequence, asset, options, currentTime)
      if (isElementsApiEnabled()) {
        void createElement(projectId, {
          id: element.id,
          type: 'audio',
          name: element.name,
          startTime: element.startTime,
          duration: element.duration,
          opacity: element.opacity,
          source: element.source,
          playbackRate: element.playbackRate,
          volume: element.volume,
          muted: element.muted,
          fadeIn: element.fadeIn,
          fadeOut: element.fadeOut,
          trackId: audioTrack.id,
        }).catch((error) => {
          console.error('[ElementLibrary][audio] create api failed', error)
        })
      }
      addElement(audioTrack.id, element)
      selectElement(element.id, 'element-library')
      console.log('[ElementLibrary][audio] created', { trackId: audioTrack.id, element, assetId: asset.id })

      // If duration is not provided, load audio metadata and update the element duration.
      if (!options.duration && !asset.duration) {
        try {
          const audio = new Audio(asset.source)
          audio.preload = 'metadata'
          audio.onloadedmetadata = () => {
            const duration = audio.duration
            if (Number.isFinite(duration) && duration > 0) {
              updateElementProperty(audioTrack.id, element.id, 'duration', duration)
              console.log('[ElementLibrary][audio] duration resolved', { elementId: element.id, duration })
            }
            audio.src = ''
          }
          audio.onerror = () => {
            audio.src = ''
          }
        } catch {
          // ignore metadata failures
        }
      }

      return element
    },
    [assets, tracks, projectId, currentTime, createTrack, addElement, selectElement, updateElementProperty],
  )
}

