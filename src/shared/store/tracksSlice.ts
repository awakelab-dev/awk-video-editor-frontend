import type { StateCreator } from 'zustand'
import type { EditorElement, Track } from '../types/editor'
import type { EditorStore } from './index'
import { buildDefaultTracks, canElementGoToTrack, isProtectedTrack } from './defaultTracks'

type KeysOfUnion<T> = T extends T ? keyof T : never
type ValueOfUnion<T, K extends PropertyKey> = T extends T ? (K extends keyof T ? T[K] : never) : never

type EditorElementKey = KeysOfUnion<EditorElement>
type EditorElementValue<K extends EditorElementKey> = ValueOfUnion<EditorElement, K>

function getElementEnd(element: Pick<EditorElement, 'startTime' | 'duration'>): number {
  return element.startTime + element.duration
}

function overlaps(
  intervalStart: number,
  intervalDuration: number,
  element: Pick<EditorElement, 'startTime' | 'duration'>,
): boolean {
  const intervalEnd = intervalStart + intervalDuration
  return intervalStart < getElementEnd(element) && intervalEnd > element.startTime
}

function resolveNonOverlappingStartTime(
  trackElements: EditorElement[],
  movingElementId: string,
  desiredStartTime: number,
  movingDuration: number,
): number {
  const safeDesiredStart = Math.max(0, desiredStartTime)
  const sortedElements = trackElements
    .filter((element) => element.id !== movingElementId)
    .sort((a, b) => a.startTime - b.startTime)

  if (sortedElements.length === 0) {
    return safeDesiredStart
  }

  const overlappedElements = sortedElements.filter((element) => overlaps(safeDesiredStart, movingDuration, element))
  if (overlappedElements.length === 0) {
    return safeDesiredStart
  }

  const desiredCenter = safeDesiredStart + movingDuration / 2
  const anchorElement = overlappedElements.reduce((closest, current) => {
    const closestDistance = Math.abs(closest.startTime + closest.duration / 2 - desiredCenter)
    const currentDistance = Math.abs(current.startTime + current.duration / 2 - desiredCenter)
    return currentDistance < closestDistance ? current : closest
  })
  const anchorIndex = sortedElements.findIndex((element) => element.id === anchorElement.id)

  const placeAfter = () => {
    let nextStartTime = getElementEnd(anchorElement)
    for (let index = anchorIndex + 1; index < sortedElements.length; index += 1) {
      const currentElement = sortedElements[index]
      if (nextStartTime + movingDuration <= currentElement.startTime) {
        return nextStartTime
      }
      nextStartTime = getElementEnd(currentElement)
    }
    return nextStartTime
  }

  const placeBefore = () => {
    let nextSlotEnd = anchorElement.startTime
    for (let index = anchorIndex - 1; index >= 0; index -= 1) {
      const currentElement = sortedElements[index]
      const candidateStart = nextSlotEnd - movingDuration
      if (candidateStart >= getElementEnd(currentElement)) {
        return candidateStart
      }
      nextSlotEnd = currentElement.startTime
    }
    const firstCandidate = nextSlotEnd - movingDuration
    if (firstCandidate >= 0) {
      return firstCandidate
    }
    return null
  }

  const anchorCenter = anchorElement.startTime + anchorElement.duration / 2
  if (desiredCenter < anchorCenter) {
    return placeBefore() ?? placeAfter()
  }

  return placeAfter()
}

function resolveStartTimeAfterConflicts(
  trackElements: EditorElement[],
  desiredStartTime: number,
  movingDuration: number,
): number {
  let nextStartTime = Math.max(0, desiredStartTime)
  const safeDuration = Math.max(0, movingDuration)

  while (true) {
    const overlappedElements = trackElements.filter((element) => overlaps(nextStartTime, safeDuration, element))
    if (overlappedElements.length === 0) {
      return nextStartTime
    }

    nextStartTime = Math.max(...overlappedElements.map(getElementEnd))
  }
}

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
              elements: [
                ...track.elements,
                {
                  ...element,
                  startTime: resolveStartTimeAfterConflicts(
                    track.elements,
                    element.startTime,
                    element.duration,
                  ),
                },
              ].sort((a, b) => a.startTime - b.startTime),
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
      const resolvedStartTime = resolveNonOverlappingStartTime(
        targetTrack.elements,
        elementId,
        nextStartTime,
        element.duration,
      )

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
                            startTime: resolvedStartTime,
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
        startTime: resolvedStartTime,
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
