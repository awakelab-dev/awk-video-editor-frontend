import type { StateCreator } from 'zustand'
import type { EditorStore } from './index'

export type ProjectResolution = {
  w: number
  h: number
}

export type ProjectSlice = {
  projectId: string
  revision: number
  sessionId?: string
  projectName: string
  duration: number
  resolution: ProjectResolution
  setProjectId: (projectId: string) => void
  setApiSession: (session: { projectId: string; revision: number; sessionId?: string }) => void
  setProjectName: (projectName: string) => void
  setDuration: (duration: number) => void
  setResolution: (resolution: ProjectResolution) => void
}

export const createProjectSlice: StateCreator<EditorStore, [], [], ProjectSlice> = (set) => ({
  projectId: '',
  revision: 0,
  sessionId: undefined,
  projectName: 'Untitled Project',
  duration: 0,
  resolution: { w: 1920, h: 1080 },
  setProjectId: (projectId) => set({ projectId }),
  setApiSession: ({ projectId, revision, sessionId }) =>
    set({
      projectId,
      revision,
      sessionId,
    }),
  setProjectName: (projectName) => set({ projectName }),
  setDuration: (duration) => set({ duration }),
  setResolution: (resolution) => set({ resolution }),
})
