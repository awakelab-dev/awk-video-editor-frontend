import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store'
import type { EditorElement, Track } from '../types/editor'
import { persistProjectChanges, type ProjectChange } from './projectsApi'

const PERSIST_DEBOUNCE_MS = 500
const NON_PATCHABLE_ELEMENT_KEYS = new Set(['id', 'type'])

type ElementSnapshot = {
  trackId: string
  index: number
  element: EditorElement
}

function indexElementsById(tracks: Track[]): Map<string, ElementSnapshot> {
  const elements = new Map<string, ElementSnapshot>()

  tracks.forEach((track) => {
    track.elements.forEach((element, index) => {
      elements.set(element.id, {
        trackId: track.id,
        index,
        element,
      })
    })
  })

  return elements
}

function areValuesEqual(previous: unknown, next: unknown): boolean {
  if (Object.is(previous, next)) {
    return true
  }

  if (Array.isArray(previous) || Array.isArray(next)) {
    return JSON.stringify(previous) === JSON.stringify(next)
  }

  return false
}

function getElementPatch(previous: EditorElement, next: EditorElement): Partial<EditorElement> {
  const patch: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])

  keys.forEach((key) => {
    if (NON_PATCHABLE_ELEMENT_KEYS.has(key)) {
      return
    }

    const previousValue = (previous as unknown as Record<string, unknown>)[key]
    const nextValue = (next as unknown as Record<string, unknown>)[key]

    if (!areValuesEqual(previousValue, nextValue)) {
      patch[key] = nextValue
    }
  })

  return patch as Partial<EditorElement>
}

function hasPatchValues(patch: Partial<EditorElement>): boolean {
  return Object.keys(patch).length > 0
}

export function buildProjectChangesFromTracks(previousTracks: Track[], nextTracks: Track[]): ProjectChange[] {
  const previousElements = indexElementsById(previousTracks)
  const nextElements = indexElementsById(nextTracks)
  const changes: ProjectChange[] = []

  previousElements.forEach((previous, elementId) => {
    if (!nextElements.has(elementId)) {
      changes.push({
        type: 'element.remove-from-track',
        trackId: previous.trackId,
        elementId,
      })
    }
  })

  nextElements.forEach((next, elementId) => {
    const previous = previousElements.get(elementId)
    if (!previous) {
      return
    }

    if (previous.trackId !== next.trackId) {
      changes.push({
        type: 'element.move',
        elementId,
        toTrackId: next.trackId,
        toIndex: next.index,
      })
    }

    const patch = getElementPatch(previous.element, next.element)
    if (hasPatchValues(patch)) {
      changes.push({
        type: 'element.update',
        elementId,
        patch,
      })
    }
  })

  return changes
}

export function mergeProjectChanges(previousChanges: ProjectChange[], nextChanges: ProjectChange[]): ProjectChange[] {
  const updates = new Map<string, Extract<ProjectChange, { type: 'element.update' }>>()
  const structuralChanges = new Map<string, Exclude<ProjectChange, { type: 'element.update' }>>()

  for (const change of [...previousChanges, ...nextChanges]) {
    if (change.type === 'element.update') {
      const previousUpdate = updates.get(change.elementId)
      updates.set(change.elementId, {
        type: 'element.update',
        elementId: change.elementId,
        patch: {
          ...(previousUpdate?.patch ?? {}),
          ...change.patch,
        },
      })
      continue
    }

    if (change.type === 'element.remove-from-track') {
      updates.delete(change.elementId)
      structuralChanges.set(`remove:${change.elementId}`, change)
      continue
    }

    if (change.type === 'element.move') {
      structuralChanges.set(`move:${change.elementId}`, change)
      continue
    }

    structuralChanges.set(`add:${change.elementId}`, change)
  }

  return [...structuralChanges.values(), ...updates.values()]
}

export function useProjectChangeSync(): void {
  const pendingChangesRef = useRef<ProjectChange[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushChainRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    function flushPendingChanges() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      const changes = pendingChangesRef.current
      pendingChangesRef.current = []

      if (changes.length === 0) {
        return
      }

      flushChainRef.current = flushChainRef.current
        .then(async () => {
          await persistProjectChanges(changes)
        })
        .catch((error) => {
          console.error('[ProjectSync] No se pudieron persistir los cambios del proyecto.', error)
        })
    }

    function scheduleFlush() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(flushPendingChanges, PERSIST_DEBOUNCE_MS)
    }

    const unsubscribe = useEditorStore.subscribe((state, previousState) => {
      if (!state.projectId || state.projectId !== previousState.projectId) {
        return
      }

      const changes = buildProjectChangesFromTracks(previousState.tracks, state.tracks)
      if (changes.length === 0) {
        return
      }

      pendingChangesRef.current = mergeProjectChanges(pendingChangesRef.current, changes)
      scheduleFlush()
    })

    return () => {
      unsubscribe()
      flushPendingChanges()
    }
  }, [])
}
