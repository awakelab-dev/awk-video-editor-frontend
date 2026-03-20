export type ElementType = 'video' | 'image' | 'audio' | 'text' | 'shape'

export type SelectionSource = 'canvas' | 'timeline' | 'element-library' | null

export interface EditorElement {
  id: string
  type: ElementType
  name: string
  startTime: number
  duration: number
}

export interface Track {
  id: string
  name: string
  elements: EditorElement[]
}

export interface MediaAsset {
  id: string
  fileName: string
  type: Extract<ElementType, 'video' | 'image' | 'audio'>
}
