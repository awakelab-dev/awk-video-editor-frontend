export type SelectionSource = 'canvas' | 'timeline' | 'element-library'

export const EFFECT_PRESETS = ['blur', 'grayscale', 'sepia', 'vignette', 'glow'] as const
export type EditorEffect = (typeof EFFECT_PRESETS)[number]

export const TRANSITION_PRESETS = ['fade', 'wipe', 'slide', 'dissolve', 'zoom', 'blur', 'crossfade'] as const
export type TransitionPreset = (typeof TRANSITION_PRESETS)[number]

type TimedElementBase = {
  id: string
  name: string
  startTime: number
  duration: number
  opacity: number
  effects: EditorEffect[]
}

type VisualElementBase = TimedElementBase & {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export type VideoElement = VisualElementBase & {
  type: 'video'
  source: string
  trimStart: number
  trimEnd: number
  playbackRate: number
  volume: number
  muted: boolean
}

export type ImageElement = VisualElementBase & {
  type: 'image'
  source: string
  fit: 'cover' | 'contain' | 'fill'
  borderWidth: number
  borderColor: string
}

export type AudioElement = TimedElementBase & {
  type: 'audio'
  source: string
  playbackRate: number
  volume: number
  muted: boolean
  fadeIn: number
  fadeOut: number
}

export type TextElement = VisualElementBase & {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  textColor: string
  backgroundColor: string
  lineHeight: number
  letterSpacing: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
}

export type ShapeElement = VisualElementBase & {
  type: 'shape'
  shapeType: 'rectangle' | 'ellipse' | 'line' | 'triangle' | 'polygon'
  fillColor: string
  strokeColor: string
  strokeWidth: number
  cornerRadius: number
}

export type TransitionElement = TimedElementBase & {
  type: 'transition'
  transitionType: TransitionPreset
}

export type ElementType =
  | VideoElement
  | ImageElement
  | AudioElement
  | TextElement
  | ShapeElement
  | TransitionElement

export type EditorElement = ElementType

export type ElementKind = EditorElement['type']
export type MediaElement = VideoElement | ImageElement | AudioElement
export type MediaAssetType = MediaElement['type']

export interface Track {
  id: string
  name: string
  kind?: 'text' | 'audio' | 'media'
  elements: EditorElement[]
}

export interface MediaAsset {
  id: string
  fileName: string
  type: MediaAssetType
  source: string
  mimeType?: string
  duration?: number
  width?: number
  height?: number
}

