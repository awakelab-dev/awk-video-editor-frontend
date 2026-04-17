export type CreateTextElementRequest = {
  id: string
  type: 'text'
  name: string
  startTime: number
  duration: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  textColor: string
  backgroundColor: string
  lineHeight: number
  letterSpacing: number
  textAlign: string
  trackId: string
}

export type CreateVideoElementRequest = {
  id: string
  type: 'video'
  name: string
  startTime: number
  duration: number
  opacity?: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  source: string
  trimStart: number
  trimEnd: number
  playbackRate: number
  volume: number
  muted: boolean
  trackId: string
}

export type CreateImageElementRequest = {
  id: string
  type: 'image'
  name: string
  startTime: number
  duration: number
  opacity?: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  source: string
  fit: string
  trackId: string
}

export type CreateAudioElementRequest = {
  id: string
  type: 'audio'
  name: string
  startTime: number
  duration: number
  opacity?: number
  source: string
  playbackRate: number
  volume: number
  muted: boolean
  fadeIn: number
  fadeOut: number
  trackId: string
}

export type CreateShapeElementRequest = {
  id: string
  type: 'shape'
  name: string
  startTime: number
  duration: number
  opacity?: number
  x: number
  y: number
  trackId: string
}

export type CreateElementRequest =
  | CreateTextElementRequest
  | CreateVideoElementRequest
  | CreateImageElementRequest
  | CreateAudioElementRequest
  | CreateShapeElementRequest

export type TextElementResponse = {
  _id: string
  projectId: string
  type: 'text'
  content: string
  position: { x: number; y: number }
  timing: { start: number; end: number }
  trackId: string
  createdAt: string
  updatedAt: string
}

export type ElementResponse = {
  _id: string
  projectId: string
  trackId: string
  id?: string
  type: 'text' | 'video' | 'image' | 'audio' | 'shape'
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

type ApiSuccessResponse<T> = {
  data: T
  meta?: {
    requestId?: string
    timestamp?: string
  }
}

type ApiErrorResponse = {
  error?: {
    code?: string
    message?: string
    details?: string[]
  }
  meta?: {
    requestId?: string
  }
}

export class TextElementsApiError extends Error {
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
    this.name = 'TextElementsApiError'
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

export function isTextElementsApiEnabled(): boolean {
  return getApiBaseUrl() !== null
}

export function isElementsApiEnabled(): boolean {
  return isTextElementsApiEnabled()
}

function buildCreateElementEndpoint(projectId: string, trackId: string): string {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    throw new TextElementsApiError(
      'VITE_API_BASE_URL no está configurada. Define la URL del backend para persistir elementos.',
    )
  }

  const endpoint = new URL(`/api/v1/projects/${encodeURIComponent(projectId)}/elements`, apiBaseUrl)
  endpoint.searchParams.set('trackId', trackId)
  return endpoint.toString()
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

export function getCreateTextErrorMessage(error: unknown): string {
  if (error instanceof TextElementsApiError) {
    if (error.details.length > 0) {
      return `${error.message}: ${error.details.join(', ')}`
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Error desconocido al crear el texto.'
}

export function getCreateElementErrorMessage(error: unknown): string {
  return getCreateTextErrorMessage(error)
}

export async function createElement(
  projectId: string,
  payload: CreateElementRequest,
): Promise<ElementResponse> {
  const endpoint = buildCreateElementEndpoint(projectId, payload.trackId)

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new TextElementsApiError('No se pudo conectar con el backend.', { cause: error })
  }

  if (!response.ok) {
    const body = await parseJsonSafely<ApiErrorResponse>(response)
    throw new TextElementsApiError(body?.error?.message ?? `La API respondió ${response.status}.`, {
      code: body?.error?.code,
      details: body?.error?.details ?? [],
      requestId: body?.meta?.requestId,
      status: response.status,
    })
  }

  const body = await parseJsonSafely<ApiSuccessResponse<ElementResponse>>(response)
  if (!body?.data) {
    throw new TextElementsApiError('La API devolvió una respuesta sin `data` para el elemento creado.', {
      status: response.status,
      requestId: body?.meta?.requestId,
    })
  }

  return body.data
}

export async function createTextElement(
  projectId: string,
  payload: CreateTextElementRequest,
): Promise<TextElementResponse> {
  const result = await createElement(projectId, payload)
  return result as TextElementResponse
}
