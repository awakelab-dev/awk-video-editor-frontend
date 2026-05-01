import { AUDIO_TRACK_ID, buildDefaultTracks, MEDIA_TRACK_ID, TEXT_TRACK_ID } from '../store/defaultTracks'
import { useEditorStore } from '../store'
import type {
  AudioElement,
  EditorElement,
  ImageElement,
  MediaAsset,
  ShapeElement,
  TextElement,
  Track,
  TransitionElement,
  VideoElement,
} from '../types/editor'
import type { SelectionSource } from '../types/editor'
import type { PresentationProject } from '../projects/presentationLibrary'

const PROJECTS_PATH = '/api/v1/projects'
const CURRENT_PROJECT_STORAGE_KEY = 'currentProjectId'

export type ProjectApiSession = {
  projectId: string
  revision: number
  sessionId?: string
}

export type CreateProjectPayload = {
  name: string
  duration?: number
  resolution: {
    w: number
    h: number
  }
}

export type ApiProject = {
  projectId: string
  name: string
  duration: number
  resolution: {
    w: number
    h: number
  }
  revision: number
  sessionId?: string
  createdAt: string
  updatedAt: string
}

export type InitialEditorState = {
  projectId: string
  revision: number
  sessionId?: string
  project: {
    projectName: string
    duration: number
    resolution: {
      w: number
      h: number
    }
  }
  playback: {
    currentTime: number
    isPlaying: boolean
    zoomLevel: number
  }
  selection: {
    selectedElementId: string | null
    selectedTrackId?: string | null
    selectionSource: SelectionSource | null
  }
  assets: unknown
  tracks: unknown[]
  elements?: unknown
  updatedAt: string
}

export type CreateProjectResult = {
  project: ApiProject
  initialEditorState: InitialEditorState
}

export type ProjectChange =
  | {
      type: 'element.add-to-track'
      trackId: string
      elementId: string
      index?: number
    }
  | {
      type: 'element.update'
      elementId: string
      patch: Partial<EditorElement>
    }
  | {
      type: 'element.move'
      elementId: string
      toTrackId: string
      toIndex?: number
    }
  | {
      type: 'element.remove-from-track'
      elementId: string
      trackId: string
    }
  | {
      type: 'element.delete'
      elementId: string
    }
  | {
      type: 'track.add'
      track: {
        name: string
        type?: 'video' | 'image' | 'audio' | 'text' | 'shape' | 'mixed'
        index?: number
      }
    }
  | {
      type: 'selection.update'
      selectedElementId: string | null
      selectedTrackId?: string | null
      selectionSource: SelectionSource | null
    }

export type ProjectPatchPayload = {
  revision: number
  sessionId?: string
  changes: ProjectChange[]
}

export type ProjectPatchResult = {
  projectId: string
  revision: number
  appliedChanges: number
  updatedAt: string
}

export type CreateProjectElementPayload = Record<string, unknown> & {
  type: EditorElement['type']
  name: string
  startTime: number
  duration: number
}

export type CreateProjectElementResult = {
  projectId: string
  elementId: string
  type: EditorElement['type'] | string
  revision: number
  sessionId?: string
}

type ApiValidationError = {
  field?: string
  message?: string
}

type ApiErrorResponse = {
  message?: string
  errors?: ApiValidationError[]
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
  readonly validationErrors: ApiValidationError[]

  constructor(
    message: string,
    options?: {
      code?: string
      details?: string[]
      requestId?: string
      status?: number
      validationErrors?: ApiValidationError[]
      cause?: unknown
    },
  ) {
    super(message, { cause: options?.cause })
    this.name = 'ProjectsApiError'
    this.code = options?.code
    this.details = options?.details ?? []
    this.requestId = options?.requestId
    this.status = options?.status
    this.validationErrors = options?.validationErrors ?? []
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

export function isProjectsApiEnabled(): boolean {
  return getApiBaseUrl() !== null
}

export function isElementsApiEnabled(): boolean {
  return isProjectsApiEnabled()
}

function buildEndpoint(path: string): string {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    throw new ProjectsApiError('VITE_API_BASE_URL no esta configurada.')
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

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(buildEndpoint(path), init)
  } catch (error) {
    throw new ProjectsApiError('No se pudo conectar con el backend de proyectos.', { cause: error })
  }

  const body = await parseJsonSafely<ApiErrorResponse>(response)

  if (!response.ok) {
    const validationErrors = Array.isArray(body?.errors) ? body.errors : []
    const details = body?.error?.details ?? validationErrors.map((item) => item.message ?? '').filter(Boolean)
    throw new ProjectsApiError(body?.error?.message ?? body?.message ?? `La API respondio ${response.status}.`, {
      code: body?.error?.code,
      details,
      requestId: body?.meta?.requestId,
      status: response.status,
      validationErrors,
    })
  }

  return body
}

function unwrapData(body: unknown): unknown {
  if (isRecord(body) && 'data' in body) {
    return body.data
  }

  return body
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

function getBoolean(record: UnknownRecord, keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') {
      return value
    }
  }

  return fallback
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
    w: Math.max(1, getNumber(resolution, ['w', 'width'], 1920)),
    h: Math.max(1, getNumber(resolution, ['h', 'height'], 1080)),
  }
}

function getTiming(record: UnknownRecord): { startTime: number; duration: number } {
  const timing = getNestedRecord(record, ['timing'])
  const startTime = getNumber(record, ['startTime', 'start'], timing ? getNumber(timing, ['start'], 0) : 0)
  const duration = getNumber(record, ['duration'], Number.NaN)

  if (Number.isFinite(duration)) {
    return { startTime: Math.max(0, startTime), duration: Math.max(0, duration) }
  }

  const end = timing ? getNumber(timing, ['end'], startTime + 5) : getNumber(record, ['endTime', 'end'], startTime + 5)
  return { startTime: Math.max(0, startTime), duration: Math.max(0, end - startTime) }
}

function getPosition(record: UnknownRecord): { x: number; y: number } {
  const position = getNestedRecord(record, ['position'])
  return {
    x: getNumber(record, ['x'], position ? getNumber(position, ['x'], 0) : 0),
    y: getNumber(record, ['y'], position ? getNumber(position, ['y'], 0) : 0),
  }
}

function normalizeOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1
  }
  if (value > 1) {
    return Math.min(1, Math.max(0, value / 100))
  }
  return Math.min(1, Math.max(0, value))
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
  const id = getString(record, ['id', 'elementId', '_id'])
  return {
    id,
    name: getString(record, ['name', 'fileName', 'content', 'text'], id),
    startTime,
    duration,
    opacity: normalizeOpacity(getNumber(record, ['opacity'], 1)),
    effects: [],
  }
}

function normalizeElement(raw: unknown): EditorElement | null {
  if (!isRecord(raw)) {
    return null
  }

  const type = getString(raw, ['type'])
  const base = getElementBase(raw)
  if (!base.id) {
    return null
  }

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
      muted: getBoolean(raw, ['muted'], false),
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
      muted: getBoolean(raw, ['muted'], false),
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

  if (type === 'transition') {
    const element: TransitionElement = {
      ...base,
      type: 'transition',
      transitionType: getString(raw, ['transitionType'], 'fade') as TransitionElement['transitionType'],
    }
    return element
  }

  return null
}

function getElementMap(projectRecord: UnknownRecord): UnknownRecord {
  const elements = projectRecord.elements
  if (isRecord(elements)) {
    return elements
  }

  if (Array.isArray(elements)) {
    return elements.filter(isRecord).reduce<UnknownRecord>((accumulator, element) => {
      const id = getString(element, ['id', 'elementId', '_id'])
      if (id) {
        accumulator[id] = element
      }
      return accumulator
    }, {})
  }

  return {}
}

function getTrackKind(trackId: string, elements: EditorElement[], rawTrack: UnknownRecord): Track['kind'] {
  const kind = getString(rawTrack, ['kind'])
  if (kind === 'text' || kind === 'audio' || kind === 'media') {
    return kind
  }

  const type = getString(rawTrack, ['type'])
  if (type === 'text' || type === 'audio') {
    return type
  }

  if (type === 'video' || type === 'image' || type === 'shape' || type === 'mixed') {
    return 'media'
  }

  if (trackId === TEXT_TRACK_ID || elements.some((element) => element.type === 'text')) {
    return 'text'
  }

  if (trackId === AUDIO_TRACK_ID || elements.some((element) => element.type === 'audio')) {
    return 'audio'
  }

  if (trackId === MEDIA_TRACK_ID) {
    return 'media'
  }

  return 'media'
}

function normalizeTrackElements(track: UnknownRecord, projectElements: UnknownRecord): EditorElement[] {
  const embeddedElements = getNestedArray(track, ['elements'])
  if (embeddedElements.length > 0) {
    return embeddedElements
      .map(normalizeElement)
      .filter((element): element is EditorElement => element !== null)
      .sort((a, b) => a.startTime - b.startTime)
  }

  const elementIds = getNestedArray(track, ['elementIds']).filter((elementId): elementId is string => typeof elementId === 'string')
  return elementIds
    .map((elementId) => normalizeElement(projectElements[elementId]))
    .filter((element): element is EditorElement => element !== null)
    .sort((a, b) => a.startTime - b.startTime)
}

function normalizeTracks(projectRecord: UnknownRecord): Track[] {
  const rawTracks = getNestedArray(projectRecord, ['tracks'])
  if (rawTracks.length === 0) {
    return buildDefaultTracks()
  }

  const projectElements = getElementMap(projectRecord)
  const tracks = rawTracks.filter(isRecord).map((track, index) => {
    const id = getString(track, ['id', 'trackId', '_id'], `track-${index + 1}`)
    const elements = normalizeTrackElements(track, projectElements)

    return {
      id,
      name: getString(track, ['name'], `Pista ${index + 1}`),
      kind: getTrackKind(id, elements, track),
      elements,
    }
  })

  if (tracks.length === 0) {
    return buildDefaultTracks()
  }

  const existingTrackIds = new Set(tracks.map((track) => track.id))
  return [...tracks, ...buildDefaultTracks().filter((track) => !existingTrackIds.has(track.id))]
}

function getAssetRecords(projectRecord: UnknownRecord): UnknownRecord[] {
  const assets = projectRecord.assets
  if (Array.isArray(assets)) {
    return assets.filter(isRecord)
  }

  if (isRecord(assets)) {
    return Object.entries(assets).flatMap(([assetId, asset]) => {
      if (!isRecord(asset)) {
        return []
      }

      return [{ id: assetId, ...asset }]
    })
  }

  return []
}

function normalizeAssets(projectRecord: UnknownRecord): MediaAsset[] {
  return getAssetRecords(projectRecord)
    .map((asset) => {
      const normalized: MediaAsset = {
        id: getString(asset, ['id', 'assetId', '_id']),
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

function isSelectionSource(value: unknown): value is SelectionSource {
  return value === 'canvas' || value === 'timeline' || value === 'element-library'
}

function normalizeApiProject(raw: unknown): ApiProject | null {
  if (!isRecord(raw)) {
    return null
  }

  const projectId = getString(raw, ['projectId', 'id', '_id'])
  if (!projectId) {
    return null
  }

  return {
    projectId,
    name: getString(raw, ['name', 'projectName', 'title'], 'Untitled Project'),
    duration: Math.max(0, getNumber(raw, ['duration', 'durationSeconds'], 0)),
    resolution: getResolution(raw),
    revision: Math.max(0, getNumber(raw, ['revision'], 0)),
    sessionId: getOptionalString(raw, ['sessionId']),
    createdAt: getString(raw, ['createdAt'], new Date().toISOString()),
    updatedAt: getString(raw, ['updatedAt'], new Date().toISOString()),
  }
}

function hasTrackData(raw: unknown): raw is UnknownRecord {
  return isRecord(raw) && Array.isArray(raw.tracks)
}

function normalizeProjectSummary(raw: unknown): PresentationProject | null {
  const project = normalizeApiProject(raw)
  if (!project) {
    return null
  }

  return {
    id: project.projectId,
    name: project.name,
    description: '',
    owner: 'Proyecto',
    status: 'draft',
    slides: project.duration > 0 ? Math.max(1, Math.ceil(project.duration / 8)) : 0,
    durationSeconds: project.duration,
    resolution: { ...project.resolution },
    lastEditedAt: project.updatedAt || project.createdAt,
    collaborators: 0,
    tags: [],
    thumbnail: {
      gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      title: '',
      subtitle: '',
      bullets: [],
    },
    tracks: hasTrackData(raw) ? normalizeTracks(raw) : [],
    assets: isRecord(raw) ? normalizeAssets(raw) : [],
  }
}

function normalizeInitialEditorState(raw: unknown): InitialEditorState {
  if (!isRecord(raw)) {
    throw new ProjectsApiError('La API no devolvio un proyecto valido.')
  }

  const project = getNestedRecord(raw, ['project'])
  const playback = getNestedRecord(raw, ['playback']) ?? {}
  const selection = getNestedRecord(raw, ['selection']) ?? {}
  const selectedElementId = selection.selectedElementId
  const selectedTrackId = selection.selectedTrackId
  const selectionSource = selection.selectionSource

  return {
    projectId: getString(raw, ['projectId', 'id', '_id']),
    revision: Math.max(0, getNumber(raw, ['revision'], 0)),
    sessionId: getOptionalString(raw, ['sessionId']),
    project: {
      projectName: project
        ? getString(project, ['projectName', 'name'], 'Untitled Project')
        : getString(raw, ['name', 'projectName'], 'Untitled Project'),
      duration: Math.max(0, project ? getNumber(project, ['duration'], 0) : getNumber(raw, ['duration'], 0)),
      resolution: getResolution(project ?? raw),
    },
    playback: {
      currentTime: Math.max(0, getNumber(playback, ['currentTime'], 0)),
      isPlaying: getBoolean(playback, ['isPlaying'], false),
      zoomLevel: Math.max(1, getNumber(playback, ['zoomLevel'], 100)),
    },
    selection: {
      selectedElementId: typeof selectedElementId === 'string' ? selectedElementId : null,
      selectedTrackId: typeof selectedTrackId === 'string' ? selectedTrackId : null,
      selectionSource: isSelectionSource(selectionSource) ? selectionSource : null,
    },
    assets: raw.assets ?? [],
    tracks: getNestedArray(raw, ['tracks']),
    elements: raw.elements,
    updatedAt: getString(raw, ['updatedAt'], new Date().toISOString()),
  }
}

function persistCurrentProjectId(projectId: string): void {
  try {
    localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, projectId)
  } catch {
    // localStorage can be unavailable in private contexts; the store still has the project id.
  }
}

function updateApiSession(session: ProjectApiSession): void {
  useEditorStore.getState().setApiSession(session)
  if (session.projectId) {
    persistCurrentProjectId(session.projectId)
  }
}

export function loadInitialEditorStateIntoStore(editorState: InitialEditorState): void {
  const stateRecord: UnknownRecord = {
    assets: editorState.assets,
    tracks: editorState.tracks,
    elements: editorState.elements,
  }

  useEditorStore.setState({
    projectId: editorState.projectId,
    projectName: editorState.project.projectName,
    duration: editorState.project.duration,
    resolution: { ...editorState.project.resolution },
    revision: editorState.revision,
    sessionId: editorState.sessionId,
    currentTime: editorState.playback.currentTime,
    isPlaying: editorState.playback.isPlaying,
    zoomLevel: editorState.playback.zoomLevel,
    selectedElementId: editorState.selection.selectedElementId,
    selectedTrackId: editorState.selection.selectedTrackId ?? null,
    selectionSource: editorState.selection.selectionSource,
    assets: normalizeAssets(stateRecord),
    tracks: normalizeTracks(stateRecord),
  })

  if (editorState.projectId) {
    persistCurrentProjectId(editorState.projectId)
  }
}

export async function listProjects(): Promise<PresentationProject[]> {
  const body = await fetchJson(PROJECTS_PATH)
  const data = unwrapData(body)
  const projects = isRecord(data) && Array.isArray(data.projects) ? data.projects : data

  if (!Array.isArray(projects)) {
    throw new ProjectsApiError('La API no devolvio una lista de proyectos valida.')
  }

  return projects
    .map(normalizeProjectSummary)
    .filter((project): project is PresentationProject => project !== null)
}

export async function getProject(projectId: string): Promise<ApiProject | null> {
  const body = await fetchJson(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}`)
  return normalizeApiProject(unwrapData(body))
}

export async function getProjectEditorState(projectId: string): Promise<InitialEditorState> {
  const body = await fetchJson(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}`)
  const editorState = normalizeInitialEditorState(unwrapData(body))
  return {
    ...editorState,
    projectId: editorState.projectId || projectId,
  }
}

export async function createProject(payload: CreateProjectPayload): Promise<CreateProjectResult> {
  const body = await fetchJson(PROJECTS_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = unwrapData(body)

  if (!isRecord(data)) {
    throw new ProjectsApiError('La API no devolvio el proyecto creado.')
  }

  const rawProject = isRecord(data.project) ? data.project : data
  const project = normalizeApiProject(rawProject)
  if (!project) {
    throw new ProjectsApiError('La API no devolvio metadatos validos para el proyecto creado.')
  }

  const initialEditorState = isRecord(data.initialEditorState)
    ? normalizeInitialEditorState(data.initialEditorState)
    : normalizeInitialEditorState(rawProject)

  return {
    project,
    initialEditorState: {
      ...initialEditorState,
      projectId: initialEditorState.projectId || project.projectId,
      revision: initialEditorState.revision || project.revision,
      sessionId: initialEditorState.sessionId ?? project.sessionId,
    },
  }
}

export async function createProjectAndLoadIntoStore(payload: CreateProjectPayload): Promise<ApiProject> {
  const { project, initialEditorState } = await createProject(payload)
  loadInitialEditorStateIntoStore(initialEditorState)
  updateApiSession({
    projectId: project.projectId,
    revision: project.revision,
    sessionId: project.sessionId,
  })
  return project
}

export async function loadApiProjectIntoStore(projectId: string): Promise<boolean> {
  const editorState = await getProjectEditorState(projectId)
  loadInitialEditorStateIntoStore(editorState)
  updateApiSession({
    projectId: editorState.projectId || projectId,
    revision: editorState.revision,
    sessionId: editorState.sessionId,
  })
  return true
}

function normalizePatchResult(raw: unknown): ProjectPatchResult {
  if (!isRecord(raw)) {
    throw new ProjectsApiError('La API no devolvio el resultado del patch.')
  }

  return {
    projectId: getString(raw, ['projectId']),
    revision: Math.max(0, getNumber(raw, ['revision'], 0)),
    appliedChanges: Math.max(0, getNumber(raw, ['appliedChanges'], 0)),
    updatedAt: getString(raw, ['updatedAt'], new Date().toISOString()),
  }
}

export async function patchProject(projectId: string, payload: ProjectPatchPayload): Promise<ProjectPatchResult> {
  const body = await fetchJson(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return normalizePatchResult(unwrapData(body))
}

export async function persistProjectChanges(changes: ProjectChange[]): Promise<ProjectPatchResult | null> {
  if (changes.length === 0 || !isProjectsApiEnabled()) {
    return null
  }

  const { projectId, revision, sessionId } = useEditorStore.getState()
  if (!projectId) {
    return null
  }

  const makePayload = (nextRevision: number, nextSessionId?: string): ProjectPatchPayload => ({
    revision: nextRevision,
    sessionId: nextSessionId,
    changes,
  })

  try {
    const result = await patchProject(projectId, makePayload(revision, sessionId))
    updateApiSession({ projectId, revision: result.revision, sessionId })
    return result
  } catch (error) {
    if (!(error instanceof ProjectsApiError) || error.status !== 409) {
      throw error
    }
  }

  await loadApiProjectIntoStore(projectId)
  const latestSession = useEditorStore.getState()
  const result = await patchProject(
    latestSession.projectId,
    makePayload(latestSession.revision, latestSession.sessionId),
  )
  updateApiSession({
    projectId: latestSession.projectId,
    revision: result.revision,
    sessionId: latestSession.sessionId,
  })
  return result
}

function sanitizeElementPayload(payload: CreateProjectElementPayload): CreateProjectElementPayload {
  const { id: _id, _id: legacyId, projectId, trackId, effects, ...rest } = payload
  void _id
  void legacyId
  void projectId
  void trackId
  void effects
  return rest as CreateProjectElementPayload
}

function normalizeCreateElementResult(raw: unknown, fallbackProjectId: string): CreateProjectElementResult {
  if (!isRecord(raw)) {
    throw new ProjectsApiError('La API no devolvio el elemento creado.')
  }

  const elementId = getString(raw, ['elementId', 'id', '_id'])
  if (!elementId) {
    throw new ProjectsApiError('La API no devolvio el id del elemento creado.')
  }

  return {
    projectId: getString(raw, ['projectId'], fallbackProjectId),
    elementId,
    type: getString(raw, ['type']),
    revision: Math.max(0, getNumber(raw, ['revision'], useEditorStore.getState().revision)),
    sessionId: getOptionalString(raw, ['sessionId']),
  }
}

export async function createProjectElement(
  projectId: string,
  payload: CreateProjectElementPayload,
): Promise<CreateProjectElementResult> {
  const body = await fetchJson(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}/elements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sanitizeElementPayload(payload)),
  })

  return normalizeCreateElementResult(unwrapData(body), projectId)
}

function toApiOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) {
    return 100
  }
  return Math.round(Math.min(1, Math.max(0, opacity)) * 100)
}

export function toCreateProjectElementPayload(element: EditorElement): CreateProjectElementPayload {
  const { id: _id, effects, ...payload } = element
  void _id
  void effects
  return {
    ...payload,
    opacity: toApiOpacity(element.opacity),
  } as CreateProjectElementPayload
}

export async function createElementInProjectTrack(
  projectId: string,
  trackId: string,
  element: EditorElement,
  selectionSource: SelectionSource = 'element-library',
): Promise<EditorElement> {
  const created = await createProjectElement(projectId, toCreateProjectElementPayload(element))
  updateApiSession({
    projectId: created.projectId || projectId,
    revision: created.revision,
    sessionId: created.sessionId ?? useEditorStore.getState().sessionId,
  })

  await persistProjectChanges([
    {
      type: 'element.add-to-track',
      trackId,
      elementId: created.elementId,
      index: 0,
    },
    {
      type: 'selection.update',
      selectedElementId: created.elementId,
      selectedTrackId: trackId,
      selectionSource,
    },
  ])

  return {
    ...element,
    id: created.elementId,
  }
}

export function getProjectsApiErrorMessage(error: unknown): string {
  if (error instanceof ProjectsApiError) {
    if (error.details.length > 0) {
      return `${error.message}: ${error.details.join(', ')}`
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Error desconocido al comunicarse con la API.'
}
