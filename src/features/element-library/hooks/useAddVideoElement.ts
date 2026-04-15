import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import type { VideoElement, Track } from '../../../shared/types/editor'

const VIDEO_TRACK_ID = 'track-video'
const VIDEO_TRACK_NAME = 'Vídeo'

type AddVideoOptions = {
  assetId: string
  label?: string
  duration?: number
  width?: number
  height?: number
}

function createVideoTrack(): Track {
  return {
    id: VIDEO_TRACK_ID,
    name: VIDEO_TRACK_NAME,
    kind: 'media',
    elements: [],
  }
}

function buildVideoElement(
  sequence: number,
  asset: { id: string; fileName: string; source: string; duration?: number; width?: number; height?: number },
  options: AddVideoOptions,
  resolution: { w: number; h: number },
): VideoElement {
  const baseLabel = options.label ?? asset.fileName
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `video-${Date.now()}-${sequence}`

  // Default to full canvas size
  const width = asset.width ?? resolution.w
  const height = asset.height ?? resolution.h
  const x = (resolution.w - width) / 2
  const y = (resolution.h - height) / 2

  return {
    id,
    type: 'video',
    name,
    startTime: 0, // Will be set by caller
    // Use known duration if present; otherwise a placeholder that will be replaced after metadata loads.
    duration: options.duration ?? asset.duration ?? 5,
    opacity: 1,
    x,
    y,
    width,
    height,
    rotation: 0,
    source: asset.source,
    trimStart: 0,
    trimEnd: options.duration ?? asset.duration ?? 5,
    playbackRate: 1,
    volume: 1,
    muted: false,
  }
}

export function useAddVideoElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const assets = useEditorStore((state) => state.assets)
  const currentTime = useEditorStore((state) => state.currentTime)
  const resolution = useEditorStore((state) => state.resolution)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)
  const updateElementProperty = useEditorStore((state) => state.updateElementProperty)

  return useCallback(
    (options: AddVideoOptions & { startTime?: number }) => {
      const asset = assets.find((a) => a.id === options.assetId)
      if (!asset) {
        console.warn('[ElementLibrary][video] asset not found', options)
        return null
      }

      let videoTrack = tracks.find((track) => track.id === VIDEO_TRACK_ID)
      if (!videoTrack) {
        videoTrack = createVideoTrack()
        createTrack(videoTrack)
      }

      const sequence = videoTrack.elements.filter((element) => element.type === 'video').length
      const element = buildVideoElement(sequence, asset, options, resolution)
      // Override startTime if provided
      if (options.startTime !== undefined) {
        element.startTime = options.startTime
      } else {
        element.startTime = currentTime
      }
      addElement(videoTrack.id, element)
      selectElement(element.id, 'element-library')
      console.log('[ElementLibrary][video] created', { trackId: videoTrack.id, element, assetId: asset.id })

      // If duration is not provided, load video metadata and update the element duration.
      if (!options.duration && !asset.duration) {
        try {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.src = asset.source
          video.onloadedmetadata = () => {
            const duration = video.duration
            if (Number.isFinite(duration) && duration > 0) {
              updateElementProperty(videoTrack.id, element.id, 'duration', duration)
              updateElementProperty(videoTrack.id, element.id, 'trimEnd', duration)
              console.log('[ElementLibrary][video] duration resolved', { elementId: element.id, duration })
            }
            video.src = ''
          }
          video.onerror = () => {
            video.src = ''
          }
        } catch {
          // ignore metadata failures
        }
      }

      return element
    },
    [assets, tracks, currentTime, resolution, createTrack, addElement, selectElement, updateElementProperty],
  )
}
