import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { InspectorPanel } from './InspectorPanel'
import { useEditorStore } from '../../../shared/store'
import type { AudioElement, ImageElement, ShapeElement, TextElement, VideoElement } from '../../../shared/types/editor'

function normalizeOpacity(opacity: number) {
  return opacity <= 1 ? opacity : opacity / 100
}

function CanvasTextPreview() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const tracks = useEditorStore((state) => state.tracks)

  const selectedText = tracks
    .flatMap((track) => track.elements)
    .find((element) => element.id === selectedElementId && element.type === 'text')

  if (!selectedText || selectedText.type !== 'text') {
    return <p data-testid="canvas-empty">sin seleccion</p>
  }

  return (
    <p
      data-testid="canvas-text"
      style={{
        color: selectedText.textColor,
        fontFamily: selectedText.fontFamily,
        fontSize: `${selectedText.fontSize}px`,
        left: `${selectedText.x}px`,
        opacity: normalizeOpacity(selectedText.opacity),
        position: 'absolute',
        top: `${selectedText.y}px`,
        transform: `rotate(${selectedText.rotation}deg)`,
      }}
    >
      {selectedText.text}
    </p>
  )
}

function CanvasSquarePreview() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const tracks = useEditorStore((state) => state.tracks)

  const selectedShape = tracks
    .flatMap((track) => track.elements)
    .find(
      (element) =>
        element.id === selectedElementId &&
        element.type === 'shape' &&
        element.shapeType === 'rectangle',
    )

  if (!selectedShape || selectedShape.type !== 'shape') {
    return <p data-testid="canvas-empty-shape">sin seleccion</p>
  }

  return (
    <div
      data-testid="canvas-square"
      style={{
        backgroundColor: selectedShape.fillColor,
        border: `${selectedShape.strokeWidth}px solid ${selectedShape.strokeColor}`,
        height: `${selectedShape.height}px`,
        left: `${selectedShape.x}px`,
        opacity: normalizeOpacity(selectedShape.opacity),
        position: 'absolute',
        top: `${selectedShape.y}px`,
        width: `${selectedShape.width}px`,
      }}
    />
  )
}

function buildTextElement(): TextElement {
  return {
    backgroundColor: '#00000000',
    duration: 10,
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 400,
    height: 100,
    id: 'text-1',
    letterSpacing: 0,
    lineHeight: 1.2,
    name: 'Texto principal',
    opacity: 1,
    effects: [],
    rotation: 0,
    startTime: 0,
    text: 'Hola mundo',
    textAlign: 'left',
    textColor: '#ffffff',
    type: 'text',
    width: 220,
    x: 100,
    y: 80,
  }
}

function buildSquareElement(): ShapeElement {
  return {
    cornerRadius: 0,
    duration: 8,
    fillColor: '#ff0000',
    height: 120,
    id: 'shape-1',
    name: 'Cuadrado principal',
    opacity: 1,
    effects: [],
    rotation: 0,
    shapeType: 'rectangle',
    startTime: 0,
    strokeColor: '#111111',
    strokeWidth: 2,
    type: 'shape',
    width: 160,
    x: 240,
    y: 140,
  }
}

function buildEllipseElement(): ShapeElement {
  return {
    cornerRadius: 0,
    duration: 8,
    fillColor: '#3366ff',
    height: 110,
    id: 'shape-ellipse-1',
    name: 'Elipse principal',
    opacity: 1,
    effects: [],
    rotation: 0,
    shapeType: 'ellipse',
    startTime: 0,
    strokeColor: '#222222',
    strokeWidth: 3,
    type: 'shape',
    width: 170,
    x: 260,
    y: 150,
  }
}

function buildAudioElement(): AudioElement {
  return {
    duration: 12,
    fadeIn: 0,
    fadeOut: 0,
    id: 'audio-1',
    muted: false,
    name: 'Audio principal',
    opacity: 1,
    effects: [],
    playbackRate: 1,
    source: '/audio.mp3',
    startTime: 0,
    type: 'audio',
    volume: 0.5,
  }
}

function buildImageElement(): ImageElement {
  return {
    borderColor: '#ffffff',
    borderWidth: 0,
    duration: 10,
    fit: 'cover',
    height: 180,
    id: 'image-1',
    name: 'Imagen principal',
    opacity: 1,
    effects: [],
    rotation: 0,
    source: '/image.jpg',
    startTime: 0,
    type: 'image',
    width: 320,
    x: 120,
    y: 90,
  }
}

function buildVideoElement(): VideoElement {
  return {
    duration: 20,
    height: 200,
    id: 'video-1',
    muted: false,
    name: 'Video principal',
    opacity: 1,
    effects: [],
    playbackRate: 1,
    rotation: 0,
    source: '/video.mp4',
    startTime: 0,
    trimEnd: 0,
    trimStart: 0,
    type: 'video',
    volume: 0.6,
    width: 360,
    x: 80,
    y: 70,
  }
}

describe('InspectorPanel', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    const state = useEditorStore.getState()
    useEditorStore.setState({
      selectedElementId: null,
      selectionSource: null,
      tracks: [],
    })
    state.clearSelection()
  })

  it('actualiza el canvas al cambiar propiedades del texto', () => {
    const textElement = buildTextElement()

    useEditorStore.setState({
      selectedElementId: textElement.id,
      selectionSource: 'canvas',
      tracks: [
        {
          elements: [textElement],
          id: 'track-1',
          name: 'Texto',
        },
      ],
    })

    render(
      <>
        <InspectorPanel />
        <CanvasTextPreview />
      </>,
    )

    const canvasText = screen.getByTestId('canvas-text')
    expect(canvasText.style.fontSize).toBe('12px')

    fireEvent.change(screen.getByLabelText('Tamaño'), { target: { value: '16' } })

    expect(screen.getByTestId('canvas-text').style.fontSize).toBe('16px')

    fireEvent.change(screen.getByLabelText('Rotación texto'), { target: { value: '30' } })

    expect(screen.getByTestId('canvas-text').style.transform).toBe('rotate(30deg)')

    fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Nuevo copy' } })

    expect(screen.getByTestId('canvas-text').textContent).toBe('Nuevo copy')
  })

  it('actualiza el canvas al cambiar propiedades del cuadrado', () => {
    const squareElement = buildSquareElement()

    useEditorStore.setState({
      selectedElementId: squareElement.id,
      selectionSource: 'canvas',
      tracks: [
        {
          elements: [squareElement],
          id: 'track-1',
          name: 'Formas',
        },
      ],
    })

    render(
      <>
        <InspectorPanel />
        <CanvasSquarePreview />
      </>,
    )

    fireEvent.change(screen.getByLabelText('Tamaño'), { target: { value: '180' } })
    fireEvent.change(screen.getByLabelText('Codigo relleno'), { target: { value: '#00ff00' } })
    fireEvent.change(screen.getByLabelText('Grosor borde'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Rotación forma'), { target: { value: '45' } })

    const canvasSquare = screen.getByTestId('canvas-square')
    expect(canvasSquare.style.width).toBe('180px')
    expect(canvasSquare.style.height).toBe('135px')
    expect(canvasSquare.style.left).toBe('240px')
    expect(canvasSquare.style.top).toBe('140px')
    expect(canvasSquare.style.backgroundColor).toBe('rgb(0, 255, 0)')
    expect(canvasSquare.style.border).toBe('4px solid rgb(17, 17, 17)')
    const inspectorPreview = screen.getByTestId('inspector-shape-preview')
    expect(inspectorPreview.style.transform).toBe('rotate(45deg)')
  })

  it('muestra y edita propiedades para otras formas (elipse)', () => {
    const ellipseElement = buildEllipseElement()

    useEditorStore.setState({
      selectedElementId: ellipseElement.id,
      selectionSource: 'canvas',
      tracks: [
        {
          elements: [ellipseElement],
          id: 'track-1',
          name: 'Formas',
        },
      ],
    })

    render(<InspectorPanel />)

    expect(screen.getByText('Círculo')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Codigo relleno'), { target: { value: '#ff00aa' } })

    const updatedShape = useEditorStore.getState().tracks[0]?.elements[0]
    expect(updatedShape?.type).toBe('shape')
    if (updatedShape?.type === 'shape') {
      expect(updatedShape.fillColor).toBe('#ff00aa')
    }
  })

  it('muestra y actualiza propiedades de audio', () => {
    const audioElement = buildAudioElement()

    useEditorStore.setState({
      selectedElementId: audioElement.id,
      selectionSource: 'timeline',
      tracks: [
        {
          elements: [audioElement],
          id: 'track-audio',
          name: 'Audio',
        },
      ],
    })

    render(<InspectorPanel />)

    expect(screen.getByText('Audio')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Volumen audio'), { target: { value: '80' } })
    fireEvent.change(screen.getByLabelText('Fade In'), { target: { value: '1.5' } })
    fireEvent.change(screen.getByLabelText('Fade Out'), { target: { value: '2.5' } })

    const updatedAudio = useEditorStore.getState().tracks[0]?.elements[0]
    expect(updatedAudio?.type).toBe('audio')
    if (updatedAudio?.type === 'audio') {
      expect(updatedAudio.volume).toBeCloseTo(0.8, 3)
      expect(updatedAudio.fadeIn).toBeCloseTo(1.5, 3)
      expect(updatedAudio.fadeOut).toBeCloseTo(2.5, 3)
    }
  })

  it('muestra y actualiza propiedades de imagen', () => {
    const imageElement = buildImageElement()

    useEditorStore.setState({
      selectedElementId: imageElement.id,
      selectionSource: 'canvas',
      tracks: [
        {
          elements: [imageElement],
          id: 'track-image',
          name: 'Imagenes',
        },
      ],
    })

    render(<InspectorPanel />)

    expect(screen.getByText('Imagen')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Grosor borde imagen'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Codigo color borde imagen'), { target: { value: '#ff8800' } })
    fireEvent.change(screen.getByLabelText('Rotacion imagen'), { target: { value: '25' } })

    const updatedImage = useEditorStore.getState().tracks[0]?.elements[0]
    expect(updatedImage?.type).toBe('image')
    if (updatedImage?.type === 'image') {
      expect(updatedImage.borderWidth).toBe(6)
      expect(updatedImage.borderColor).toBe('#ff8800')
      expect(updatedImage.rotation).toBe(25)
    }
  })

  it('muestra y actualiza propiedades de video', () => {
    const videoElement = buildVideoElement()

    useEditorStore.setState({
      selectedElementId: videoElement.id,
      selectionSource: 'canvas',
      tracks: [
        {
          elements: [videoElement],
          id: 'track-video',
          name: 'Videos',
        },
      ],
    })

    render(<InspectorPanel />)

    expect(screen.getByText('Video')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Velocidad video'), { target: { value: '1.5' } })
    fireEvent.change(screen.getByLabelText('Volumen video'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Rotacion video'), { target: { value: '40' } })

    const updatedVideo = useEditorStore.getState().tracks[0]?.elements[0]
    expect(updatedVideo?.type).toBe('video')
    if (updatedVideo?.type === 'video') {
      expect(updatedVideo.playbackRate).toBeCloseTo(1.5, 3)
      expect(updatedVideo.volume).toBeCloseTo(0.3, 3)
      expect(updatedVideo.rotation).toBe(40)
    }
  })

  it('guarda el efecto seleccionado en el estado del elemento', () => {
    const textElement = buildTextElement()

    useEditorStore.setState({
      selectedElementId: textElement.id,
      selectionSource: 'canvas',
      tracks: [
        {
          elements: [textElement],
          id: 'track-text',
          name: 'Texto',
        },
      ],
    })

    render(<InspectorPanel />)

    fireEvent.change(screen.getByLabelText('Efectos'), { target: { value: 'fade' } })

    const updatedText = useEditorStore.getState().tracks[0]?.elements[0]
    expect(updatedText?.type).toBe('text')
    if (updatedText?.type === 'text') {
      expect(updatedText.effects).toEqual(['fade'])
    }

    fireEvent.change(screen.getByLabelText('Efectos'), { target: { value: 'none' } })

    const resetText = useEditorStore.getState().tracks[0]?.elements[0]
    expect(resetText?.type).toBe('text')
    if (resetText?.type === 'text') {
      expect(resetText.effects).toEqual([])
    }
  })

  it('muestra estado vacio cuando no hay seleccion', () => {
    render(<InspectorPanel />)

    expect(
      screen.getByText('Haz click en un elemento para modificar sus propiedades.'),
    ).toBeTruthy()
  })
})
