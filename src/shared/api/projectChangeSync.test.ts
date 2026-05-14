import { describe, expect, it } from 'vitest'
import type { ShapeElement, TextElement, Track } from '../types/editor'
import { buildProjectChangesFromTracks, mergeProjectChanges } from './projectChangeSync'

function buildTextElement(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: 'text-1',
    type: 'text',
    name: 'Title',
    startTime: 0,
    duration: 5,
    opacity: 1,
    effects: [],
    x: 100,
    y: 100,
    width: 400,
    height: 120,
    rotation: 0,
    text: 'Title',
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: 700,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: 'center',
    ...overrides,
  }
}

function buildShapeElement(overrides: Partial<ShapeElement> = {}): ShapeElement {
  return {
    id: 'shape-1',
    type: 'shape',
    name: 'Rectangle',
    startTime: 0,
    duration: 5,
    opacity: 1,
    effects: [],
    x: 320,
    y: 220,
    width: 320,
    height: 180,
    rotation: 0,
    shapeType: 'rectangle',
    fillColor: '#4f46e5',
    strokeColor: '#1e1b4b',
    strokeWidth: 0,
    cornerRadius: 12,
    ...overrides,
  }
}

function buildTrack(id: string, elements: Track['elements']): Track {
  return {
    id,
    name: id,
    elements,
  }
}

describe('projectChangeSync', () => {
  it('builds an element.update patch when element properties change', () => {
    const previousTracks = [buildTrack('track-text', [buildTextElement()])]
    const nextTracks = [
      buildTrack('track-text', [
        buildTextElement({
          text: 'Updated title',
          x: 140,
          y: 160,
        }),
      ]),
    ]

    expect(buildProjectChangesFromTracks(previousTracks, nextTracks)).toEqual([
      {
        type: 'element.update',
        elementId: 'text-1',
        patch: {
          text: 'Updated title',
          x: 140,
          y: 160,
        },
      },
    ])
  })

  it('builds move and update changes when an element changes track and timing', () => {
    const previousTracks = [
      buildTrack('track-media', [buildShapeElement()]),
      buildTrack('track-media-2', []),
    ]
    const nextTracks = [
      buildTrack('track-media', []),
      buildTrack('track-media-2', [buildShapeElement({ startTime: 3 })]),
    ]

    expect(buildProjectChangesFromTracks(previousTracks, nextTracks)).toEqual([
      {
        type: 'element.move',
        elementId: 'shape-1',
        toTrackId: 'track-media-2',
        toIndex: 0,
      },
      {
        type: 'element.update',
        elementId: 'shape-1',
        patch: {
          startTime: 3,
        },
      },
    ])
  })

  it('merges repeated updates for the same element into the latest patch', () => {
    const merged = mergeProjectChanges(
      [
        {
          type: 'element.update',
          elementId: 'shape-1',
          patch: {
            x: 340,
          },
        },
      ],
      [
        {
          type: 'element.update',
          elementId: 'shape-1',
          patch: {
            x: 360,
            y: 240,
          },
        },
      ],
    )

    expect(merged).toEqual([
      {
        type: 'element.update',
        elementId: 'shape-1',
        patch: {
          x: 360,
          y: 240,
        },
      },
    ])
  })
})
