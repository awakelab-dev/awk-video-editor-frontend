import { Navigate, createBrowserRouter } from 'react-router-dom'
import { EditorPage } from '../pages/EditorPage'
import { GalleryPage } from '../pages/GalleryPage'
import { LoginPage } from '../pages/LoginPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/gallery" />,
  },
  {
    path: '/editor',
    element: <EditorPage />,
  },
  {
    path: '/gallery',
    element: <GalleryPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
])
