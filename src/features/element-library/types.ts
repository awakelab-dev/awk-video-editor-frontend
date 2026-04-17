export type ElementLibraryCategory = 'media' | 'text' | 'shapes' | 'audio' | 'transitions'

export type TextPreset = 'title' | 'subtitle' | 'lower-third' | 'body'
export type ShapePreset = 'rectangle' | 'ellipse' | 'background'
export type TransitionPreset = 'fade' | 'wipe' | 'slide' | 'dissolve' | 'zoom' | 'blur' | 'crossfade'

export type ElementLibraryItemType = 'video' | 'image' | 'audio' | 'text' | 'shape' | 'transition'

export interface ElementLibraryItem {
  id: string
  type: ElementLibraryItemType
  category: ElementLibraryCategory
  name: string
  duration?: string
  thumbnail?: string
  description?: string
  textPreset?: TextPreset
  shapePreset?: ShapePreset
  transitionPreset?: TransitionPreset
  /** Base64 preview image for imported files */
  preview?: string
}
