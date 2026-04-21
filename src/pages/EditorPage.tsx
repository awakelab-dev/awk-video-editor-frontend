import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EditorLayout } from '../layouts/EditorLayout'
import { loadPresentationProject } from '../shared/projects/presentationLibrary'

export function EditorPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  useEffect(() => {
    if (!projectId) {
      return
    }

    loadPresentationProject(projectId)
  }, [projectId])

  return <EditorLayout />
}
