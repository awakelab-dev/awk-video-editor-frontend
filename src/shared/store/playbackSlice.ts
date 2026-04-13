import type { StateCreator } from 'zustand'
import type { EditorStore } from './index'

export type PlaybackSlice = {
  currentTime: number
  isPlaying: boolean
  zoomLevel: number
  masterVolume: number
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setzoom: (zoom: number) => void
  setMasterVolume: (volume: number) => void
}

export const createPlaybackSlice: StateCreator<
  EditorStore,
  [],
  [],
  PlaybackSlice
> = (set) => ({
  currentTime: 0,
  isPlaying: false,
  zoomLevel: 100,
  masterVolume: 1,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time) => set({ currentTime: time }),
  setzoom: (zoom) => set({ zoomLevel: zoom }),
  setMasterVolume: (volume) => set({ masterVolume: Math.min(1, Math.max(0, volume)) }),
})
