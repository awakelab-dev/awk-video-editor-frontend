import type { EditorElement, Track } from '../../../shared/types/editor'

export const MIN_ELEMENT_DURATION = 0.001

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function getMaxTrackEnd(tracks: Track[]): number {
  return tracks
    .flatMap((track) => track.elements)
    .reduce((max, element) => Math.max(max, element.startTime + element.duration), 0)
}

export function getPlaybackDuration(projectDuration: number, tracks: Track[]): number {
  return Math.max(0, projectDuration, getMaxTrackEnd(tracks))
}

export function getPanelTimelineDuration(projectDuration: number, tracks: Track[], minimumDuration = 150): number {
  return Math.max(minimumDuration, getPlaybackDuration(projectDuration, tracks))
}

export function isElementActiveAtTime(element: EditorElement, currentTime: number): boolean {
  const startTime = Math.max(0, element.startTime)
  const duration = Math.max(element.duration, MIN_ELEMENT_DURATION)
  return currentTime >= startTime && currentTime < startTime + duration
}

export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatTimecode(totalSeconds: number, fps = 30): string {
  const safeSeconds = Math.max(0, totalSeconds)
  const totalFrames = Math.floor(safeSeconds * fps)
  const frames = totalFrames % fps
  const wholeSeconds = Math.floor(totalFrames / fps)
  const seconds = wholeSeconds % 60
  const minutes = Math.floor(wholeSeconds / 60) % 60
  const hours = Math.floor(wholeSeconds / 3600)

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
    String(frames).padStart(2, '0'),
  ].join(':')
}
