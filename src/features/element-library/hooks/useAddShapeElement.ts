import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import { MEDIA_TRACK_ID, MEDIA_TRACK_NAME } from '../../../shared/store/defaultTracks'
import type { ShapeElement, Track } from '../../../shared/types/editor'
import type { ShapePreset } from '../types'

const SHAPE_PRESET_CONFIG: Record<
  ShapePreset,
  {
    label: string
    shapeType: ShapeElement['shapeType']
    fillColor: string
    strokeColor: string
    strokeWidth: number
    cornerRadius: number
    width: number
    height: number
    x: number
    y: number
  }
> = {
  rectangle: {
    label: 'Rectángulo',
    shapeType: 'rectangle',
    fillColor: '#4f46e5',
    strokeColor: '#1e1b4b',
    strokeWidth: 0,
    cornerRadius: 12,
    width: 320,
    height: 180,
    x: 320,
    y: 220,
  },
  ellipse: {
    label: 'Círculo',
    shapeType: 'ellipse',
    fillColor: '#22c55e',
    strokeColor: '#14532d',
    strokeWidth: 0,
    cornerRadius: 0,
    width: 220,
    height: 220,
    x: 380,
    y: 200,
  },
  background: {
    label: 'Fondo gradiente',
    shapeType: 'rectangle',
    fillColor: '#111827',
    strokeColor: '#111827',
    strokeWidth: 0,
    cornerRadius: 24,
    width: 1000,
    height: 240,
    x: 140,
    y: 320,
  },
}

type AddShapeOptions = {
  preset?: ShapePreset
  label?: string
}

function buildShapeElement(
  sequence: number,
  { preset = 'rectangle', label }: AddShapeOptions,
  startTime: number,
): ShapeElement {
  const config = SHAPE_PRESET_CONFIG[preset]
  const baseLabel = label ?? config.label
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `shape-${Date.now()}-${sequence}`

  return {
    id,
    type: 'shape',
    name,
    startTime,
    duration: 5,
    opacity: 1,
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    rotation: 0,
    shapeType: config.shapeType,
    fillColor: config.fillColor,
    strokeColor: config.strokeColor,
    strokeWidth: config.strokeWidth,
    cornerRadius: config.cornerRadius,
  }
}

function createMediaTrack(): Track {
  return {
    id: MEDIA_TRACK_ID,
    name: MEDIA_TRACK_NAME,
    kind: 'media',
    elements: [],
  }
}

export function useAddShapeElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)
  const currentTime = useEditorStore((state) => state.currentTime)

  return useCallback(
    (options: AddShapeOptions = {}) => {
      let mediaTrack = tracks.find((track) => track.id === MEDIA_TRACK_ID)
      if (!mediaTrack) {
        mediaTrack = createMediaTrack()
        createTrack(mediaTrack)
      }

      const sequence = mediaTrack.elements.filter((element) => element.type === 'shape').length
      const element = buildShapeElement(sequence, options, currentTime)
      addElement(mediaTrack.id, element)
      selectElement(element.id, 'element-library')
      return element
    },
    [tracks, createTrack, addElement, selectElement, currentTime],
  )
}
