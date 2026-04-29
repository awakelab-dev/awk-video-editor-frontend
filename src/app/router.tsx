import { Navigate, createBrowserRouter } from 'react-router-dom'
import { EditorPage } from '../pages/EditorPage'
import { GalleryPage } from '../pages/GalleryPage'
import { LoginPage } from '../pages/LoginPage'
import { RequireAuth } from '../shared/auth/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/gallery" />,
  },
  {
    path: '/editor',
    element: (
      <RequireAuth>
        <EditorPage />
      </RequireAuth>
    ),
  },
  {
    path: '/gallery',
    element: (
      <RequireAuth>
        <GalleryPage />
      </RequireAuth>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
])
