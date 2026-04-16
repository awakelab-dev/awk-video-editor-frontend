import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppToolbar } from './AppToolbar'
import { useEditorStore } from '../store'
import type { TextElement } from '../types/editor'

function buildTextElement(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: 'text-1',
    type: 'text',
    name: 'Texto principal',
    startTime: 0,
    duration: 8,
    opacity: 1,
    x: 100,
    y: 90,
    width: 260,
    height: 120,
    rotation: 0,
    text: 'Hola',
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

describe('AppToolbar', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    useEditorStore.setState({
      tracks: [
        {
          id: 'track-1',
          name: 'Texto',
          elements: [buildTextElement()],
        },
      ],
      selectedElementId: 'text-1',
      selectionSource: 'timeline',
    })
  })

  it('borra la selección actual desde el botón superior de eliminar', () => {
    render(<AppToolbar />)

    fireEvent.click(screen.getByLabelText('Eliminar'))

    const state = useEditorStore.getState()
    expect(state.tracks[0]?.elements).toHaveLength(0)
    expect(state.selectedElementId).toBeNull()
    expect(state.selectionSource).toBeNull()
  })

  it('desactiva el botón eliminar cuando no hay selección', () => {
    useEditorStore.setState({
      selectedElementId: null,
      selectionSource: null,
    })

    render(<AppToolbar />)

    const deleteButtons = screen.getAllByLabelText('Eliminar')
    expect(deleteButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)
  })
})
