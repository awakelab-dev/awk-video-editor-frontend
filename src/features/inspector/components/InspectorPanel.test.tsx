import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { InspectorPanel } from './InspectorPanel'
import { useEditorStore } from '../../../shared/store'
import type { ShapeElement, TextElement } from '../../../shared/types/editor'

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

    const canvasSquare = screen.getByTestId('canvas-square')
    expect(canvasSquare.style.width).toBe('180px')
    expect(canvasSquare.style.height).toBe('135px')
    expect(canvasSquare.style.backgroundColor).toBe('rgb(0, 255, 0)')
    expect(canvasSquare.style.border).toBe('4px solid rgb(17, 17, 17)')
  })

  it('muestra estado vacio cuando no hay seleccion', () => {
    render(<InspectorPanel />)

    expect(
      screen.getByText('Haz click en un elemento para modificar sus propiedades.'),
    ).toBeTruthy()
  })
})
