import type { StateCreator } from 'zustand'
import type { SelectionSource } from '../types/editor'
import type { EditorStore } from './index'

export type SelectionSlice = {
  selectedElementId: string | null
  selectionSource: SelectionSource | null
  selectElement: (id: string, source: SelectionSource) => void
  clearSelection: () => void
}

export const createSelectionSlice: StateCreator<
  EditorStore,
  [],
  [],
  SelectionSlice
> = (set) => ({
  selectedElementId: null,
  selectionSource: null,
  selectElement: (id, source) => set({ selectedElementId: id, selectionSource: source }),
  clearSelection: () => set({ selectedElementId: null, selectionSource: null }),
})
