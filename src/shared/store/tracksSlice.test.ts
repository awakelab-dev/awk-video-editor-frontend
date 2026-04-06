import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './index'
import type { TextElement, Track } from '../types/editor'

function buildTextElement(id: string, startTime: number, duration = 5): TextElement {
  return {
    id,
    type: 'text',
    name: id,
    startTime,
    duration,
    opacity: 1,
    x: 100,
    y: 100,
    width: 400,
    height: 120,
    rotation: 0,
    text: id,
    fontFamily: 'Inter',
    fontSize: 42,
    fontWeight: 700,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: 'center',
  }
}

function buildTracks(): Track[] {
  return [
    {
      id: 'track-a',
      name: 'Track A',
      elements: [buildTextElement('el-1', 0), buildTextElement('el-2', 8)],
    },
    {
      id: 'track-b',
      name: 'Track B',
      elements: [],
    },
  ]
}

describe('tracksSlice moveElement', () => {
  beforeEach(() => {
    useEditorStore.setState({
      tracks: buildTracks(),
      selectedElementId: null,
      selectionSource: null,
    })
  })

  it('reordena elementos en la misma pista y actualiza startTime', () => {
    useEditorStore.getState().moveElement('track-a', 'el-1', 'track-a', 12)

    const trackA = useEditorStore.getState().tracks.find((track) => track.id === 'track-a')
    expect(trackA?.elements.map((element) => element.id)).toEqual(['el-2', 'el-1'])
    expect(trackA?.elements.find((element) => element.id === 'el-1')?.startTime).toBe(12)
  })

  it('mueve elementos entre pistas y los elimina de la pista origen', () => {
    useEditorStore.getState().moveElement('track-a', 'el-2', 'track-b', 3)

    const nextState = useEditorStore.getState()
    const trackA = nextState.tracks.find((track) => track.id === 'track-a')
    const trackB = nextState.tracks.find((track) => track.id === 'track-b')

    expect(trackA?.elements.map((element) => element.id)).toEqual(['el-1'])
    expect(trackB?.elements.map((element) => element.id)).toEqual(['el-2'])
    expect(trackB?.elements[0]?.startTime).toBe(3)
  })
})
