import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import { TEXT_TRACK_ID, TEXT_TRACK_NAME } from '../../../shared/store/defaultTracks'
import type { TextElement, Track } from '../../../shared/types/editor'
import {
  createTextElement,
  isTextElementsApiEnabled,
  type CreateTextElementRequest,
} from '../../../shared/api/textElementsApi'
import type { TextPreset } from '../types'

const TEXT_PRESET_CONFIG: Record<
  TextPreset,
  {
    label: string
    text: string
    fontSize: number
    fontWeight: number
    textAlign: TextElement['textAlign']
    y: number
    x: number
    width: number
    backgroundColor: string
  }
> = {
  title: {
    label: 'Título grande',
    text: 'Título grande',
    fontSize: 72,
    fontWeight: 800,
    textAlign: 'center',
    y: 160,
    x: 240,
    width: 960,
    backgroundColor: 'transparent',
  },
  subtitle: {
    label: 'Subtítulo',
    text: 'Subtítulo',
    fontSize: 48,
    fontWeight: 600,
    textAlign: 'center',
    y: 280,
    x: 260,
    width: 920,
    backgroundColor: 'transparent',
  },
  'lower-third': {
    label: 'Lower third',
    text: 'Nombre Apellido',
    fontSize: 36,
    fontWeight: 700,
    textAlign: 'left',
    y: 420,
    x: 120,
    width: 640,
    backgroundColor: '#111827cc',
  },
  body: {
    label: 'Texto básico',
    text: 'Este es un texto de ejemplo.',
    fontSize: 32,
    fontWeight: 500,
    textAlign: 'left',
    y: 320,
    x: 220,
    width: 880,
    backgroundColor: 'transparent',
  },
}

type AddTextOptions = {
  preset?: TextPreset
  label?: string
  dropPosition?: { x: number; y: number }
}

function buildTextElement(
  sequence: number,
  { preset = 'title', label, dropPosition }: AddTextOptions,
  startTime: number,
): TextElement {
  const config = TEXT_PRESET_CONFIG[preset]
  const baseLabel = label ?? config.label
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `text-${Date.now()}-${sequence}`

  const element: TextElement = {
    id,
    type: 'text',
    name,
    startTime,
    duration: 5,
    opacity: 1,
    effects: [],
    x: config.x,
    y: config.y,
    width: config.width,
    height: 200,
    rotation: 0,
    text: label ?? config.text,
    fontFamily: 'Inter',
    fontSize: config.fontSize,
    fontWeight: config.fontWeight,
    textColor: '#ffffff',
    backgroundColor: config.backgroundColor,
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: config.textAlign,
  }

  if (dropPosition) {
    element.x = Math.round(dropPosition.x - element.width / 2)
    element.y = Math.round(dropPosition.y - element.height / 2)
  }

  return element
}

function createTextTrack(): Track {
  return {
    id: TEXT_TRACK_ID,
    name: TEXT_TRACK_NAME,
    kind: 'text',
    elements: [],
  }
}

function toCreateTextRequestPayload(element: TextElement, trackId: string): CreateTextElementRequest {
  return {
    id: element.id,
    type: 'text',
    name: element.name,
    startTime: element.startTime,
    duration: element.duration,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    text: element.text,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    textColor: element.textColor,
    backgroundColor: element.backgroundColor,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    textAlign: element.textAlign,
    trackId,
  }
}

export function useAddTextElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const projectId = useEditorStore((state) => state.projectId)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)
  const currentTime = useEditorStore((state) => state.currentTime)

  const addText = useCallback(
    async (options: AddTextOptions = {}) => {
      let textTrack = tracks.find((track) => track.id === TEXT_TRACK_ID)
      if (!textTrack) {
        textTrack = createTextTrack()
        createTrack(textTrack)
      }
      const sequence = textTrack.elements.filter((element) => element.type === 'text').length
      const element = buildTextElement(sequence, options, currentTime)
      if (isTextElementsApiEnabled()) {
        await createTextElement(projectId, toCreateTextRequestPayload(element, textTrack.id))
      }
      addElement(textTrack.id, element)
      selectElement(element.id, 'element-library')
      return element
    },
    [tracks, projectId, createTrack, addElement, selectElement, currentTime],
  )

  return addText
}

