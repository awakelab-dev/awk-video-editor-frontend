import { create } from 'zustand'
import type { SelectionSource } from '../types/editor'

type EditorStore = {
  selectedElementId: string | null
  selectionSource: SelectionSource
  currentTime: number
  isPlaying: boolean
  zoomLevel: number
  selectElement: (id: string, source: Exclude<SelectionSource, null>) => void
  clearSelection: () => void
  seek: (time: number) => void
  setZoom: (zoom: number) => void
  togglePlayback: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedElementId: null,
  selectionSource: null,
  currentTime: 0,
  isPlaying: false,
  zoomLevel: 100,
  selectElement: (id, source) => set({ selectedElementId: id, selectionSource: source }),
  clearSelection: () => set({ selectedElementId: null, selectionSource: null }),
  seek: (time) => set({ currentTime: time }),
  setZoom: (zoom) => set({ zoomLevel: zoom }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
}))
