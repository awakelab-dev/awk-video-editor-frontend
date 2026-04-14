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

function buildCreateTextEndpoint(projectId: string): string {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    throw new TextElementsApiError(
      'VITE_API_BASE_URL no está configurada. Define la URL del backend para persistir textos.',
    )
  }

  return new URL(`/api/v1/projects/${encodeURIComponent(projectId)}/elements`, apiBaseUrl).toString()
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

export async function createTextElement(
  projectId: string,
  payload: CreateTextElementRequest,
): Promise<TextElementResponse> {
  const endpoint = buildCreateTextEndpoint(projectId)

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

  const body = await parseJsonSafely<ApiSuccessResponse<TextElementResponse>>(response)
  if (!body?.data) {
    throw new TextElementsApiError('La API devolvió una respuesta sin `data` para el texto creado.', {
      status: response.status,
      requestId: body?.meta?.requestId,
    })
  }

  return body.data
}
