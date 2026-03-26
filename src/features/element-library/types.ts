export type ElementLibraryCategory = 'media' | 'text' | 'shapes' | 'audio' | 'transitions'

export type ElementLibraryItemType = 'video' | 'image' | 'audio' | 'text' | 'shape' | 'transition'

export interface ElementLibraryItem {
  id: string
  type: ElementLibraryItemType
  category: ElementLibraryCategory
  name: string
  duration?: string
  thumbnail?: string
  description?: string
}
