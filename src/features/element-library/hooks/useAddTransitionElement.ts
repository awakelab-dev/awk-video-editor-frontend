import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import { MEDIA_TRACK_ID, MEDIA_TRACK_NAME } from '../../../shared/store/defaultTracks'
import type { TransitionElement, Track } from '../../../shared/types/editor'
import type { TransitionPreset } from '../types'

type AddTransitionOptions = {
  preset: TransitionPreset
  label?: string
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

function buildTransitionElement(
  sequence: number,
  preset: TransitionPreset,
  options: AddTransitionOptions,
  currentTime: number,
): TransitionElement {
  const baseLabel = options.label ?? preset
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `transition-${Date.now()}-${sequence}`

  return {
    id,
    type: 'transition',
    name,
    startTime: options.startTime ?? currentTime,
    duration: 0.5,
    opacity: 1,
    effects: [],
    transitionType: preset,
  }
}

export function useAddTransitionElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const currentTime = useEditorStore((state) => state.currentTime)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)

  return useCallback(
    (options: AddTransitionOptions) => {
      let mediaTrack = tracks.find((track) => track.id === MEDIA_TRACK_ID)
      if (!mediaTrack) {
        mediaTrack = createMediaTrack()
        createTrack(mediaTrack)
      }

      const sequence = mediaTrack.elements.filter((element) => element.type === 'transition').length
      const element = buildTransitionElement(sequence, options.preset, options, currentTime)
      addElement(mediaTrack.id, element)
      selectElement(element.id, 'element-library')
      console.log('[ElementLibrary][transition] created', { trackId: mediaTrack.id, element })

      return element
    },
    [tracks, currentTime, createTrack, addElement, selectElement],
  )
}
