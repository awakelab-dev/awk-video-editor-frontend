import { create } from 'zustand'
import type { MediaSlice } from './mediaSlice'
import { createMediaSlice } from './mediaSlice'
import type { PlaybackSlice } from './playbackSlice'
import { createPlaybackSlice } from './playbackSlice'
import type { ProjectSlice } from './projectSlice'
import { createProjectSlice } from './projectSlice'
import type { SelectionSlice } from './selectionSlice'
import { createSelectionSlice } from './selectionSlice'
import type { TracksSlice } from './tracksSlice'
import { createTracksSlice } from './tracksSlice'

export type EditorStore = SelectionSlice &
  MediaSlice &
  TracksSlice &
  ProjectSlice &
  PlaybackSlice

export const useEditorStore = create<EditorStore>((set, get, store) => ({
  ...createSelectionSlice(set, get, store),
  ...createMediaSlice(set, get, store),
  ...createTracksSlice(set, get, store),
  ...createProjectSlice(set, get, store),
  ...createPlaybackSlice(set, get, store),
}))
