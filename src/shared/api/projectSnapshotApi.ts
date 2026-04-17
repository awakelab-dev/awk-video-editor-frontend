import type { SelectionSource } from '../types/editor'

export type ProjectSnapshotPayload = {
  snapshotVersion: number
  savedAt: string
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
    selectionSource: SelectionSource | null
  }
  assets: Array<{
    id: string
    duration: number | null
  }>
  tracks: Array<{
    id: string
    duration: number
    elements: Array<{
      id: string
      duration: number
    }>
  }>
}

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

export class ProjectSnapshotApiError extends Error {
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
    this.name = 'ProjectSnapshotApiError'
    this.code = options?.code
    this.details = options?.details ?? []
    this.requestId = options?.requestId
    this.status = options?.status
  }
}

function getApiBaseUrl(): string | null {
  const value = import.meta.env.VITE_API_BASE_URL
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getSnapshotPathTemplate(): string {
  const value = import.meta.env.VITE_API_PROJECT_SNAPSHOT_PATH
  if (typeof value !== 'string') {
    return '/api/v1/projects/{projectId}/snapshot'
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '/api/v1/projects/{projectId}/snapshot'
}

function getSnapshotMethod(): 'POST' | 'PUT' | 'PATCH' {
  const value = import.meta.env.VITE_API_PROJECT_SNAPSHOT_METHOD
  if (typeof value !== 'string') {
    return 'PUT'
  }

  const normalized = value.trim().toUpperCase()
  if (normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH') {
    return normalized
  }

  return 'PUT'
}

export function isProjectSnapshotApiEnabled(): boolean {
  return getApiBaseUrl() !== null
}

function buildProjectSnapshotEndpoint(projectId: string): string {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    throw new ProjectSnapshotApiError(
      'VITE_API_BASE_URL no está configurada. Define la URL del backend para persistir el snapshot.',
    )
  }

  const pathTemplate = getSnapshotPathTemplate()
  const path = pathTemplate.replaceAll('{projectId}', encodeURIComponent(projectId))

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

export async function saveProjectSnapshot(projectId: string, payload: ProjectSnapshotPayload): Promise<void> {
  const endpoint = buildProjectSnapshotEndpoint(projectId)
  const method = getSnapshotMethod()

  let response: Response
  try {
    response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new ProjectSnapshotApiError('No se pudo conectar con el backend para guardar el snapshot.', { cause: error })
  }

  if (!response.ok) {
    const body = await parseJsonSafely<ApiErrorResponse>(response)
    throw new ProjectSnapshotApiError(body?.error?.message ?? body?.message ?? `La API respondió ${response.status}.`, {
      code: body?.error?.code,
      details: body?.error?.details ?? [],
      requestId: body?.meta?.requestId,
      status: response.status,
    })
  }
}
