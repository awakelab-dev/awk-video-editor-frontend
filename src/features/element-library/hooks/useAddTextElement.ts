import { useCallback } from 'react'
import { useEditorStore } from '../../../shared/store'
import type { TextElement, Track } from '../../../shared/types/editor'

const TEXT_TRACK_ID = 'track-text'
const TEXT_TRACK_NAME = 'Textos'

function buildTextElement(sequence: number): TextElement {
  const name = sequence === 0 ? 'Texto' : `Texto${sequence}`
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `text-${Date.now()}-${sequence}`

  return {
    id,
    type: 'text',
    name,
    startTime: 0,
    duration: 5,
    opacity: 1,
    x: 480,
    y: 270,
    width: 960,
    height: 200,
    rotation: 0,
    text: name,
    fontFamily: 'Inter',
    fontSize: 64,
    fontWeight: 700,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: 'center',
  }
}

function createTextTrack(): Track {
  return {
    id: TEXT_TRACK_ID,
    name: TEXT_TRACK_NAME,
    elements: [],
  }
}

export function useAddTextElement() {
  const tracks = useEditorStore((state) => state.tracks)
  const createTrack = useEditorStore((state) => state.createTrack)
  const addElement = useEditorStore((state) => state.addElement)
  const selectElement = useEditorStore((state) => state.selectElement)

  return useCallback(() => {
    let textTrack = tracks.find((track) => track.id === TEXT_TRACK_ID)
    if (!textTrack) {
      textTrack = createTextTrack()
      createTrack(textTrack)
    }

    const sequence = textTrack.elements.filter((element) => element.type === 'text').length
    const element = buildTextElement(sequence)
    addElement(textTrack.id, element)
    selectElement(element.id, 'element-library')
    return element
  }, [tracks, createTrack, addElement, selectElement])
}
