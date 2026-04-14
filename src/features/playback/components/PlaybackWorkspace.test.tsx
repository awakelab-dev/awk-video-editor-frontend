import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PlaybackWorkspace } from './PlaybackWorkspace'
import { useEditorStore } from '../../../shared/store'
import type { AudioElement, ShapeElement, TextElement } from '../../../shared/types/editor'

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

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

function buildShapeElement(): ShapeElement {
  return {
    id: 'shape-1',
    type: 'shape',
    name: 'Rectangulo',
    startTime: 0,
    duration: 10,
    opacity: 1,
    x: 140,
    y: 120,
    width: 300,
    height: 160,
    rotation: 0,
    shapeType: 'rectangle',
    fillColor: '#ef4444',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    cornerRadius: 12,
  }
}

function buildAudioElement(): AudioElement {
  return {
    id: 'audio-1',
    type: 'audio',
    name: 'Audio principal',
    startTime: 0,
    duration: 10,
    opacity: 1,
    source: '/audio.mp3',
    playbackRate: 1,
    volume: 0.5,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
  }
}

describe('PlaybackWorkspace', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    useEditorStore.setState({
      currentTime: 0,
      resolution: { w: 1920, h: 1080 },
      masterVolume: 1,
      selectedElementId: null,
      selectionSource: null,
      tracks: [
        {
          id: 'track-1',
          name: 'Texto',
          elements: [buildTextElement()],
        },
      ],
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('permite arrastrar el texto en el renderer y actualiza su posicion', () => {
    render(<PlaybackWorkspace />)

    const overlay = screen.getByTestId('playback-text-overlay')
    fireEvent.mouseDown(overlay, { button: 0, clientX: 200, clientY: 120 })
    fireEvent.mouseMove(window, { clientX: 260, clientY: 160 })
    fireEvent.mouseUp(window)

    const text = useEditorStore.getState().tracks[0]?.elements[0]
    expect(text?.type).toBe('text')
    if (text?.type === 'text') {
      expect(text.x).toBe(160)
      expect(text.y).toBe(120)
    }
    expect(useEditorStore.getState().selectedElementId).toBe('text-1')
    expect(useEditorStore.getState().selectionSource).toBe('canvas')
  })

  it('permite valores negativos de x e y al arrastrar fuera del frame', () => {
    render(<PlaybackWorkspace />)

    const overlay = screen.getByTestId('playback-text-overlay')
    fireEvent.mouseDown(overlay, { button: 0, clientX: 200, clientY: 120 })
    fireEvent.mouseMove(window, { clientX: 40, clientY: 20 })
    fireEvent.mouseUp(window)

    const text = useEditorStore.getState().tracks[0]?.elements[0]
    expect(text?.type).toBe('text')
    if (text?.type === 'text') {
      expect(text.x).toBe(-60)
      expect(text.y).toBe(-20)
    }
  })

  it('permite arrastrar formas en el renderer y actualiza su posicion', () => {
    useEditorStore.setState({
      currentTime: 0,
      tracks: [
        {
          id: 'track-shapes',
          name: 'Formas',
          elements: [buildShapeElement()],
        },
      ],
    })

    render(<PlaybackWorkspace />)

    const overlay = screen.getByTestId('playback-shape-overlay')
    fireEvent.mouseDown(overlay, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 160, clientY: 150 })
    fireEvent.mouseUp(window)

    const shape = useEditorStore.getState().tracks[0]?.elements[0]
    expect(shape?.type).toBe('shape')
    if (shape?.type === 'shape') {
      expect(shape.x).toBe(200)
      expect(shape.y).toBe(170)
    }
    expect(useEditorStore.getState().selectedElementId).toBe('shape-1')
    expect(useEditorStore.getState().selectionSource).toBe('canvas')
  })

  it('renderiza todos los textos activos de todos los tracks en el mismo tiempo', () => {
    const secondText = buildTextElement()
    secondText.id = 'text-2'
    secondText.text = 'Segundo texto'

    useEditorStore.setState({
      currentTime: 0,
      tracks: [
        {
          id: 'track-1',
          name: 'Texto 1',
          elements: [buildTextElement()],
        },
        {
          id: 'track-2',
          name: 'Texto 2',
          elements: [secondText],
        },
      ],
    })

    render(<PlaybackWorkspace />)

    const overlays = screen.getAllByTestId('playback-text-overlay')
    expect(overlays).toHaveLength(2)
    expect(Number(overlays[0]?.style.zIndex ?? 0)).toBeGreaterThan(Number(overlays[1]?.style.zIndex ?? 0))
    expect(screen.getByText('Hola mundo')).toBeTruthy()
    expect(screen.getByText('Segundo texto')).toBeTruthy()
  })

  it('oculta el placeholder si existe al menos un elemento aunque no este activo en el tiempo actual', () => {
    const futureText = buildTextElement()
    futureText.id = 'text-future'
    futureText.startTime = 20
    futureText.duration = 5

    useEditorStore.setState({
      currentTime: 0,
      tracks: [
        {
          id: 'track-1',
          name: 'Texto futuro',
          elements: [futureText],
        },
      ],
    })

    render(<PlaybackWorkspace />)

    expect(screen.queryByText('Vista previa del video')).toBeNull()
    expect(screen.queryAllByTestId('playback-text-overlay')).toHaveLength(0)
  })

  it('aplica la barra de volumen al volumen real de reproducción de audio', () => {
    const audioInstances: Array<{
      volume: number
      muted: boolean
      playbackRate: number
      currentTime: number
      preload: string
      play: ReturnType<typeof vi.fn>
      pause: ReturnType<typeof vi.fn>
    }> = []

    class AudioMock {
      volume = 1
      muted = false
      playbackRate = 1
      currentTime = 0
      preload = 'auto'
      play = vi.fn().mockResolvedValue(undefined)
      pause = vi.fn()

      constructor() {
        audioInstances.push(this)
      }
    }

    vi.stubGlobal('Audio', AudioMock as unknown as typeof Audio)

    useEditorStore.setState({
      currentTime: 0,
      isPlaying: false,
      masterVolume: 1,
      tracks: [
        {
          id: 'track-audio',
          name: 'Audio',
          elements: [buildAudioElement()],
        },
      ],
    })

    render(<PlaybackWorkspace />)

    expect(audioInstances).toHaveLength(1)
    expect(audioInstances[0]?.volume).toBeCloseTo(0.5, 3)

    const masterVolumeSlider = screen.getByTestId('playback-master-volume')
    fireEvent.change(masterVolumeSlider, { target: { value: '20' } })

    expect(useEditorStore.getState().masterVolume).toBeCloseTo(0.2, 3)
    expect(audioInstances[0]?.volume).toBeCloseTo(0.1, 3)
  })

  it('aplica fade in y fade out al volumen del audio', () => {
    const audioInstances: Array<{
      volume: number
      muted: boolean
      playbackRate: number
      currentTime: number
      preload: string
      play: ReturnType<typeof vi.fn>
      pause: ReturnType<typeof vi.fn>
    }> = []

    class AudioMock {
      volume = 1
      muted = false
      playbackRate = 1
      currentTime = 0
      preload = 'auto'
      play = vi.fn().mockResolvedValue(undefined)
      pause = vi.fn()

      constructor() {
        audioInstances.push(this)
      }
    }

    vi.stubGlobal('Audio', AudioMock as unknown as typeof Audio)

    const audioElement = buildAudioElement()
    audioElement.volume = 1
    audioElement.fadeIn = 2
    audioElement.fadeOut = 3
    audioElement.duration = 10

    useEditorStore.setState({
      currentTime: 1,
      isPlaying: false,
      masterVolume: 1,
      tracks: [
        {
          id: 'track-audio',
          name: 'Audio',
          elements: [audioElement],
        },
      ],
    })

    render(<PlaybackWorkspace />)

    expect(audioInstances).toHaveLength(1)
    expect(audioInstances[0]?.volume).toBeCloseTo(0.5, 3)

    useEditorStore.setState({ currentTime: 8.5 })

    expect(audioInstances[0]?.volume).toBeCloseTo(0.5, 3)
  })
})

