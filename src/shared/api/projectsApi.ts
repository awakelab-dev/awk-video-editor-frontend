import {
  AUDIO_TRACK_ID,
  AUDIO_TRACK_NAME,
  MEDIA_TRACK_ID,
  MEDIA_TRACK_NAME,
  TEXT_TRACK_ID,
  TEXT_TRACK_NAME,
} from '../store/defaultTracks'
import type {
  AudioElement,
  EditorElement,
  ImageElement,
  MediaAsset,
  ShapeElement,
  TextElement,
  Track,
  VideoElement,
} from '../types/editor'
import { loadPresentationProjectData, type PresentationProject } from '../projects/presentationLibrary'

type ApiErrorResponse = {
  message?: string
  error?: {
    code?: string
    message?: string
    details?: string[]
  }
  meta?: {
    requestId?: string
  }
}

type UnknownRecord = Record<string, unknown>

export class ProjectsApiError extends Error {
  readonly code?: string
  readonly details: string[]
  readonly requestId?: string
  readonly status?: number

  constructor(
    message: string,
    options?: {
      code?: string
      details?: string[]
      requestId?: string
      status?: number
      cause?: unknown
    },
  ) {
    super(message, { cause: options?.cause })
    this.name = 'ProjectsApiError'
    this.code = options?.code
    this.details = options?.details ?? []
    this.requestId = options?.requestId
    this.status = options?.status
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getApiBaseUrl(): string | null {
  const value = import.meta.env.VITE_API_BASE_URL
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getProjectPathTemplate(): string {
  const value = import.meta.env.VITE_API_PROJECT_PATH
  if (typeof value !== 'string') {
    return '/api/v1/projects/{projectId}/editor-state'
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '/api/v1/projects/{projectId}/editor-state'
}

function getSnapshotPathTemplate(): string {
  const value = import.meta.env.VITE_API_PROJECT_SNAPSHOT_PATH
  if (typeof value !== 'string') {
    return '/api/v1/projects/{projectId}/snapshot'
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '/api/v1/projects/{projectId}/snapshot'
}

function getConfiguredProjectIds(): string[] {
  const value = import.meta.env.VITE_API_PROJECT_IDS
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function isProjectsApiEnabled(): boolean {
  return getApiBaseUrl() !== null
}

function buildEndpoint(path: string): string {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    throw new ProjectsApiError('VITE_API_BASE_URL no está configurada.')
  }

  return new URL(path, apiBaseUrl).toString()
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function fetchJson(endpoint: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(endpoint)
  } catch (error) {
    throw new ProjectsApiError('No se pudo conectar con el backend para cargar proyectos.', { cause: error })
  }

  if (!response.ok) {
    const body = await parseJsonSafely<ApiErrorResponse>(response)
    throw new ProjectsApiError(body?.error?.message ?? body?.message ?? `La API respondió ${response.status}.`, {
      code: body?.error?.code,
      details: body?.error?.details ?? [],
      requestId: body?.meta?.requestId,
      status: response.status,
    })
  }

  return parseJsonSafely<unknown>(response)
}

function getString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return fallback
}

function getOptionalString(record: UnknownRecord, keys: string[]): string | undefined {
  const value = getString(record, keys)
  return value.length > 0 ? value : undefined
}

function getNumber(record: UnknownRecord, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return fallback
}

function getOptionalNumber(record: UnknownRecord, keys: string[]): number | undefined {
  const value = getNumber(record, keys, Number.NaN)
  return Number.isFinite(value) ? value : undefined
}

function getNestedRecord(record: UnknownRecord, keys: string[]): UnknownRecord | null {
  for (const key of keys) {
    const value = record[key]
    if (isRecord(value)) {
      return value
    }
  }

  return null
}

function getNestedArray(record: UnknownRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function getResolution(record: UnknownRecord): { w: number; h: number } {
  const resolution = getNestedRecord(record, ['resolution']) ?? record
  return {
    w: getNumber(resolution, ['w', 'width'], 1920),
    h: getNumber(resolution, ['h', 'height'], 1080),
  }
}

function getTiming(record: UnknownRecord): { startTime: number; duration: number } {
  const timing = getNestedRecord(record, ['timing'])
  const startTime = getNumber(record, ['startTime', 'start'], timing ? getNumber(timing, ['start'], 0) : 0)
  const duration = getNumber(record, ['duration'], Number.NaN)

  if (Number.isFinite(duration)) {
    return { startTime, duration }
  }

  const end = timing ? getNumber(timing, ['end'], startTime + 5) : getNumber(record, ['endTime', 'end'], startTime + 5)
  return { startTime, duration: Math.max(0, end - startTime) }
}

function getPosition(record: UnknownRecord): { x: number; y: number } {
  const position = getNestedRecord(record, ['position'])
  return {
    x: getNumber(record, ['x'], position ? getNumber(position, ['x'], 0) : 0),
    y: getNumber(record, ['y'], position ? getNumber(position, ['y'], 0) : 0),
  }
}

function getExplicitStartTime(record: UnknownRecord): number | null {
  const timing = getNestedRecord(record, ['timing'])
  const startTime = getNumber(record, ['startTime', 'start'], Number.NaN)
  if (Number.isFinite(startTime)) {
    return startTime
  }

  if (timing) {
    const timingStart = getNumber(timing, ['start'], Number.NaN)
    if (Number.isFinite(timingStart)) {
      return timingStart
    }
  }

  return null
}

function getElementBase(record: UnknownRecord): {
  id: string
  name: string
  startTime: number
  duration: number
  opacity: number
  effects: []
} {
  const { startTime, duration } = getTiming(record)
  const fallbackId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `element-${crypto.randomUUID()}`
      : `element-${Date.now()}`
  const id = getString(record, ['id', '_id'], fallbackId)
  return {
    id,
    name: getString(record, ['name', 'fileName', 'content'], id),
    startTime,
    duration,
    opacity: getNumber(record, ['opacity'], 1),
    effects: [],
  }
}

function normalizeElement(raw: unknown): EditorElement | null {
  if (!isRecord(raw)) {
    return null
  }

  const type = getString(raw, ['type'])
  const base = getElementBase(raw)
  const { x, y } = getPosition(raw)

  if (type === 'text') {
    const element: TextElement = {
      ...base,
      type: 'text',
      x,
      y,
      width: getNumber(raw, ['width'], 640),
      height: getNumber(raw, ['height'], 160),
      rotation: getNumber(raw, ['rotation'], 0),
      text: getString(raw, ['text', 'content'], base.name),
      fontFamily: getString(raw, ['fontFamily'], 'Inter'),
      fontSize: getNumber(raw, ['fontSize'], 48),
      fontWeight: getNumber(raw, ['fontWeight'], 700),
      textColor: getString(raw, ['textColor'], '#ffffff'),
      backgroundColor: getString(raw, ['backgroundColor'], 'transparent'),
      lineHeight: getNumber(raw, ['lineHeight'], 1.1),
      letterSpacing: getNumber(raw, ['letterSpacing'], 0),
      textAlign: getString(raw, ['textAlign'], 'left') as TextElement['textAlign'],
    }
    return element
  }

  if (type === 'image') {
    const element: ImageElement = {
      ...base,
      type: 'image',
      x,
      y,
      width: getNumber(raw, ['width'], 640),
      height: getNumber(raw, ['height'], 360),
      rotation: getNumber(raw, ['rotation'], 0),
      source: getString(raw, ['source', 'url', 'src']),
      fit: getString(raw, ['fit'], 'cover') as ImageElement['fit'],
      borderWidth: getNumber(raw, ['borderWidth'], 0),
      borderColor: getString(raw, ['borderColor'], 'transparent'),
    }
    return element
  }

  if (type === 'video') {
    const element: VideoElement = {
      ...base,
      type: 'video',
      x,
      y,
      width: getNumber(raw, ['width'], 640),
      height: getNumber(raw, ['height'], 360),
      rotation: getNumber(raw, ['rotation'], 0),
      source: getString(raw, ['source', 'url', 'src']),
      trimStart: getNumber(raw, ['trimStart'], 0),
      trimEnd: getNumber(raw, ['trimEnd'], base.duration),
      playbackRate: getNumber(raw, ['playbackRate'], 1),
      volume: getNumber(raw, ['volume'], 1),
      muted: Boolean(raw.muted),
    }
    return element
  }

  if (type === 'audio') {
    const element: AudioElement = {
      ...base,
      type: 'audio',
      source: getString(raw, ['source', 'url', 'src']),
      playbackRate: getNumber(raw, ['playbackRate'], 1),
      volume: getNumber(raw, ['volume'], 1),
      muted: Boolean(raw.muted),
      fadeIn: getNumber(raw, ['fadeIn'], 0),
      fadeOut: getNumber(raw, ['fadeOut'], 0),
    }
    return element
  }

  if (type === 'shape') {
    const element: ShapeElement = {
      ...base,
      type: 'shape',
      x,
      y,
      width: getNumber(raw, ['width'], 1920),
      height: getNumber(raw, ['height'], 1080),
      rotation: getNumber(raw, ['rotation'], 0),
      shapeType: getString(raw, ['shapeType'], 'rectangle') as ShapeElement['shapeType'],
      fillColor: getString(raw, ['fillColor'], '#111827'),
      strokeColor: getString(raw, ['strokeColor'], 'transparent'),
      strokeWidth: getNumber(raw, ['strokeWidth'], 0),
      cornerRadius: getNumber(raw, ['cornerRadius'], 0),
    }
    return element
  }

  return null
}

function buildSnapshotPlaceholderElement(
  raw: UnknownRecord,
  trackId: string,
  startTime: number,
  index: number,
  resolution: { w: number; h: number },
): EditorElement {
  const id = getString(raw, ['id', '_id'], `snapshot-element-${trackId}-${index + 1}`)
  const duration = Math.max(0.1, getNumber(raw, ['duration'], 5))
  const name = getString(raw, ['name'], id)

  if (trackId === TEXT_TRACK_ID) {
    const element: TextElement = {
      id,
      type: 'text',
      name,
      startTime,
      duration,
      opacity: 1,
      effects: [],
      x: Math.round(resolution.w * 0.08),
      y: Math.round(resolution.h * 0.12),
      width: Math.round(resolution.w * 0.72),
      height: Math.round(resolution.h * 0.14),
      rotation: 0,
      text: name,
      fontFamily: 'Inter',
      fontSize: 64,
      fontWeight: 700,
      textColor: '#ffffff',
      backgroundColor: 'transparent',
      lineHeight: 1.1,
      letterSpacing: 0,
      textAlign: 'left',
    }
    return element
  }

  if (trackId === AUDIO_TRACK_ID) {
    const element: AudioElement = {
      id,
      type: 'audio',
      name,
      startTime,
      duration,
      opacity: 1,
      effects: [],
      source: '',
      playbackRate: 1,
      volume: 1,
      muted: true,
      fadeIn: 0,
      fadeOut: 0,
    }
    return element
  }

  const fillColors = ['#0f172a', '#172554', '#312e81', '#7f1d1d', '#134e4a']
  const element: ShapeElement = {
    id,
    type: 'shape',
    name,
    startTime,
    duration,
    opacity: 1,
    effects: [],
    x: 0,
    y: 0,
    width: resolution.w,
    height: resolution.h,
    rotation: 0,
    shapeType: 'rectangle',
    fillColor: fillColors[index % fillColors.length] ?? '#111827',
    strokeColor: 'transparent',
    strokeWidth: 0,
    cornerRadius: 0,
  }
  return element
}

function getTrackKind(trackId: string, elements: EditorElement[]): Track['kind'] {
  if (trackId === TEXT_TRACK_ID || elements.some((element) => element.type === 'text')) {
    return 'text'
  }

  if (trackId === AUDIO_TRACK_ID || elements.some((element) => element.type === 'audio')) {
    return 'audio'
  }

  return 'media'
}

function getTrackName(trackId: string, fallback: string): string {
  if (trackId === TEXT_TRACK_ID) {
    return TEXT_TRACK_NAME
  }
  if (trackId === AUDIO_TRACK_ID) {
    return AUDIO_TRACK_NAME
  }
  if (trackId === MEDIA_TRACK_ID) {
    return MEDIA_TRACK_NAME
  }
  return fallback
}

function normalizeTracks(projectRecord: UnknownRecord): Track[] {
  const rawTracks = getNestedArray(projectRecord, ['tracks'])
  if (rawTracks.length > 0) {
    const resolution = getResolution(getNestedRecord(projectRecord, ['project']) ?? projectRecord)
    return rawTracks.filter(isRecord).map((track, index) => {
      const id = getString(track, ['id', '_id'], `track-${index + 1}`)
      let cursor = 0
      const elements = getNestedArray(track, ['elements'])
        .map((rawElement, elementIndex) => {
          if (!isRecord(rawElement)) {
            return null
          }

          const explicitStartTime = getExplicitStartTime(rawElement)
          const normalizedElement = normalizeElement(rawElement)

          if (normalizedElement) {
            const nextElement =
              explicitStartTime === null
                ? { ...normalizedElement, startTime: cursor }
                : normalizedElement
            cursor = nextElement.startTime + nextElement.duration
            return nextElement
          }

          const placeholder = buildSnapshotPlaceholderElement(rawElement, id, cursor, elementIndex, resolution)
          cursor = placeholder.startTime + placeholder.duration
          return placeholder
        })
        .filter((element) => element !== null)
      return {
        id,
        name: getTrackName(id, getString(track, ['name'], `Pista ${index + 1}`)),
        kind: getTrackKind(id, elements),
        elements,
      }
    })
  }

  const elements = getNestedArray(projectRecord, ['elements'])
    .map((raw) => ({
      raw,
      trackId: isRecord(raw) ? getString(raw, ['trackId'], MEDIA_TRACK_ID) : MEDIA_TRACK_ID,
      element: normalizeElement(raw),
    }))
    .filter((entry): entry is { raw: unknown; trackId: string; element: EditorElement } => entry.element !== null)

  const grouped = new Map<string, EditorElement[]>()
  for (const entry of elements) {
    grouped.set(entry.trackId, [...(grouped.get(entry.trackId) ?? []), entry.element])
  }

  return [...grouped.entries()].map(([id, trackElements], index) => ({
    id,
    name: getTrackName(id, `Pista ${index + 1}`),
    kind: getTrackKind(id, trackElements),
    elements: trackElements.sort((a, b) => a.startTime - b.startTime),
  }))
}

function normalizeAssets(projectRecord: UnknownRecord): MediaAsset[] {
  return getNestedArray(projectRecord, ['assets'])
    .filter(isRecord)
    .map((asset) => {
      const normalized: MediaAsset = {
        id: getString(asset, ['id', '_id']),
        fileName: getString(asset, ['fileName', 'name'], 'asset'),
        type: getString(asset, ['type'], 'image') as MediaAsset['type'],
        source: getString(asset, ['source', 'url', 'src']),
      }
      const mimeType = getOptionalString(asset, ['mimeType'])
      const duration = getOptionalNumber(asset, ['duration'])
      const width = getOptionalNumber(asset, ['width'])
      const height = getOptionalNumber(asset, ['height'])

      if (mimeType) {
        normalized.mimeType = mimeType
      }
      if (duration !== undefined) {
        normalized.duration = duration
      }
      if (width !== undefined) {
        normalized.width = width
      }
      if (height !== undefined) {
        normalized.height = height
      }

      return normalized
    })
    .filter((asset) => asset.id.length > 0)
}

function getMaxTrackEnd(tracks: Track[]): number {
  return tracks
    .flatMap((track) => track.elements)
    .reduce((max, element) => Math.max(max, element.startTime + element.duration), 0)
}

function countSlides(record: UnknownRecord, tracks: Track[], duration: number): number {
  const rawSlides = getNumber(record, ['slides', 'slideCount'], Number.NaN)
  if (Number.isFinite(rawSlides) && rawSlides > 0) {
    return rawSlides
  }

  const visualStarts = new Set(
    tracks
      .flatMap((track) => track.elements)
      .filter((element) => element.type !== 'audio' && element.type !== 'transition')
      .map((element) => element.startTime),
  )

  if (visualStarts.size === 0) {
    const rawTracks = getNestedArray(record, ['tracks']).filter(isRecord)
    const textTrack = rawTracks.find((track) => getString(track, ['id', '_id']) === TEXT_TRACK_ID)
    const textElements = textTrack ? getNestedArray(textTrack, ['elements']) : []
    if (textElements.length > 0) {
      return textElements.length
    }

    const largestTrackElementCount = Math.max(
      0,
      ...rawTracks.map((track) => getNestedArray(track, ['elements']).length),
    )
    if (largestTrackElementCount > 0) {
      return largestTrackElementCount
    }
  }

  return Math.max(1, visualStarts.size || Math.ceil(duration / 8))
}

function unwrapProject(body: unknown): unknown {
  if (isRecord(body) && body.data) {
    return body.data
  }

  return body
}

async function listConfiguredProjects(projectIds: string[]): Promise<PresentationProject[]> {
  const projects = await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        return await getProjectSnapshot(projectId)
      } catch {
        return null
      }
    }),
  )

  return projects.filter((project) => project !== null)
}

function hasTrackElements(project: PresentationProject): boolean {
  return project.tracks.some((track) => track.elements.length > 0)
}

export function normalizeProject(raw: unknown): PresentationProject | null {
  if (!isRecord(raw)) {
    return null
  }

  const snapshot = getNestedRecord(raw, ['snapshot', 'projectSnapshot', 'latestSnapshot'])
  const projectMeta = getNestedRecord(raw, ['project']) ?? snapshot?.project
  const meta = isRecord(projectMeta) ? projectMeta : raw
  const id = getString(raw, ['id', '_id', 'projectId'])

  if (!id) {
    return null
  }

  const tracks = normalizeTracks(raw)
  const durationSeconds = getNumber(raw, ['durationSeconds', 'duration'], getNumber(meta, ['duration'], getMaxTrackEnd(tracks)))
  const resolution = getResolution(meta)
  const tags = getNestedArray(raw, ['tags']).filter((tag): tag is string => typeof tag === 'string')
  const collaborators = getNestedArray(raw, ['collaborators']).length

  return {
    id,
    name: getString(raw, ['name', 'projectName', 'title'], getString(meta, ['projectName'], 'Untitled Project')),
    description: getString(raw, ['description'], ''),
    owner: getString(raw, ['owner'], 'Proyecto'),
    status: 'published',
    slides: countSlides(raw, tracks, durationSeconds),
    durationSeconds,
    resolution,
    lastEditedAt: getString(
      raw,
      ['lastEditedAt', 'updatedAt', 'savedAt'],
      getString(snapshot ?? {}, ['savedAt'], new Date().toISOString()),
    ),
    collaborators,
    tags,
    thumbnail: {
      gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      title: '',
      subtitle: '',
      bullets: [],
    },
    tracks,
    assets: normalizeAssets(raw),
  }
}

export async function listProjects(): Promise<PresentationProject[]> {
  const configuredProjectIds = getConfiguredProjectIds()
  if (configuredProjectIds.length === 0) {
    throw new ProjectsApiError(
      'Para cargar la biblioteca desde project snapshots configura VITE_API_PROJECT_IDS con los IDs de proyecto que quieres comprobar.',
    )
  }

  const projects = await listConfiguredProjects(configuredProjectIds)
  if (projects.length === 0) {
    throw new ProjectsApiError('No se pudo cargar ningun project snapshot para los IDs configurados.')
  }

  return projects
}

export async function getProjectSnapshot(projectId: string): Promise<PresentationProject | null> {
  const path = getSnapshotPathTemplate().replaceAll('{projectId}', encodeURIComponent(projectId))
  const body = await fetchJson(buildEndpoint(path))
  return normalizeProject(unwrapProject(body))
}

export async function getProject(projectId: string): Promise<PresentationProject | null> {
  const path = getProjectPathTemplate().replaceAll('{projectId}', encodeURIComponent(projectId))
  const body = await fetchJson(buildEndpoint(path))
  return normalizeProject(unwrapProject(body))
}

export async function loadApiProjectIntoStore(projectId: string): Promise<boolean> {
  let project: PresentationProject | null = null

  try {
    project = await getProject(projectId)
  } catch (error) {
    console.warn('No se pudo cargar editor-state. Se intentara cargar snapshot.', error)
  }

  if (!project || !hasTrackElements(project)) {
    project = await getProjectSnapshot(projectId)
  }

  if (!project) {
    return false
  }

  loadPresentationProjectData(project)
  return true
}
