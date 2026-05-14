import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUDIO_TRACK_ID, MEDIA_TRACK_ID, TEXT_TRACK_ID, buildDefaultTracks } from '../store/defaultTracks'
import { useEditorStore } from '../store'
import {
  createElementInProjectTrack,
  loadApiProjectIntoStore,
  loadInitialEditorStateIntoStore,
  type InitialEditorState,
} from './projectsApi'
import type { TextElement } from '../types/editor'

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })

function resetEditorStore() {
  useEditorStore.setState({
    projectId: '',
    revision: 0,
    sessionId: undefined,
    projectName: 'Untitled Project',
    duration: 0,
    resolution: { w: 1920, h: 1080 },
    currentTime: 0,
    isPlaying: false,
    zoomLevel: 100,
    selectedElementId: null,
    selectedTrackId: null,
    selectionSource: null,
    assets: [],
    tracks: buildDefaultTracks(),
  })
}

function buildEditorState(overrides: Partial<InitialEditorState> = {}): InitialEditorState {
  return {
    projectId: 'project-1',
    revision: 7,
    sessionId: 'session-1',
    project: {
      projectName: 'Proyecto guardado',
      duration: 12,
      resolution: { w: 1920, h: 1080 },
    },
    playback: {
      currentTime: 0,
      isPlaying: false,
      zoomLevel: 100,
    },
    selection: {
      selectedElementId: null,
      selectedTrackId: null,
      selectionSource: null,
    },
    assets: [],
    tracks: [],
    elements: {},
    updatedAt: '2026-05-12T10:00:00.000Z',
    ...overrides,
  }
}

function buildTextElement(): TextElement {
  return {
    id: 'local-title',
    type: 'text',
    name: 'Titulo',
    startTime: 0,
    duration: 4,
    opacity: 1,
    effects: [],
    x: 100,
    y: 100,
    width: 500,
    height: 120,
    rotation: 0,
    text: 'Nuevo texto',
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: 700,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: 'center',
  }
}

describe('projectsApi hydration', () => {
  beforeEach(() => {
    resetEditorStore()
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('hydrates track elements from elementIds and the project elements map', () => {
    loadInitialEditorStateIntoStore(
      buildEditorState({
        tracks: [
          {
            id: TEXT_TRACK_ID,
            name: 'Textos',
            kind: 'text',
            elementIds: ['title-1'],
          },
        ],
        elements: {
          'title-1': {
            type: 'text',
            name: 'Titulo',
            startTime: 2,
            duration: 4,
            opacity: 100,
            x: 100,
            y: 120,
            width: 500,
            height: 120,
            rotation: 0,
            text: 'Hola desde BD',
          },
        },
      }),
    )

    const textTrack = useEditorStore.getState().tracks.find((track) => track.id === TEXT_TRACK_ID)

    expect(textTrack?.elements).toHaveLength(1)
    expect(textTrack?.elements[0]).toMatchObject({
      id: 'title-1',
      type: 'text',
      text: 'Hola desde BD',
      startTime: 2,
    })
  })

  it('hydrates default tracks from standalone elements with trackId', () => {
    loadInitialEditorStateIntoStore(
      buildEditorState({
        tracks: [],
        elements: [
          {
            id: 'audio-1',
            trackId: AUDIO_TRACK_ID,
            type: 'audio',
            name: 'Voz',
            startTime: 0,
            duration: 8,
            opacity: 100,
            source: '/voice.mp3',
          },
          {
            id: 'video-1',
            trackId: MEDIA_TRACK_ID,
            type: 'video',
            name: 'Clip',
            startTime: 1,
            duration: 5,
            opacity: 100,
            source: '/clip.mp4',
          },
        ],
      }),
    )

    const state = useEditorStore.getState()

    expect(state.tracks.find((track) => track.id === AUDIO_TRACK_ID)?.elements.map((element) => element.id)).toEqual([
      'audio-1',
    ])
    expect(state.tracks.find((track) => track.id === MEDIA_TRACK_ID)?.elements.map((element) => element.id)).toEqual([
      'video-1',
    ])
  })

  it('hydrates standalone shapes into the default media track even without trackId', () => {
    loadInitialEditorStateIntoStore(
      buildEditorState({
        tracks: [
          {
            id: MEDIA_TRACK_ID,
            name: 'Imagenes/Videos',
            kind: 'media',
            elements: [],
          },
        ],
        elements: {
          'shape-1': {
            type: 'shape',
            name: 'Rectangulo',
            startTime: 1,
            duration: 5,
            opacity: 100,
            x: 120,
            y: 140,
            width: 320,
            height: 180,
            rotation: 0,
            shapeType: 'rectangle',
            fillColor: '#4f46e5',
          },
        },
      }),
    )

    const mediaTrack = useEditorStore.getState().tracks.find((track) => track.id === MEDIA_TRACK_ID)

    expect(mediaTrack?.elements).toHaveLength(1)
    expect(mediaTrack?.elements[0]).toMatchObject({
      id: 'shape-1',
      type: 'shape',
      shapeType: 'rectangle',
    })
  })

  it('loads an existing project from the full project document without legacy endpoints', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          projectId: 'project-from-db',
          name: 'Proyecto desde BD',
          duration: 20,
          resolution: { w: 1280, h: 720 },
          revision: 11,
          sessionId: 'session-db',
          playback: {
            currentTime: 3,
            isPlaying: false,
            zoomLevel: 120,
          },
          selection: {
            selectedElementId: null,
            selectionSource: null,
          },
          assets: {},
          tracks: [
            {
              id: TEXT_TRACK_ID,
              name: 'Textos',
              kind: 'text',
              elementIds: ['title-2'],
            },
          ],
          elements: {
            'title-2': {
              id: 'title-2',
              trackId: TEXT_TRACK_ID,
              type: 'text',
              name: 'Titulo',
              startTime: 0,
              duration: 6,
              opacity: 100,
              x: 80,
              y: 100,
              width: 600,
              height: 140,
              rotation: 0,
              text: 'Proyecto reabierto',
            },
          },
          updatedAt: '2026-05-12T10:00:00.000Z',
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await loadApiProjectIntoStore('project-from-db')

    const state = useEditorStore.getState()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/v1/projects/project-from-db', undefined)
    expect(state.projectId).toBe('project-from-db')
    expect(state.projectName).toBe('Proyecto desde BD')
    expect(state.tracks.find((track) => track.id === TEXT_TRACK_ID)?.elements[0]).toMatchObject({
      id: 'title-2',
      type: 'text',
      text: 'Proyecto reabierto',
    })
  })

  it('creates an element with the backend-required trackId', async () => {
    useEditorStore.setState({
      projectId: 'project-1',
      revision: 1,
      sessionId: 'session-1',
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (
        url === 'https://api.example.test/api/v1/projects/project-1/elements?trackId=track-text' &&
        init?.method === 'POST'
      ) {
        return jsonResponse({
          data: {
            projectId: 'project-1',
            elementId: 'text-created',
            type: 'text',
            revision: 2,
            sessionId: 'session-1',
          },
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const created = await createElementInProjectTrack('project-1', TEXT_TRACK_ID, buildTextElement())

    const createCall = fetchMock.mock.calls[0]
    const createBody = JSON.parse(String(createCall?.[1]?.body))

    expect(created.id).toBe('text-created')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(createCall?.[0]).toBe('https://api.example.test/api/v1/projects/project-1/elements?trackId=track-text')
    expect(createBody).not.toHaveProperty('trackId')
    expect(useEditorStore.getState().revision).toBe(2)
  })
})
