import { saveProjectSnapshot, isProjectSnapshotApiEnabled, type ProjectSnapshotPayload } from '../api/projectSnapshotApi'
import type { EditorStore } from './index'
import { useEditorStore } from './index'

function toSafeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }
  return value
}

function getTrackDuration(track: EditorStore['tracks'][number]): number {
  return track.elements.reduce((maxDuration, element) => {
    const elementEnd = toSafeNumber(element.startTime) + toSafeNumber(element.duration)
    return Math.max(maxDuration, elementEnd)
  }, 0)
}

export function buildProjectSnapshotPayload(state: EditorStore): ProjectSnapshotPayload {
  return {
    snapshotVersion: 1,
    savedAt: new Date().toISOString(),
    project: {
      projectName: state.projectName,
      duration: toSafeNumber(state.duration),
      resolution: {
        w: toSafeNumber(state.resolution.w),
        h: toSafeNumber(state.resolution.h),
      },
    },
    playback: {
      currentTime: toSafeNumber(state.currentTime),
      isPlaying: state.isPlaying,
      zoomLevel: toSafeNumber(state.zoomLevel),
    },
    selection: {
      selectedElementId: state.selectedElementId,
      selectionSource: state.selectionSource,
    },
    assets: state.assets.map((asset) => ({
      id: asset.id,
      duration: typeof asset.duration === 'number' && Number.isFinite(asset.duration) ? asset.duration : null,
    })),
    tracks: state.tracks.map((track) => ({
      id: track.id,
      duration: getTrackDuration(track),
      elements: track.elements.map((element) => ({
        id: element.id,
        duration: toSafeNumber(element.duration),
      })),
    })),
  }
}

let unsubscribeProjectSnapshotAutosave: (() => void) | null = null
let previousTracksRef: EditorStore['tracks'] | null = null

export function startProjectSnapshotAutosave(): void {
  if (unsubscribeProjectSnapshotAutosave) {
    return
  }

  if (!isProjectSnapshotApiEnabled()) {
    return
  }

  previousTracksRef = useEditorStore.getState().tracks

  unsubscribeProjectSnapshotAutosave = useEditorStore.subscribe((state) => {
    if (state.tracks === previousTracksRef) {
      return
    }

    previousTracksRef = state.tracks

    const payload = buildProjectSnapshotPayload(state)
    void saveProjectSnapshot(state.projectId, payload).catch((error) => {
      console.error('No se pudo persistir el snapshot de tracks.', error)
    })
  })
}

export function stopProjectSnapshotAutosave(): void {
  if (!unsubscribeProjectSnapshotAutosave) {
    return
  }

  unsubscribeProjectSnapshotAutosave()
  unsubscribeProjectSnapshotAutosave = null
  previousTracksRef = null
}
