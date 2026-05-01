import type { StateCreator } from 'zustand'
import type { SelectionSource } from '../types/editor'
import type { EditorStore } from './index'

export type SelectionSlice = {
  selectedElementId: string | null
  selectedTrackId: string | null
  selectionSource: SelectionSource | null
  selectElement: (id: string, source: SelectionSource, trackId?: string | null) => void
  clearSelection: () => void
}

export const createSelectionSlice: StateCreator<
  EditorStore,
  [],
  [],
  SelectionSlice
> = (set) => ({
  selectedElementId: null,
  selectedTrackId: null,
  selectionSource: null,
  selectElement: (id, source, trackId = null) =>
    set({ selectedElementId: id, selectedTrackId: trackId, selectionSource: source }),
  clearSelection: () => set({ selectedElementId: null, selectedTrackId: null, selectionSource: null }),
})
