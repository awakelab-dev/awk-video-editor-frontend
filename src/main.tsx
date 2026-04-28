import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { startProjectSnapshotAutosave, stopProjectSnapshotAutosave } from './shared/store/projectSnapshotAutosave'

startProjectSnapshotAutosave()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopProjectSnapshotAutosave()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
