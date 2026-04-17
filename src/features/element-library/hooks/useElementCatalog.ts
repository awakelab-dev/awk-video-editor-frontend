import { useMemo, useState } from 'react'
import type { ElementLibraryCategory, ElementLibraryItem } from '../types'

const catalog: ElementLibraryItem[] = [
  { id: 'media-1', name: 'intro_final.mp4', duration: '00:45', type: 'video', category: 'media' },
  { id: 'media-2', name: 'escena_01.mp4', duration: '01:22', type: 'video', category: 'media' },
  { id: 'media-3', name: 'overlay.png', type: 'image', category: 'media' },
  { id: 'media-4', name: 'logo_marca.svg', type: 'image', category: 'media' },
  { id: 'media-5', name: 'musica_fondo.mp3', duration: '03:05', type: 'audio', category: 'audio' },
  { id: 'media-6', name: 'sfx_transicion.wav', duration: '00:12', type: 'audio', category: 'audio' },
  {
    id: 'text-1',
    name: 'Título grande',
    type: 'text',
    category: 'text',
    description: 'Titular centrado para hero',
    textPreset: 'title',
  },
  {
    id: 'text-2',
    name: 'Subtítulo',
    type: 'text',
    category: 'text',
    description: 'Texto secundario',
    textPreset: 'subtitle',
  },
  {
    id: 'text-3',
    name: 'Lower third',
    type: 'text',
    category: 'text',
    description: 'Identificador inferior',
    textPreset: 'lower-third',
  },
  {
    id: 'text-4',
    name: 'Texto básico',
    type: 'text',
    category: 'text',
    description: 'Cuerpo de párrafo estándar',
    textPreset: 'body',
  },
  { id: 'shape-1', name: 'Rectángulo', type: 'shape', category: 'shapes', description: 'Bloque sólido', shapePreset: 'rectangle' },
  { id: 'shape-2', name: 'Círculo', type: 'shape', category: 'shapes', description: 'Forma circular', shapePreset: 'ellipse' },
  {
    id: 'shape-3',
    name: 'Cuadrado',
    type: 'shape',
    category: 'shapes',
    description: 'Forma cuadrada',
    shapePreset: 'background',
  },
  { id: 'transition-1', name: 'Fade', type: 'transition', category: 'transitions', transitionPreset: 'fade', description: 'Fundido suave' },
  { id: 'transition-2', name: 'Wipe', type: 'transition', category: 'transitions', transitionPreset: 'wipe', description: 'Barrido lateral' },
  { id: 'transition-3', name: 'Slide', type: 'transition', category: 'transitions', transitionPreset: 'slide', description: 'Deslizamiento' },
  { id: 'transition-4', name: 'Dissolve', type: 'transition', category: 'transitions', transitionPreset: 'dissolve', description: 'Disolución' },
  { id: 'transition-5', name: 'Zoom', type: 'transition', category: 'transitions', transitionPreset: 'zoom', description: 'Zoom in/out' },
  { id: 'transition-6', name: 'Blur', type: 'transition', category: 'transitions', transitionPreset: 'blur', description: 'Desenfoque' },
  { id: 'transition-7', name: 'Crossfade', type: 'transition', category: 'transitions', transitionPreset: 'crossfade', description: 'Fundido cruzado' },
]

export function useElementCatalog(additionalItems: ElementLibraryItem[] = []) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ElementLibraryCategory>('media')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...additionalItems, ...catalog].filter((item) => {
      const matchesCategory = item.category === category
      const matchesQuery = q.length === 0 || item.name.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [additionalItems, category, query])

  return {
    category,
    setCategory,
    query,
    setQuery,
    items: filtered,
    total: filtered.length,
  }
}
