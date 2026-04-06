import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PlaybackWorkspace } from './PlaybackWorkspace'
import { useEditorStore } from '../../../shared/store'
import type { TextElement } from '../../../shared/types/editor'

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

describe('PlaybackWorkspace', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    useEditorStore.setState({
      currentTime: 0,
      resolution: { w: 1920, h: 1080 },
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
})
