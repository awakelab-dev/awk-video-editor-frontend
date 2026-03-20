import { ElementLibraryPanel } from '../features/element-library'
import { InspectorPanel } from '../features/inspector'
import { PlaybackWorkspace, TimelinePanel } from '../features/playback'
import { AppToolbar } from '../shared/components/AppToolbar'

export function EditorLayout() {
  return (
    <div className="h-screen overflow-hidden bg-[#0d0d11] text-[#f0f0f4]">
      <AppToolbar />
      <main className="grid h-[calc(100vh-52px)] grid-cols-[264px_minmax(0,1fr)_280px] grid-rows-[minmax(0,1fr)_250px] max-[1440px]:grid-cols-[240px_minmax(0,1fr)_256px] max-[1280px]:grid-cols-[220px_minmax(0,1fr)_240px] max-[1280px]:grid-rows-[minmax(0,1fr)_210px] max-[1024px]:grid-cols-[200px_minmax(0,1fr)_220px] max-[1024px]:grid-rows-[minmax(0,1fr)_190px]">
        <ElementLibraryPanel />
        <PlaybackWorkspace />
        <InspectorPanel />
        <TimelinePanel />
      </main>
    </div>
  )
}
