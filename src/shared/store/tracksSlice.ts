import type { StateCreator } from 'zustand'
import type { EditorElement, Track } from '../types/editor'
import type { EditorStore } from './index'
import { buildDefaultTracks, canElementGoToTrack, isProtectedTrack } from './defaultTracks'

type KeysOfUnion<T> = T extends T ? keyof T : never
type ValueOfUnion<T, K extends PropertyKey> = T extends T ? (K extends keyof T ? T[K] : never) : never

type EditorElementKey = KeysOfUnion<EditorElement>
type EditorElementValue<K extends EditorElementKey> = ValueOfUnion<EditorElement, K>

export type TracksSlice = {
  tracks: Track[]
  createTrack: (track: Track) => void
  addElement: (trackId: string, element: EditorElement) => void
  moveElement: (
    sourceTrackId: string,
    elementId: string,
    targetTrackId: string,
    targetStartTime: number,
  ) => void
  reorderTracks: (fromIndex: number, toIndex: number) => void
  removeElement: (trackId: string, elementId: string) => void
  removeTrack: (trackId: string) => void
  updateElementProperty: (
    trackId: string,
    elementId: string,
    property: EditorElementKey,
    value: EditorElementValue<EditorElementKey>,
  ) => void
}

export const createTracksSlice: StateCreator<EditorStore, [], [], TracksSlice> = (set) => ({
  tracks: buildDefaultTracks(),
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
  moveElement: (sourceTrackId, elementId, targetTrackId, targetStartTime) =>
    set((state) => {
      const sourceTrack = state.tracks.find((track) => track.id === sourceTrackId)
      const targetTrack = state.tracks.find((track) => track.id === targetTrackId)
      const element = sourceTrack?.elements.find((trackElement) => trackElement.id === elementId)

      if (!sourceTrack || !targetTrack || !element) {
        return { tracks: state.tracks }
      }

      if (!canElementGoToTrack(element.type, targetTrack)) {
        return { tracks: state.tracks }
      }

      const nextStartTime = Math.max(0, targetStartTime)

      if (sourceTrackId === targetTrackId) {
        return {
          tracks: state.tracks.map((track) =>
            track.id === sourceTrackId
              ? {
                  ...track,
                  elements: track.elements
                    .map((trackElement) =>
                      trackElement.id === elementId
                        ? {
                            ...trackElement,
                            startTime: nextStartTime,
                          }
                        : trackElement,
                    )
                    .sort((a, b) => a.startTime - b.startTime),
                }
              : track,
          ),
        }
      }

      const movedElement = {
        ...element,
        startTime: nextStartTime,
      }

      return {
        tracks: state.tracks.map((track) => {
          if (track.id === sourceTrackId) {
            return {
              ...track,
              elements: track.elements.filter((trackElement) => trackElement.id !== elementId),
            }
          }

          if (track.id === targetTrackId) {
            return {
              ...track,
              elements: [...track.elements, movedElement].sort((a, b) => a.startTime - b.startTime),
            }
          }

          return track
        }),
      }
    }),
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
    set((state) => {
      if (isProtectedTrack(trackId)) {
        return { tracks: state.tracks }
      }

      return {
        tracks: state.tracks.filter((track) => track.id !== trackId),
      }
    }),
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
