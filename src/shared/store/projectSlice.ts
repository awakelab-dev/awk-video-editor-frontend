import type { StateCreator } from 'zustand'
import type { EditorStore } from './index'

export type ProjectResolution = {
  w: number
  h: number
}

export type ProjectSlice = {
  projectId: string
  projectName: string
  duration: number
  resolution: ProjectResolution
  setProjectId: (projectId: string) => void
  setProjectName: (projectName: string) => void
  setDuration: (duration: number) => void
  setResolution: (resolution: ProjectResolution) => void
}

export const createProjectSlice: StateCreator<EditorStore, [], [], ProjectSlice> = (set) => ({
  projectId: import.meta.env.VITE_API_PROJECT_ID?.trim() || '123',
  projectName: 'Untitled Project',
  duration: 150,
  resolution: { w: 1920, h: 1080 },
  setProjectId: (projectId) => set({ projectId }),
  setProjectName: (projectName) => set({ projectName }),
  setDuration: (duration) => set({ duration }),
  setResolution: (resolution) => set({ resolution }),
})
