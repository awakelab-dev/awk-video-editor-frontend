import type { StateCreator } from 'zustand'
import type { MediaAsset } from '../types/editor'
import type { EditorStore } from './index'

export type MediaSlice = {
  assets: MediaAsset[]
  importAsset: (asset: MediaAsset) => void
  removeAsset: (assetId: string) => void
}

export const createMediaSlice: StateCreator<EditorStore, [], [], MediaSlice> = (set) => ({
  assets: [],
  importAsset: (asset) =>
    set((state) => ({
      assets: [...state.assets, asset],
    })),
  removeAsset: (assetId) =>
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== assetId),
    })),
})
