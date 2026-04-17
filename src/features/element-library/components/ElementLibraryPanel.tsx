import { Film, Image, Layers3, Music2, Search, Type, Upload, Zap } from 'lucide-react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import { useAddElement } from '../hooks/useAddElement'
import { useElementCatalog } from '../hooks/useElementCatalog'
import { useInstrumentation } from '../hooks/useInstrumentation'
import { useAddTextElement } from '../hooks/useAddTextElement'
import { useAddShapeElement } from '../hooks/useAddShapeElement'
import { useAddAudioElement } from '../hooks/useAddAudioElement'
import { useAddImageElement } from '../hooks/useAddImageElement'
import { useAddVideoElement } from '../hooks/useAddVideoElement'
import type { ElementLibraryCategory, ElementLibraryItem, ElementLibraryItemType } from '../types'

type DragPayload =
  | { kind: 'text'; preset: NonNullable<ElementLibraryItem['textPreset']>; label: string }
  | { kind: 'shape'; preset: NonNullable<ElementLibraryItem['shapePreset']>; label: string }
  | { kind: 'audio'; assetId: string; label: string }
  | { kind: 'image'; assetId: string; label: string }
  | { kind: 'video'; assetId: string; label: string }

type DragEndDetail = {
  payload: DragPayload
  clientX: number
  clientY: number
}

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

function AudioWaveform() {
  return (
    <div className="flex h-12 w-24 items-center justify-center gap-0.5">
      {Array.from({ length: 8 }).map((_, i) => {
        const heights = [35, 55, 40, 70, 50, 65, 45, 60]
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-[#4ade80]"
            style={{
              height: `${heights[i]}%`,
              animation: 'pulse 1s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        )
      })}
    </div>
  )
}

export function ElementLibraryPanel() {
  const [uploadedItems, setUploadedItems] = useState<ElementLibraryItem[]>([])
  const { items, category, setCategory, query, setQuery, total } = useElementCatalog(uploadedItems)
  const addElement = useAddElement()
  const addTextElement = useAddTextElement()
  const addShapeElement = useAddShapeElement()
  const addAudioElement = useAddAudioElement()
  const addImageElement = useAddImageElement()
  const addVideoElement = useAddVideoElement()
  const { trackEvent } = useInstrumentation()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [lastPresetId, setLastPresetId] = useState<string | null>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const importAsset = useEditorStore((state) => state.importAsset)
  const resolution = useEditorStore((state) => state.resolution)
  const dragOverlayElRef = useRef<HTMLDivElement | null>(null)
  const dragOverlayCleanupRef = useRef<(() => void) | null>(null)
  const activeDragPayloadRef = useRef<DragPayload | null>(null)

  function handleAddTextPreset(item: ElementLibraryItem) {
    if (!item.textPreset) return
    trackEvent('text_preset_added', { source: 'element-library', preset: item.textPreset, itemId: item.id })
    const element = addTextElement({ preset: item.textPreset, label: item.name })
    console.log('[ElementLibrary] text preset workflow', {
      preset: item.textPreset,
      templateId: item.id,
      element,
    })
    setLastPresetId(item.id)
    setFeedback(`${item.name} añadido al lienzo`)
    window.setTimeout(() => setFeedback(null), 2000)
  }

  function handleAddShapePreset(item: ElementLibraryItem) {
    if (!item.shapePreset) return
    trackEvent('shape_preset_added', { source: 'element-library', preset: item.shapePreset, itemId: item.id })
    const element = addShapeElement({ preset: item.shapePreset, label: item.name })
    console.log('[ElementLibrary] shape preset workflow', {
      preset: item.shapePreset,
      templateId: item.id,
      element,
    })
    setLastPresetId(item.id)
    setFeedback(`${item.name} añadido al lienzo`)
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

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {feedback && (
            <div
              aria-live="assertive"
              className="mb-2 rounded-[6px] border border-[#4338ca] bg-[#312e81] px-3 py-2 text-[11px] text-[#ede9fe]"
            >
              {feedback}
            </div>
          )}
          {total === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#2a2a34] bg-[#1e1e24] text-xs text-[#6b7280]">
              {emptyStateLabel}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-[1024px]:grid-cols-1">
              {items.map((item) => {
                const isPreset =
                  (item.category === 'text' && item.textPreset) || (item.category === 'shapes' && item.shapePreset)
                const isRecentPreset = isPreset && item.id === lastPresetId
                const isImportedAudio = item.type === 'audio' && item.category === 'audio'
                const isImportedImage = item.type === 'image' && item.category === 'media'
                const isImportedVideo = item.type === 'video' && item.category === 'media'
                const hasPreview = !!item.preview
                const isHovered = hoveredItemId === item.id
                const isDraggable = isPreset || isImportedAudio || isImportedImage || isImportedVideo

                const payload: DragPayload | null =
                  item.category === 'text' && item.textPreset
                    ? { kind: 'text', preset: item.textPreset, label: item.name }
                    : item.category === 'shapes' && item.shapePreset
                      ? { kind: 'shape', preset: item.shapePreset, label: item.name }
                      : isImportedAudio
                        ? { kind: 'audio', assetId: item.id, label: item.name }
                        : isImportedImage
                          ? { kind: 'image', assetId: item.id, label: item.name }
                          : isImportedVideo
                            ? { kind: 'video', assetId: item.id, label: item.name }
                            : null

                return (
                  <article
                    className={`group relative rounded-[8px] border border-transparent p-1 transition hover:-translate-y-0.5 ${
                      isRecentPreset ? 'border-[#6366f1] bg-[#1f1f2d]' : ''
                    } ${isDraggable ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-pointer'}`}
                    key={item.id}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    aria-current={isRecentPreset}
                    onClick={() => {
                      console.log('[ElementLibrary] add element ->', item)
                      if (item.category === 'text' && item.textPreset) {
                        handleAddTextPreset(item)
                      } else if (item.category === 'shapes' && item.shapePreset) {
                        handleAddShapePreset(item)
                      } else if (item.type === 'audio') {
                        trackEvent('library_item_added', { itemId: item.id, type: item.type, category: item.category })
                        const created = addAudioElement({ assetId: item.id, label: item.name })
                        if (!created) addElement(item)
                      } else if (item.type === 'image') {
                        trackEvent('library_item_added', { itemId: item.id, type: item.type, category: item.category })
                        const created = addImageElement({ assetId: item.id, label: item.name })
                        if (!created) addElement(item)
                      } else if (item.type === 'video') {
                        trackEvent('library_item_added', { itemId: item.id, type: item.type, category: item.category })
                        const created = addVideoElement({ assetId: item.id, label: item.name })
                        if (!created) addElement(item)
                      } else {
                        trackEvent('library_item_added', { itemId: item.id, type: item.type, category: item.category })
                        addElement(item)
                      }
                    }}
                  >
                    <div
                      className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[6px] border transition group-hover:border-[#6366f1] ${
                        isRecentPreset ? 'border-[#6366f1]' : 'border-[#2a2a34]'
                      } ${hasPreview ? '' : cardByType[item.type]}`}
                    >
                      {/* Real thumbnail preview for imported media */}
                      {hasPreview && (
                        <img
                          src={item.preview}
                          alt=""
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      )}

                      {/* Hover preview for presets */}
                      {!hasPreview && isHovered && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a1a20]">
                          {item.type === 'audio' && <AudioWaveform />}
                          {item.textPreset && (
                            <span
                              className="text-white drop-shadow-md"
                              style={{
                                fontSize: item.textPreset === 'title' ? '1.2rem' : item.textPreset === 'subtitle' ? '0.9rem' : '0.7rem',
                                fontWeight: item.textPreset === 'title' ? 800 : item.textPreset === 'subtitle' ? 600 : 500,
                              }}
                            >
                              {item.textPreset === 'title' ? 'Título' : item.textPreset === 'subtitle' ? 'Subtítulo' : item.textPreset === 'lower-third' ? 'Lower Third' : 'Texto'}
                            </span>
                          )}
                          {item.shapePreset && (
                            <div
                              className={item.shapePreset === 'rectangle' ? 'h-6 w-10' : 'h-10 w-10'}
                              style={{
                                backgroundColor: item.shapePreset === 'ellipse' ? '#22c55e' : '#4f46e5',
                                borderRadius: item.shapePreset === 'ellipse' ? '9999px' : item.shapePreset === 'background' ? '12px' : '8px',
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Default icon (hidden when showing preview) */}
                      {(!hasPreview && !isHovered) && <ResourceGlyph type={item.type} />}

                      {/* Badges - only when not showing preview */}
                      {!hasPreview && isRecentPreset && (
                        <span className="absolute left-1.5 top-1.5 rounded-[4px] bg-[#6366f1] px-1.5 py-px text-[9px] font-semibold text-white">
                          Añadido
                        </span>
                      )}
                      {!hasPreview && item.duration && (
                        <span className="absolute bottom-1 right-1 rounded-[3px] bg-black/70 px-1.5 py-px text-[9px] font-semibold text-white">
                          {item.duration}
                        </span>
                      )}

                      {/* Drag overlay capture area */}
                      {isDraggable && (
                        <div
                          className="absolute inset-0 z-20"
                          onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
                            setHoveredItemId(null)
                            if (!payload) return

                            event.preventDefault()
                            event.stopPropagation()

                            console.log('[ElementLibrary][drag] start', {
                              id: item.id,
                              name: item.name,
                              payload,
                              clientX: event.clientX,
                              clientY: event.clientY,
                            })

                            activeDragPayloadRef.current = payload

                            dragOverlayCleanupRef.current?.()
                            dragOverlayCleanupRef.current = null

                            const overlay = document.createElement('div')
                            overlay.textContent = item.name
                            overlay.style.position = 'fixed'
                            overlay.style.left = `${event.clientX}px`
                            overlay.style.top = `${event.clientY}px`
                            overlay.style.transform = 'translate(-50%, -50%)'
                            overlay.style.padding = '6px 10px'
                            overlay.style.borderRadius = '10px'
                            overlay.style.background = 'rgba(99, 102, 241, 0.95)'
                            overlay.style.color = 'white'
                            overlay.style.fontSize = '12px'
                            overlay.style.fontWeight = '600'
                            overlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.45)'
                            overlay.style.pointerEvents = 'none'
                            overlay.style.userSelect = 'none'
                            overlay.style.zIndex = '2147483647'
                            document.body.appendChild(overlay)
                            dragOverlayElRef.current = overlay

                            let lastPointerX = event.clientX
                            let lastPointerY = event.clientY

                            const onMouseMove = (e: MouseEvent) => {
                              if (!dragOverlayElRef.current) return
                              lastPointerX = e.clientX
                              lastPointerY = e.clientY
                              dragOverlayElRef.current.style.left = `${e.clientX}px`
                              dragOverlayElRef.current.style.top = `${e.clientY}px`
                            }

                            const cleanup = (mouseUpEvent?: MouseEvent) => {
                              console.log('[ElementLibrary][drag] cleanup')
                              window.removeEventListener('mousemove', onMouseMove)
                              window.removeEventListener('mouseup', cleanup)
                              dragOverlayElRef.current?.remove()
                              dragOverlayElRef.current = null
                              dragOverlayCleanupRef.current = null

                              const activePayload = activeDragPayloadRef.current
                              activeDragPayloadRef.current = null
                              if (!activePayload) return

                              const clientX = mouseUpEvent?.clientX ?? lastPointerX
                              const clientY = mouseUpEvent?.clientY ?? lastPointerY

                              const preview = document.querySelector('[data-testid="playback-preview"]') as HTMLElement | null
                              const withinPreview = (() => {
                                if (!preview) return false
                                const rect = preview.getBoundingClientRect()
                                return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
                              })()

                              if (!withinPreview) {
                                console.log('[ElementLibrary][drag] end outside preview - ignored', { clientX, clientY })
                                return
                              }

                              const detail: DragEndDetail = { payload: activePayload, clientX, clientY }
                              console.log('[ElementLibrary][drag] end', detail)

                              if (preview) {
                                const rect = preview.getBoundingClientRect()
                                const relX = (clientX - rect.left) / Math.max(rect.width, 1)
                                const relY = (clientY - rect.top) / Math.max(rect.height, 1)
                                const dropPosition = { x: Math.round(relX * resolution.w), y: Math.round(relY * resolution.h) }

                                if (activePayload.kind === 'text') {
                                  addTextElement({ preset: activePayload.preset, label: activePayload.label, dropPosition })
                                } else if (activePayload.kind === 'shape') {
                                  addShapeElement({ preset: activePayload.preset, label: activePayload.label, dropPosition })
                                } else if (activePayload.kind === 'audio') {
                                  addAudioElement({ assetId: activePayload.assetId, label: activePayload.label })
                                } else if (activePayload.kind === 'image') {
                                  addImageElement({ assetId: activePayload.assetId, label: activePayload.label, dropPosition })
                                } else if (activePayload.kind === 'video') {
                                  addVideoElement({ assetId: activePayload.assetId, label: activePayload.label, dropPosition })
                                }
                              }

                              window.dispatchEvent(new CustomEvent<DragEndDetail>('element-library:drag-end', { detail }))
                            }

                            window.addEventListener('mousemove', onMouseMove)
                            window.addEventListener('mouseup', cleanup)
                            dragOverlayCleanupRef.current = cleanup
                          }}
                        />
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
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length === 0) return

                const mappedItems: ElementLibraryItem[] = []
                
                const generateVideoThumbnail = (file: File): Promise<string> => {
                  return new Promise((resolve) => {
                    const video = document.createElement('video')
                    video.preload = 'metadata'
                    video.src = URL.createObjectURL(file)
                    video.muted = true
                    
                    video.onloadedmetadata = () => {
                      video.currentTime = Math.min(video.duration * 0.25, 5)
                    }
                    
                    video.onseeked = () => {
                      const canvas = document.createElement('canvas')
                      canvas.width = 160
                      canvas.height = 90
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        resolve(canvas.toDataURL('image/jpeg', 0.7))
                      }
                      URL.revokeObjectURL(video.src)
                    }
                    
                    video.onerror = () => {
                      resolve('')
                      URL.revokeObjectURL(video.src)
                    }
                  })
                }
                
                const generateAudioWaveform = (file: File): Promise<string> => {
                  return new Promise((resolve) => {
                    const canvas = document.createElement('canvas')
                    canvas.width = 160
                    canvas.height = 90
                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                      resolve('')
                      return
                    }
                    
                    ctx.fillStyle = '#1a1a20'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    
                    const seed = file.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
                    const bars = 20
                    const barWidth = 6
                    const gap = 2
                    
                    ctx.fillStyle = '#4ade80'
                    for (let i = 0; i < bars; i++) {
                      const height = 20 + (Math.sin(seed + i * 0.5) * 0.5 + 0.5) * 50
                      const x = (canvas.width - bars * (barWidth + gap)) / 2 + i * (barWidth + gap)
                      const y = (canvas.height - height) / 2
                      ctx.fillRect(x, y, barWidth, height)
                    }
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7))
                  })
                }
                
                for (let index = 0; index < files.length; index++) {
                  const file = files[index]
                  const mimeType = file.type
                  const type = mimeType.startsWith('audio')
                    ? 'audio'
                    : mimeType.startsWith('video')
                      ? 'video'
                      : mimeType.startsWith('image')
                        ? 'image'
                        : null
                  if (!type) continue

                  const id =
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                      ? crypto.randomUUID()
                      : `upload-${Date.now()}-${index}`

                  let preview: string | undefined
                  if (type === 'video') {
                    preview = await generateVideoThumbnail(file)
                  } else if (type === 'audio') {
                    preview = await generateAudioWaveform(file)
                  } else if (type === 'image') {
                    preview = await new Promise<string>((resolve) => {
                      const reader = new FileReader()
                      reader.onload = () => resolve(reader.result as string)
                      reader.readAsDataURL(file)
                    })
                  }

                  const item: ElementLibraryItem = {
                    id,
                    name: file.name,
                    type: type as ElementLibraryItemType,
                    category: type === 'audio' ? 'audio' : 'media',
                    preview,
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

                  if (type === 'audio') {
                    setTimeout(() => {
                      const created = addAudioElement({ assetId: id, label: file.name })
                      if (created) setFeedback(`${file.name} añadido a pista de audio`)
                    }, 0)
                  } else if (type === 'image') {
                    setTimeout(() => {
                      const created = addImageElement({ assetId: id, label: file.name })
                      if (created) setFeedback(`${file.name} añadida al timeline`)
                    }, 0)
                  } else if (type === 'video') {
                    setTimeout(() => {
                      const created = addVideoElement({ assetId: id, label: file.name })
                      if (created) setFeedback(`${file.name} añadido al timeline`)
                    }, 0)
                  }
                }

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
