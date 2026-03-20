import { Film, Image, Layers3, Music2, Search, Type, Upload, Zap } from 'lucide-react'

type ResourceType = 'video' | 'image' | 'audio'

type ResourceItem = {
  id: string
  name: string
  duration?: string
  type: ResourceType
}

const resources: ResourceItem[] = [
  { id: '1', name: 'intro_final.mp4', duration: '00:45', type: 'video' },
  { id: '2', name: 'escena_01.mp4', duration: '01:22', type: 'video' },
  { id: '3', name: 'escena_02.mp4', duration: '00:38', type: 'video' },
  { id: '4', name: 'overlay.png', type: 'image' },
  { id: '5', name: 'logo_marca.svg', type: 'image' },
  { id: '6', name: 'musica_fondo.mp3', type: 'audio' },
  { id: '7', name: 'sfx_transicion.wav', type: 'audio' },
  { id: '8', name: 'cierre.mp4', duration: '02:10', type: 'video' },
]

const tabs = [
  { id: 'media', icon: Film, label: 'Media', active: true },
  { id: 'text', icon: Type, label: 'Texto', active: false },
  { id: 'elements', icon: Layers3, label: 'Elementos', active: false },
  { id: 'transitions', icon: Zap, label: 'Transiciones', active: false },
]

const cardByType: Record<ResourceType, string> = {
  video: 'bg-gradient-to-br from-[#1e1e30] to-[#2a2a40] text-[#818cf8]',
  image: 'bg-gradient-to-br from-[#1e2a1e] to-[#2a3a2a] text-[#22c55e]',
  audio: 'bg-gradient-to-br from-[#1a2e28] to-[#203830] text-[#4ade80]',
}

function ResourceGlyph({ type }: { type: ResourceType }) {
  if (type === 'audio') {
    return <Music2 className="h-[18px] w-[18px]" />
  }

  if (type === 'image') {
    return <Image className="h-[18px] w-[18px]" />
  }

  return <Film className="h-[18px] w-[18px]" />
}

export function ElementLibraryPanel() {
  return (
    <aside className="row-start-1 min-h-0 border-r border-[#2a2a34] bg-[#1a1a20]">
      <div className="flex h-full min-h-0 flex-col">
        <nav className="flex border-b border-[#2a2a34]" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                aria-selected={tab.active}
                className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-1 pb-2 pt-2.5 text-[10px] font-medium transition ${
                  tab.active
                    ? 'border-[#6366f1] text-[#6366f1]'
                    : 'border-transparent text-[#6b7280] hover:bg-white/[0.02] hover:text-[#9ca3af]'
                }`}
                key={tab.id}
                role="tab"
                type="button"
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
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2 max-[1024px]:grid-cols-1">
            {resources.map((resource) => (
              <article className="cursor-grab transition hover:-translate-y-0.5" key={resource.id}>
                <div
                  className={`relative flex aspect-[16/10] items-center justify-center rounded-[6px] border border-[#2a2a34] transition hover:border-[#6366f1] ${cardByType[resource.type]}`}
                >
                  <ResourceGlyph type={resource.type} />
                  {resource.duration && (
                    <span className="absolute bottom-1 right-1 rounded-[3px] bg-black/70 px-1.5 py-px text-[9px] font-semibold text-white">
                      {resource.duration}
                    </span>
                  )}
                </div>
                <p className="truncate px-0.5 pt-1.5 text-[11px] text-[#9ca3af]">{resource.name}</p>
              </article>
            ))}
          </div>
        </div>

        <button
          className="mx-3 mb-3 mt-2 inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-[#35353f] bg-[#25252e] px-3 py-2 text-xs font-medium text-[#9ca3af] transition hover:border-[#6366f1] hover:bg-[#6366f1]/[0.12] hover:text-[#6366f1]"
          type="button"
        >
          <Upload className="h-4 w-4" />
          Subir archivos
        </button>
      </div>
    </aside>
  )
}
