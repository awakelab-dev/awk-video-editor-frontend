import {
  createProjectElement,
  getProjectsApiErrorMessage,
  isElementsApiEnabled,
  persistProjectChanges,
  ProjectsApiError,
  type CreateProjectElementPayload,
} from './projectsApi'
import { useEditorStore } from '../store'

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

export { ProjectsApiError as TextElementsApiError }

export function isTextElementsApiEnabled(): boolean {
  return isElementsApiEnabled()
}

export function getCreateTextErrorMessage(error: unknown): string {
  return getProjectsApiErrorMessage(error)
}

export function getCreateElementErrorMessage(error: unknown): string {
  return getProjectsApiErrorMessage(error)
}

function stripLegacyFields(payload: CreateElementRequest): CreateProjectElementPayload {
  const { id, trackId, ...rest } = payload
  void id
  void trackId
  return rest as CreateProjectElementPayload
}

function updateRevision(projectId: string, revision: number): void {
  const currentSessionId = useEditorStore.getState().sessionId
  useEditorStore.getState().setApiSession({
    projectId,
    revision,
    sessionId: currentSessionId,
  })
}

export async function createElement(
  projectId: string,
  payload: CreateElementRequest,
): Promise<ElementResponse> {
  const created = await createProjectElement(projectId, stripLegacyFields(payload))
  updateRevision(created.projectId || projectId, created.revision)

  await persistProjectChanges([
    {
      type: 'element.add-to-track',
      trackId: payload.trackId,
      elementId: created.elementId,
      index: 0,
    },
    {
      type: 'selection.update',
      selectedElementId: created.elementId,
      selectedTrackId: payload.trackId,
      selectionSource: 'element-library',
    },
  ])

  return {
    _id: created.elementId,
    id: created.elementId,
    projectId: created.projectId || projectId,
    trackId: payload.trackId,
    type: payload.type,
    createdAt: '',
    updatedAt: '',
    revision: created.revision,
  }
}

export async function createTextElement(
  projectId: string,
  payload: CreateTextElementRequest,
): Promise<TextElementResponse> {
  const result = await createElement(projectId, payload)
  return {
    ...result,
    type: 'text',
    content: payload.text,
    position: { x: payload.x, y: payload.y },
    timing: { start: payload.startTime, end: payload.startTime + payload.duration },
  }
}
