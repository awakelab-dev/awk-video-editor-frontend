import type { ElementKind, Track } from '../types/editor'

export const TEXT_TRACK_ID = 'track-text'
export const TEXT_TRACK_NAME = 'Textos'

export const AUDIO_TRACK_ID = 'track-audio'
export const AUDIO_TRACK_NAME = 'Audio'

export const MEDIA_TRACK_ID = 'track-media'
export const MEDIA_TRACK_NAME = 'Imágenes/Vídeos'

const PROTECTED_TRACK_IDS = new Set([TEXT_TRACK_ID, AUDIO_TRACK_ID, MEDIA_TRACK_ID])

export type TrackBucket = 'text' | 'audio' | 'media' | 'unknown'

export function isProtectedTrack(trackId: string): boolean {
  return PROTECTED_TRACK_IDS.has(trackId)
}

export function getBucketFromElementType(elementType: ElementKind): Exclude<TrackBucket, 'unknown'> {
  if (elementType === 'text') {
    return 'text'
  }
  if (elementType === 'audio') {
    return 'audio'
  }
  return 'media'
}

export function getBucketFromTrack(track: Track): TrackBucket {
  if (track.kind) {
    return track.kind
  }

  if (track.id === TEXT_TRACK_ID) {
    return 'text'
  }
  if (track.id === AUDIO_TRACK_ID) {
    return 'audio'
  }
  if (track.id === MEDIA_TRACK_ID) {
    return 'media'
  }

  const firstElement = track.elements[0]
  if (!firstElement) {
    return 'unknown'
  }

  return getBucketFromElementType(firstElement.type)
}

export function canElementGoToTrack(elementType: ElementKind, track: Track): boolean {
  const trackBucket = getBucketFromTrack(track)
  if (trackBucket === 'unknown') {
    return true
  }

  return trackBucket === getBucketFromElementType(elementType)
}

export function buildDefaultTracks(): Track[] {
  return [
    {
      id: TEXT_TRACK_ID,
      name: TEXT_TRACK_NAME,
      kind: 'text',
      elements: [],
    },
    {
      id: AUDIO_TRACK_ID,
      name: AUDIO_TRACK_NAME,
      kind: 'audio',
      elements: [],
    },
    {
      id: MEDIA_TRACK_ID,
      name: MEDIA_TRACK_NAME,
      kind: 'media',
      elements: [],
    },
  ]
}
