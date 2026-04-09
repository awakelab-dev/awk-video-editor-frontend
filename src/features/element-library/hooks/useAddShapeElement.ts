import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import type { ShapeElement, Track } from '../../../shared/types/editor'
import type { ShapePreset } from '../types'

const SHAPE_TRACK_ID = 'track-shape'
const SHAPE_TRACK_NAME = 'Formas'

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
    // For renderers that only support borderRadius (not true ellipse drawing)
    cornerRadius: 9999,
    width: 220,
    height: 220,
    x: 380,
    y: 200,
  },
  background: {
    label: 'Cuadrado',
    shapeType: 'rectangle',
    fillColor: '#111827',
    strokeColor: '#111827',
    strokeWidth: 0,
    cornerRadius: 12,
    width: 260,
    height: 260,
    x: 360,
    y: 160,
  },
}

type AddShapeOptions = {
  preset?: ShapePreset
  label?: string
  dropPosition?: { x: number; y: number }
}

function buildShapeElement(
  sequence: number,
  { preset = 'rectangle', label, dropPosition }: AddShapeOptions,
  startTime: number,
): ShapeElement {
  const config = SHAPE_PRESET_CONFIG[preset]
  const baseLabel = label ?? config.label
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `shape-${Date.now()}-${sequence}`

  const element: ShapeElement = {
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

  if (dropPosition) {
    element.x = Math.round(dropPosition.x - element.width / 2)
    element.y = Math.round(dropPosition.y - element.height / 2)
  }

  return element
}

function createShapeTrack(): Track {
  return {
    id: SHAPE_TRACK_ID,
    name: SHAPE_TRACK_NAME,
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
      let shapeTrack = tracks.find((track) => track.id === SHAPE_TRACK_ID)
      if (!shapeTrack) {
        shapeTrack = createShapeTrack()
        createTrack(shapeTrack)
      }

      const sequence = shapeTrack.elements.filter((element) => element.type === 'shape').length
      const element = buildShapeElement(sequence, options, currentTime)
      addElement(shapeTrack.id, element)
      selectElement(element.id, 'element-library')
      return element
    },
    [tracks, createTrack, addElement, selectElement, currentTime],
  )
}
