import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EditorLayout } from '../layouts/EditorLayout'
import { isProjectsApiEnabled, loadApiProjectIntoStore } from '../shared/api/projectsApi'
import { loadPresentationProject } from '../shared/projects/presentationLibrary'

export function EditorPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  useEffect(() => {
    if (!projectId) {
      return
    }

    if (!isProjectsApiEnabled()) {
      loadPresentationProject(projectId)
      return
    }

    void loadApiProjectIntoStore(projectId).catch((error) => {
      console.error('No se pudo cargar el proyecto desde la API.', error)
    })
  }, [projectId])

  return <EditorLayout />
}
