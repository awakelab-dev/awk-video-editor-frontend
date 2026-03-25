import type { StateCreator } from 'zustand'
import type { EditorStore } from './index'

export type PlaybackSlice = {
  currentTime: number
  isPlaying: boolean
  zoomLevel: number
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setzoom: (zoom: number) => void
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
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time) => set({ currentTime: time }),
  setzoom: (zoom) => set({ zoomLevel: zoom }),
})
