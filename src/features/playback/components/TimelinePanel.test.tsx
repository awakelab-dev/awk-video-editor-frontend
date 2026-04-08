import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TimelinePanel } from './TimelinePanel'
import { useEditorStore } from '../../../shared/store'
import type { TextElement } from '../../../shared/types/editor'

function buildTextElement(): TextElement {
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
    expect(screen.queryByTestId('timeline-new-track-lane')).toBeNull()
  })
})
