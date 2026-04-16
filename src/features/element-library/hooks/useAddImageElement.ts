import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import { MEDIA_TRACK_ID, MEDIA_TRACK_NAME } from '../../../shared/store/defaultTracks'
import type { ImageElement, Track } from '../../../shared/types/editor'

type AddImageOptions = {
  assetId: string
  label?: string
  duration?: number
  dropPosition?: { x: number; y: number }
  startTime?: number
}

function createMediaTrack(): Track {
  return {
    id: MEDIA_TRACK_ID,
    name: MEDIA_TRACK_NAME,
    kind: 'media',
    elements: [],
  }
}

function buildImageElement(
  sequence: number,
  asset: { id: string; fileName: string; source: string; width?: number; height?: number },
  options: AddImageOptions,
  resolution: { w: number; h: number },
  startTime: number,
): ImageElement {
  const baseLabel = options.label ?? asset.fileName
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `image-${Date.now()}-${sequence}`

  const maxWidth = Math.round(resolution.w * 0.7)
  const maxHeight = Math.round(resolution.h * 0.7)
  const intrinsicWidth = asset.width ?? maxWidth
  const intrinsicHeight = asset.height ?? maxHeight
  const scale = Math.min(maxWidth / Math.max(intrinsicWidth, 1), maxHeight / Math.max(intrinsicHeight, 1), 1)
  const width = Math.max(120, Math.round(intrinsicWidth * scale))
  const height = Math.max(120, Math.round(intrinsicHeight * scale))
  let x = Math.round((resolution.w - width) / 2)
  let y = Math.round((resolution.h - height) / 2)

  if (options.dropPosition) {
    x = Math.round(options.dropPosition.x - width / 2)
    y = Math.round(options.dropPosition.y - height / 2)
  }

  return {
    id,
    type: 'image',
    name,
    startTime,
    duration: options.duration ?? 5,
    opacity: 1,
    x,
    y,
    width,
    height,
    rotation: 0,
    source: asset.source,
    fit: 'contain',
  }
}

export function useAddImageElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const assets = useEditorStore((state) => state.assets)
  const currentTime = useEditorStore((state) => state.currentTime)
  const resolution = useEditorStore((state) => state.resolution)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)
  const updateElementProperty = useEditorStore((state) => state.updateElementProperty)

  return useCallback(
    (options: AddImageOptions) => {
      const asset = assets.find((a) => a.id === options.assetId)
      if (!asset) {
        console.warn('[ElementLibrary][image] asset not found', options)
        return null
      }

      let mediaTrack = tracks.find((track) => track.id === MEDIA_TRACK_ID)
      if (!mediaTrack) {
        mediaTrack = createMediaTrack()
        createTrack(mediaTrack)
      }

      const sequence = mediaTrack.elements.filter((element) => element.type === 'image').length
      const element = buildImageElement(sequence, asset, options, resolution, options.startTime ?? currentTime)
      addElement(mediaTrack.id, element)
      selectElement(element.id, 'element-library')
      console.log('[ElementLibrary][image] created', { trackId: mediaTrack.id, element, assetId: asset.id })

      if (!asset.width || !asset.height) {
        try {
          const image = new window.Image()
          image.onload = () => {
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
              const maxWidth = Math.round(resolution.w * 0.7)
              const maxHeight = Math.round(resolution.h * 0.7)
              const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
              const width = Math.max(120, Math.round(image.naturalWidth * scale))
              const height = Math.max(120, Math.round(image.naturalHeight * scale))
              updateElementProperty(mediaTrack.id, element.id, 'width', width)
              updateElementProperty(mediaTrack.id, element.id, 'height', height)
              if (!options.dropPosition) {
                updateElementProperty(mediaTrack.id, element.id, 'x', Math.round((resolution.w - width) / 2))
                updateElementProperty(mediaTrack.id, element.id, 'y', Math.round((resolution.h - height) / 2))
              }
            }
            image.src = ''
          }
          image.onerror = () => {
            image.src = ''
          }
          image.src = asset.source
        } catch {
          // ignore metadata failures
        }
      }

      return element
    },
    [assets, tracks, currentTime, resolution, createTrack, addElement, selectElement, updateElementProperty],
  )
}
