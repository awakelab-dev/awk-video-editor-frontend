import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MediaAsset, TextElement } from '../types/editor'
import { useEditorStore } from './index'
import { buildProjectSnapshotPayload, startProjectSnapshotAutosave, stopProjectSnapshotAutosave } from './projectSnapshotAutosave'
import { saveProjectSnapshot } from '../api/projectSnapshotApi'

vi.mock('../api/projectSnapshotApi', () => ({
  isProjectSnapshotApiEnabled: vi.fn(() => true),
  saveProjectSnapshot: vi.fn().mockResolvedValue(undefined),
}))

function buildTextElement(id: string, startTime: number, duration: number): TextElement {
  return {
    id,
    type: 'text',
    name: id,
    startTime,
    duration,
    opacity: 1,
    effects: [],
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

function buildAssets(): MediaAsset[] {
  return [
    {
      id: 'asset-video-1',
      fileName: 'video.mp4',
      type: 'video',
      source: '/video.mp4',
      duration: 45.2,
    },
    {
      id: 'asset-image-1',
      fileName: 'logo.png',
      type: 'image',
      source: '/logo.png',
    },
  ]
}

describe('projectSnapshotAutosave', () => {
  const saveProjectSnapshotMock = vi.mocked(saveProjectSnapshot)

  beforeEach(() => {
    stopProjectSnapshotAutosave()
    saveProjectSnapshotMock.mockClear()
    useEditorStore.setState({
      projectId: 'project-123',
      projectName: 'Campana Primavera 2026',
      duration: 150,
      resolution: { w: 1920, h: 1080 },
      currentTime: 23.4,
      isPlaying: false,
      zoomLevel: 130,
      selectedElementId: 'text-main-1',
      selectionSource: 'timeline',
      assets: buildAssets(),
      tracks: [
        {
          id: 'track-text-1',
          name: 'Textos',
          elements: [buildTextElement('text-main-1', 0, 8), buildTextElement('text-cta-1', 11, 6)],
        },
      ],
    })
  })

  afterEach(() => {
    stopProjectSnapshotAutosave()
  })

  it('genera el snapshot con la estructura esperada y duración de track basada en timeline', () => {
    const snapshot = buildProjectSnapshotPayload(useEditorStore.getState())

    expect(snapshot.snapshotVersion).toBe(1)
    expect(snapshot.project).toEqual({
      projectName: 'Campana Primavera 2026',
      duration: 150,
      resolution: { w: 1920, h: 1080 },
    })
    expect(snapshot.playback).toEqual({
      currentTime: 23.4,
      isPlaying: false,
      zoomLevel: 130,
    })
    expect(snapshot.selection).toEqual({
      selectedElementId: 'text-main-1',
      selectionSource: 'timeline',
    })
    expect(snapshot.assets).toEqual([
      {
        id: 'asset-video-1',
        duration: 45.2,
      },
      {
        id: 'asset-image-1',
        duration: null,
      },
    ])
    expect(snapshot.tracks).toEqual([
      {
        id: 'track-text-1',
        duration: 17,
        elements: [
          { id: 'text-main-1', duration: 8 },
          { id: 'text-cta-1', duration: 6 },
        ],
      },
    ])
  })

  it('envía snapshot cuando cambian las tracks', () => {
    startProjectSnapshotAutosave()

    useEditorStore.getState().addElement('track-text-1', buildTextElement('text-extra-1', 20, 4))

    expect(saveProjectSnapshotMock).toHaveBeenCalledTimes(1)
    const [projectId, payload] = saveProjectSnapshotMock.mock.calls[0] ?? []
    expect(projectId).toBe('project-123')
    expect(payload?.tracks[0]?.elements.map((element) => element.id)).toContain('text-extra-1')
  })

  it('no envía snapshot cuando cambia estado no relacionado a tracks', () => {
    startProjectSnapshotAutosave()

    useEditorStore.getState().seek(42)
    useEditorStore.getState().setProjectName('Nombre actualizado')

    expect(saveProjectSnapshotMock).not.toHaveBeenCalled()
  })
})
