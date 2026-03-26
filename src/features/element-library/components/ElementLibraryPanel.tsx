import { Film, Image, Layers3, Music2, Search, Type, Upload, Zap } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useAddElement } from '../hooks/useAddElement'
import { useElementCatalog } from '../hooks/useElementCatalog'
import { useInstrumentation } from '../hooks/useInstrumentation'
import { useAddTextElement } from '../hooks/useAddTextElement'
import type { ElementLibraryCategory, ElementLibraryItem, ElementLibraryItemType } from '../types'
import type { MediaAsset } from '../../../shared/types/editor'
import { useEditorStore } from '../../../shared/store'

const cardByType: Record<ElementLibraryItemType, string> = {
  video: 'bg-gradient-to-br from-[#1e1e30] to-[#2a2a40] text-[#818cf8]',
  image: 'bg-gradient-to-br from-[#1e2a1e] to-[#2a3a2a] text-[#22c55e]',
  audio: 'bg-gradient-to-br from-[#1a2e28] to-[#203830] text-[#4ade80]',
  text: 'bg-gradient-to-br from-[#1e1a2e] to-[#2a2440] text-[#c084fc]',
  shape: 'bg-gradient-to-br from-[#1a202e] to-[#22344a] text-[#38bdf8]',
  transition: 'bg-gradient-to-br from-[#2a1e1e] to-[#3a2a2a] text-[#f59e0b]',
}

const tabs: { id: ElementLibraryCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'media', label: 'Media', icon: Film },
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'shapes', label: 'Formas', icon: Layers3 },
  { id: 'audio', label: 'Audio', icon: Music2 },
  { id: 'transitions', label: 'Transiciones', icon: Zap },
]

function ResourceGlyph({ type }: { type: ElementLibraryItemType }) {
  if (type === 'audio') return <Music2 className="h-[18px] w-[18px]" />
  if (type === 'image') return <Image className="h-[18px] w-[18px]" />
  if (type === 'text') return <Type className="h-[18px] w-[18px]" />
  if (type === 'shape') return <Layers3 className="h-[18px] w-[18px]" />
  if (type === 'transition') return <Zap className="h-[18px] w-[18px]" />
  return <Film className="h-[18px] w-[18px]" />
}
export function ElementLibraryPanel() {
  const [uploadedItems, setUploadedItems] = useState<ElementLibraryItem[]>([])
  const { items, category, setCategory, query, setQuery, total } = useElementCatalog(uploadedItems)
  const addElement = useAddElement()
  const addTextElement = useAddTextElement()
  const { trackEvent } = useInstrumentation()
  const [feedback, setFeedback] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const importAsset = useEditorStore((state) => state.importAsset)
  const selectedElementId = useEditorStore((state) => state.selectedElementId)

  function handleAddText() {
    trackEvent('text_add_clicked', { source: 'element-library' })
    const element = addTextElement()
    console.log('[ElementLibrary] text element workflow', {
      actions: ['trackEvent(text_add_clicked)', 'addTextElement()', 'setFeedback()', 'clearFeedback(timeout)'],
      element,
    })
    const textItem: ElementLibraryItem = {
      id: element.id,
      type: 'text',
      category: 'text',
      name: element.name,
      description: 'Texto creado desde la biblioteca',
    }
    setUploadedItems((prev) => [textItem, ...prev.filter((item) => item.id !== element.id)])
    setFeedback(`Texto añadido (${element.name})`)
    window.setTimeout(() => setFeedback(null), 2000)
  }
  const emptyStateLabel = useMemo(() => {
    if (query.trim().length > 0) return 'Sin resultados para la búsqueda.'
    return 'No hay elementos en esta categoría aún.'
  }, [query])


  return (
    <aside className="row-start-1 min-h-0 border-r border-[#2a2a34] bg-[#1a1a20]">
      <div className="flex h-full min-h-0 flex-col">
        <nav className="flex border-b border-[#2a2a34]" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === category
            return (
              <button
                aria-selected={isActive}
                className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-1 pb-2 pt-2.5 text-[10px] font-medium transition ${
                  isActive
                    ? 'border-[#6366f1] text-[#6366f1]'
                    : 'border-transparent text-[#6b7280] hover:bg-white/[0.02] hover:text-[#9ca3af]'
                }`}
                key={tab.id}
                role="tab"
                type="button"
                onClick={() => {
                  console.log('[ElementLibrary] change category ->', tab.id)
                  setCategory(tab.id)
                }}
              >
                <Icon className="h-[15px] w-[15px] max-[1024px]:h-[18px] max-[1024px]:w-[18px]" />
                <span className="max-[1024px]:hidden">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <label className="flex items-center gap-2 border-b border-[#2a2a34] px-3 py-2 text-[#6b7280]">
          <Search className="h-[15px] w-[15px]" />
          <input
            className="w-full bg-transparent text-xs text-[#f0f0f4] outline-none placeholder:text-[#6b7280]"
            placeholder="Buscar recursos..."
            type="search"
            value={query}
            onChange={(e) => {
              console.log('[ElementLibrary] search ->', e.target.value)
              setQuery(e.target.value)
            }}
          />
        </label>

        {category === 'text' && (
          <div className="border-b border-[#2a2a34] bg-[#1c1c25] px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-white">Añadir texto</p>
                <p className="text-[10px] text-[#9ca3af]">Crea títulos y subtítulos en cualquier momento.</p>
              </div>
              <button
                className="rounded-[6px] bg-[#4c1d95] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#5b21b6]"
                onClick={handleAddText}
                type="button"
              >
                + Texto
              </button>
            </div>
            {feedback && (
              <p className="pt-2 text-[10px] text-[#c4b5fd]" role="status">
                {feedback}
              </p>
            )}
          </div>
        )}


        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#2a2a34] bg-[#1e1e24] text-xs text-[#6b7280]">
              {emptyStateLabel}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-[1024px]:grid-cols-1">
              {items.map((item) => {
                const isSelected = item.id === selectedElementId
                return (
                <article
                  className={`group cursor-pointer rounded-[8px] border border-transparent p-1 transition hover:-translate-y-0.5 ${
                    isSelected ? 'border-[#6366f1] bg-[#1f1f2d]' : ''
                  }`}
                  key={item.id}
                  aria-current={isSelected}
                  onClick={() => {
                    console.log('[ElementLibrary] add element ->', item)
                    addElement(item)
                  }}
                >
                  <div
                    className={`relative flex aspect-[16/10] items-center justify-center rounded-[6px] border transition group-hover:border-[#6366f1] ${
                      isSelected ? 'border-[#6366f1]' : 'border-[#2a2a34]'
                    } ${cardByType[item.type]}`}
                  >
                    <ResourceGlyph type={item.type} />
                    {isSelected && (
                      <span className="absolute left-1.5 top-1.5 rounded-[4px] bg-[#6366f1] px-1.5 py-px text-[9px] font-semibold text-white">
                        Seleccionado
                      </span>
                    )}
                    {item.duration && (
                      <span className="absolute bottom-1 right-1 rounded-[3px] bg-black/70 px-1.5 py-px text-[9px] font-semibold text-white">
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <div className="px-0.5 pt-1.5">
                    <p className="truncate text-[11px] text-[#e5e7eb]">{item.name}</p>
                    {item.description && <p className="truncate text-[10px] text-[#6b7280]">{item.description}</p>}
                  </div>
                </article>
                )
              })}
            </div>
          )}
        </div>

        {(category === 'media' || category === 'audio') && (
          <>
            <button
              className="mx-3 mb-3 mt-2 inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-[#35353f] bg-[#25252e] px-3 py-2 text-xs font-medium text-[#9ca3af] transition hover:border-[#6366f1] hover:bg-[#6366f1]/[0.12] hover:text-[#6366f1]"
              type="button"
              onClick={() => {
                console.log('[ElementLibrary] click import button')
                fileInputRef.current?.click()
              }}
            >
              <Upload className="h-4 w-4" />
              Subir archivos
            </button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept={
                category === 'audio'
                  ? '.mp3,.wav,.ogg,.flac'
                  : '.mp4,.mov,.webm,.mkv,.avi,.png,.jpg,.jpeg,.svg,.gif'
              }
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length === 0) return

                const mappedItems: ElementLibraryItem[] = []
                files.forEach((file, index) => {
                  const mimeType = file.type
                  const type = mimeType.startsWith('audio')
                    ? 'audio'
                    : mimeType.startsWith('video')
                      ? 'video'
                      : mimeType.startsWith('image')
                        ? 'image'
                        : null
                  if (!type) return

                  const id =
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                      ? crypto.randomUUID()
                      : `upload-${Date.now()}-${index}`

                  const item: ElementLibraryItem = {
                    id,
                    name: file.name,
                    type: type as ElementLibraryItemType,
                    category: type === 'audio' ? 'audio' : 'media',
                  }
                  mappedItems.push(item)

                  const asset: MediaAsset = {
                    id,
                    fileName: file.name,
                    type,
                    source: URL.createObjectURL(file),
                    mimeType,
                  }
                  importAsset(asset)
                })

                if (mappedItems.length) {
                  setUploadedItems((prev) => [...mappedItems, ...prev])
                }
                console.log('[ElementLibrary] import files ->', files.map((f) => ({ name: f.name, type: f.type })))

                window.dispatchEvent(new CustomEvent('element-library:import', { detail: { files } }))
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>
    </aside>
  )
}
