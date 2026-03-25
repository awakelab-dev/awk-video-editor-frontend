import type { StateCreator } from 'zustand'
import type { EditorStore } from './index'

export type ProjectResolution = {
  w: number
  h: number
}

export type ProjectSlice = {
  projectName: string
  duration: number
  resolution: ProjectResolution
  setProjectName: (projectName: string) => void
  setDuration: (duration: number) => void
  setResolution: (resolution: ProjectResolution) => void
}

export const createProjectSlice: StateCreator<EditorStore, [], [], ProjectSlice> = (set) => ({
  projectName: 'Untitled Project',
  duration: 0,
  resolution: { w: 1920, h: 1080 },
  setProjectName: (projectName) => set({ projectName }),
  setDuration: (duration) => set({ duration }),
  setResolution: (resolution) => set({ resolution }),
})
