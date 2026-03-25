import type { StateCreator } from 'zustand'
import type { EditorElement, Track } from '../types/editor'
import type { EditorStore } from './index'

export type TracksSlice = {
  tracks: Track[]
  createTrack: (track: Track) => void
  addElement: (trackId: string, element: EditorElement) => void
  reorderTracks: (fromIndex: number, toIndex: number) => void
  removeElement: (trackId: string, elementId: string) => void
  removeTrack: (trackId: string) => void
  updateElementProperty: <K extends keyof EditorElement>(
    trackId: string,
    elementId: string,
    property: K,
    value: EditorElement[K],
  ) => void
}

export const createTracksSlice: StateCreator<EditorStore, [], [], TracksSlice> = (set) => ({
  tracks: [],
  createTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, track],
    })),
  addElement: (trackId, element) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              elements: [...track.elements, element],
            }
          : track,
      ),
    })),
  reorderTracks: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.tracks.length ||
        toIndex >= state.tracks.length
      ) {
        return { tracks: state.tracks }
      }

      const tracks = [...state.tracks]
      const [movedTrack] = tracks.splice(fromIndex, 1)
      tracks.splice(toIndex, 0, movedTrack)

      return { tracks }
    }),
  removeElement: (trackId, elementId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              elements: track.elements.filter((element) => element.id !== elementId),
            }
          : track,
      ),
    })),
  removeTrack: (trackId) =>
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== trackId),
    })),
  updateElementProperty: (trackId, elementId, property, value) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              elements: track.elements.map((element) =>
                element.id === elementId
                  ? {
                      ...element,
                      [property]: value,
                    }
                  : element,
              ),
            }
          : track,
      ),
    })),
})
