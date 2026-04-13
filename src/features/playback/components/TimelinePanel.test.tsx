import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TimelinePanel } from './TimelinePanel'
import { useEditorStore } from '../../../shared/store'
import { AUDIO_TRACK_ID, MEDIA_TRACK_ID, TEXT_TRACK_ID } from '../../../shared/store/defaultTracks'
import type { TextElement } from '../../../shared/types/editor'

function buildTextElement(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: 'text-1',
    type: 'text',
    name: 'Texto principal',
    startTime: 0,
    duration: 10,
    opacity: 1,
    x: 100,
    y: 80,
    width: 220,
    height: 120,
    rotation: 0,
    text: 'Hola mundo',
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: 700,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: 'left',
    ...overrides,
  }
}

describe('TimelinePanel', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    useEditorStore.setState({
      currentTime: 0,
      duration: 10,
      isPlaying: false,
      zoomLevel: 100,
      tracks: [
        {
          id: 'track-1',
          name: 'Texto',
          elements: [buildTextElement()],
        },
      ],
    })
  })

  it('hace scrub con la rueda sobre el timeline', () => {
    render(<TimelinePanel />)

    fireEvent.wheel(screen.getByTestId('timeline-scroll-area'), { deltaY: 120 })

    expect(useEditorStore.getState().currentTime).toBeGreaterThan(0)
  })

  it('permite mover el playhead con drag', () => {
    render(<TimelinePanel />)

    const surface = screen.getByTestId('timeline-surface')
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 1000, 120))

    fireEvent.mouseDown(screen.getByTestId('timeline-playhead-handle'), {
      button: 0,
      clientX: 200,
      clientY: 40,
    })
    fireEvent.mouseMove(window, { clientX: 700, clientY: 40 })
    fireEvent.mouseUp(window)

    expect(useEditorStore.getState().currentTime).toBeGreaterThan(6)
  })

  it('alarga y acorta un clip desde el extremo derecho actualizando su duration', () => {
    render(<TimelinePanel />)

    const rightHandle = screen.getByTestId('timeline-resize-right-text-1')
    fireEvent.mouseDown(rightHandle, { button: 0, clientX: 300, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 520, clientY: 20 })
    fireEvent.mouseUp(window)

    const element = useEditorStore.getState().tracks[0]?.elements[0]
    expect(element?.type).toBe('text')
    if (element?.type === 'text') {
      expect(element.duration).toBeCloseTo(12, 3)
      expect(element.startTime).toBeCloseTo(0, 3)
    }
  })

  it('redimensiona desde el extremo izquierdo y ajusta startTime y duration', () => {
    render(<TimelinePanel />)

    const leftHandle = screen.getByTestId('timeline-resize-left-text-1')
    fireEvent.mouseDown(leftHandle, { button: 0, clientX: 300, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 520, clientY: 20 })
    fireEvent.mouseUp(window)

    const element = useEditorStore.getState().tracks[0]?.elements[0]
    expect(element?.type).toBe('text')
    if (element?.type === 'text') {
      expect(element.startTime).toBeCloseTo(2, 3)
      expect(element.duration).toBeCloseTo(8, 3)
    }
  })

  it('no permite estirar a la derecha por encima del siguiente clip', () => {
    useEditorStore.setState({
      tracks: [
        {
          id: 'track-1',
          name: 'Texto',
          elements: [
            buildTextElement({ id: 'text-1', name: 'Clip A', text: 'Clip A', startTime: 0, duration: 10 }),
            buildTextElement({ id: 'text-2', name: 'Clip B', text: 'Clip B', startTime: 12, duration: 6 }),
          ],
        },
      ],
    })

    render(<TimelinePanel />)

    const rightHandle = screen.getByTestId('timeline-resize-right-text-1')
    fireEvent.mouseDown(rightHandle, { button: 0, clientX: 300, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 2000, clientY: 20 })
    fireEvent.mouseUp(window)

    const track = useEditorStore.getState().tracks[0]
    const first = track?.elements.find((element) => element.id === 'text-1')
    const second = track?.elements.find((element) => element.id === 'text-2')

    expect(first?.type).toBe('text')
    expect(second?.type).toBe('text')
    if (first?.type === 'text' && second?.type === 'text') {
      expect(first.startTime).toBeCloseTo(0, 3)
      expect(first.duration).toBeCloseTo(12, 3)
      expect(second.startTime).toBeCloseTo(12, 3)
    }
  })

  it('no permite estirar a la izquierda por encima del clip anterior', () => {
    useEditorStore.setState({
      tracks: [
        {
          id: 'track-1',
          name: 'Texto',
          elements: [
            buildTextElement({ id: 'text-0', name: 'Clip 0', text: 'Clip 0', startTime: 0, duration: 4 }),
            buildTextElement({ id: 'text-1', name: 'Clip 1', text: 'Clip 1', startTime: 6, duration: 6 }),
          ],
        },
      ],
    })

    render(<TimelinePanel />)

    const leftHandle = screen.getByTestId('timeline-resize-left-text-1')
    fireEvent.mouseDown(leftHandle, { button: 0, clientX: 300, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: -1000, clientY: 20 })
    fireEvent.mouseUp(window)

    const track = useEditorStore.getState().tracks[0]
    const element = track?.elements.find((clip) => clip.id === 'text-1')

    expect(element?.type).toBe('text')
    if (element?.type === 'text') {
      expect(element.startTime).toBeCloseTo(4, 3)
      expect(element.duration).toBeCloseTo(8, 3)
    }
  })

  it('crea una nueva track al soltar un elemento en la lane provisional', () => {
    render(<TimelinePanel />)

    const clipLabel = screen.getByText('Texto principal')
    const clip = clipLabel.closest('[draggable="true"]') as HTMLElement

    const dataStore = new Map<string, string>()
    const dataTransfer = {
      effectAllowed: 'all',
      dropEffect: 'move',
      setData: (type: string, value: string) => {
        dataStore.set(type, value)
      },
      getData: (type: string) => dataStore.get(type) ?? '',
    } as unknown as DataTransfer

    fireEvent.dragStart(clip, { dataTransfer })

    const newLane = screen.getByTestId('timeline-new-track-lane')
    vi.spyOn(newLane, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 1000, 40))

    fireEvent.dragOver(newLane, { dataTransfer, clientX: 250 })
    fireEvent.drop(newLane, { dataTransfer, clientX: 250 })

    const state = useEditorStore.getState()
    expect(state.tracks).toHaveLength(2)

    const originalTrack = state.tracks[0]
    const createdTrack = state.tracks[1]

    expect(originalTrack?.elements).toHaveLength(0)
    expect(createdTrack?.elements.map((element) => element.id)).toContain('text-1')
    expect(createdTrack?.name).toBe('Pista 2')
    expect(createdTrack?.kind).toBe('text')
    expect(screen.queryByTestId('timeline-new-track-lane')).toBeNull()
  })

  it('impide soltar un texto en una track de audio', () => {
    useEditorStore.setState({
      tracks: [
        {
          id: TEXT_TRACK_ID,
          name: 'Textos',
          elements: [buildTextElement()],
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
      ],
    })

    render(<TimelinePanel />)

    const clip = screen.getByText('Texto principal').closest('[draggable="true"]') as HTMLElement
    const dataStore = new Map<string, string>()
    const dataTransfer = {
      effectAllowed: 'all',
      dropEffect: 'move',
      setData: (type: string, value: string) => {
        dataStore.set(type, value)
      },
      getData: (type: string) => dataStore.get(type) ?? '',
    } as unknown as DataTransfer

    fireEvent.dragStart(clip, { dataTransfer })

    const audioLane = screen.getByTestId(`timeline-lane-${AUDIO_TRACK_ID}`)
    vi.spyOn(audioLane, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 1000, 40))
    fireEvent.dragOver(audioLane, { dataTransfer, clientX: 200 })
    fireEvent.drop(audioLane, { dataTransfer, clientX: 200 })

    const state = useEditorStore.getState()
    expect(state.tracks.find((track) => track.id === TEXT_TRACK_ID)?.elements.map((el) => el.id)).toEqual(['text-1'])
    expect(state.tracks.find((track) => track.id === AUDIO_TRACK_ID)?.elements).toHaveLength(0)
  })
})
