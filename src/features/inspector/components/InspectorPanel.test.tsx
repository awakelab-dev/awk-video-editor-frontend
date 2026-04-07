import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { InspectorPanel } from './InspectorPanel'
import { useEditorStore } from '../../../shared/store'
import type { TextElement } from '../../../shared/types/editor'

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
        opacity: selectedText.opacity / 100,
        position: 'absolute',
        top: `${selectedText.y}px`,
      }}
    >
      {selectedText.text}
    </p>
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
    opacity: 100,
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

    fireEvent.change(screen.getByLabelText('Tamano'), { target: { value: '16' } })

    expect(screen.getByTestId('canvas-text').style.fontSize).toBe('16px')

    fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Nuevo copy' } })

    expect(screen.getByTestId('canvas-text').textContent).toBe('Nuevo copy')
  })

  it('muestra estado vacio cuando no hay seleccion', () => {
    render(<InspectorPanel />)

    expect(
      screen.getByText('Haz click en un elemento para modificar sus propiedades.'),
    ).toBeTruthy()
  })
})
