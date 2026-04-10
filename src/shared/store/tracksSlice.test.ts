import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './index'
import type { AudioElement, ShapeElement, TextElement, Track } from '../types/editor'
import { AUDIO_TRACK_ID, MEDIA_TRACK_ID, TEXT_TRACK_ID, buildDefaultTracks } from './defaultTracks'

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

function buildAudioElement(id: string, startTime: number, duration = 5): AudioElement {
  return {
    id,
    type: 'audio',
    name: id,
    startTime,
    duration,
    opacity: 1,
    source: '/audio.mp3',
    playbackRate: 1,
    volume: 1,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
  }
}

function buildShapeElement(id: string, startTime: number, duration = 5): ShapeElement {
  return {
    id,
    type: 'shape',
    name: id,
    startTime,
    duration,
    opacity: 1,
    x: 100,
    y: 100,
    width: 320,
    height: 180,
    rotation: 0,
    shapeType: 'rectangle',
    fillColor: '#4f46e5',
    strokeColor: '#1e1b4b',
    strokeWidth: 0,
    cornerRadius: 12,
  }
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

describe('tracksSlice default tracks', () => {
  beforeEach(() => {
    useEditorStore.setState({
      tracks: buildDefaultTracks(),
      selectedElementId: null,
      selectionSource: null,
    })
  })

  it('inicializa con las 3 tracks base', () => {
    const store = useEditorStore.getState()
    const protectedTrackIds = store.tracks.map((track) => track.id)

    expect(protectedTrackIds).toEqual([TEXT_TRACK_ID, AUDIO_TRACK_ID, MEDIA_TRACK_ID])
  })

  it('no permite borrar tracks protegidas', () => {
    const state = useEditorStore.getState()
    useEditorStore.setState({
      tracks: [
        ...state.tracks,
        {
          id: 'track-extra',
          name: 'Pista extra',
          elements: [],
        },
      ],
    })

    const removeTrack = useEditorStore.getState().removeTrack
    removeTrack(TEXT_TRACK_ID)
    removeTrack(AUDIO_TRACK_ID)
    removeTrack(MEDIA_TRACK_ID)
    removeTrack('track-extra')

    const nextTrackIds = useEditorStore.getState().tracks.map((track) => track.id)
    expect(nextTrackIds).toEqual([TEXT_TRACK_ID, AUDIO_TRACK_ID, MEDIA_TRACK_ID])
  })

  it('restringe mover texto y audio solo a su tipo de track', () => {
    useEditorStore.setState({
      tracks: [
        {
          id: TEXT_TRACK_ID,
          name: 'Textos',
          elements: [buildTextElement('text-1', 0)],
        },
        {
          id: AUDIO_TRACK_ID,
          name: 'Audio',
          elements: [buildAudioElement('audio-1', 0)],
        },
        {
          id: MEDIA_TRACK_ID,
          name: 'Imágenes/Vídeos',
          elements: [],
        },
      ],
    })

    const moveElement = useEditorStore.getState().moveElement
    moveElement(TEXT_TRACK_ID, 'text-1', AUDIO_TRACK_ID, 2)
    moveElement(TEXT_TRACK_ID, 'text-1', MEDIA_TRACK_ID, 2)
    moveElement(AUDIO_TRACK_ID, 'audio-1', TEXT_TRACK_ID, 2)
    moveElement(AUDIO_TRACK_ID, 'audio-1', MEDIA_TRACK_ID, 2)

    const nextState = useEditorStore.getState()
    expect(nextState.tracks.find((track) => track.id === TEXT_TRACK_ID)?.elements.map((e) => e.id)).toEqual(['text-1'])
    expect(nextState.tracks.find((track) => track.id === AUDIO_TRACK_ID)?.elements.map((e) => e.id)).toEqual(['audio-1'])
    expect(nextState.tracks.find((track) => track.id === MEDIA_TRACK_ID)?.elements).toHaveLength(0)
  })

  it('permite mover elementos visuales solo a track de imágenes/vídeos', () => {
    useEditorStore.setState({
      tracks: [
        {
          id: TEXT_TRACK_ID,
          name: 'Textos',
          elements: [],
        },
        {
          id: AUDIO_TRACK_ID,
          name: 'Audio',
          elements: [],
        },
        {
          id: MEDIA_TRACK_ID,
          name: 'Imágenes/Vídeos',
          elements: [buildShapeElement('shape-1', 0)],
        },
      ],
    })

    const moveElement = useEditorStore.getState().moveElement
    moveElement(MEDIA_TRACK_ID, 'shape-1', TEXT_TRACK_ID, 1)
    moveElement(MEDIA_TRACK_ID, 'shape-1', AUDIO_TRACK_ID, 1)

    let nextState = useEditorStore.getState()
    expect(nextState.tracks.find((track) => track.id === MEDIA_TRACK_ID)?.elements.map((e) => e.id)).toEqual(['shape-1'])

    useEditorStore.setState({
      tracks: [
        {
          id: TEXT_TRACK_ID,
          name: 'Textos',
          elements: [],
        },
        {
          id: AUDIO_TRACK_ID,
          name: 'Audio',
          elements: [],
        },
        {
          id: MEDIA_TRACK_ID,
          name: 'Imágenes/Vídeos',
          elements: [],
        },
        {
          id: 'track-media-2',
          name: 'Media 2',
          elements: [buildShapeElement('shape-2', 0)],
        },
      ],
    })

    moveElement('track-media-2', 'shape-2', MEDIA_TRACK_ID, 3)
    nextState = useEditorStore.getState()

    expect(nextState.tracks.find((track) => track.id === 'track-media-2')?.elements).toHaveLength(0)
    expect(nextState.tracks.find((track) => track.id === MEDIA_TRACK_ID)?.elements.map((e) => e.id)).toEqual([
      'shape-2',
    ])
  })

  it('mantiene restricción por tipo en tracks vacías tipadas', () => {
    useEditorStore.setState({
      tracks: [
        {
          id: TEXT_TRACK_ID,
          name: 'Textos',
          kind: 'text',
          elements: [],
        },
        {
          id: AUDIO_TRACK_ID,
          name: 'Audio',
          kind: 'audio',
          elements: [buildAudioElement('audio-typed', 0)],
        },
        {
          id: MEDIA_TRACK_ID,
          name: 'Imágenes/Vídeos',
          kind: 'media',
          elements: [],
        },
      ],
    })

    const moveElement = useEditorStore.getState().moveElement
    moveElement(AUDIO_TRACK_ID, 'audio-typed', TEXT_TRACK_ID, 1)

    const nextState = useEditorStore.getState()
    expect(nextState.tracks.find((track) => track.id === AUDIO_TRACK_ID)?.elements.map((e) => e.id)).toEqual([
      'audio-typed',
    ])
    expect(nextState.tracks.find((track) => track.id === TEXT_TRACK_ID)?.elements).toHaveLength(0)
  })
})
