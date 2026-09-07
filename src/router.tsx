// src/router.tsx

import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Entrance from './parts/Entrance'
import Docs from './parts/Docs'
import Setup from './parts/Setup'
import { docsLoader } from './docs/docsLoader'

export const router = createBrowserRouter(
  [{
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Entrance /> },
      { path: 'docs', children: [
        { index: true, element: <Docs />, loader: docsLoader },
        { path: ':docsId', element: <Docs />, loader: docsLoader }
      ]},
      { path: 'setup', children: [
        { index: true, element: <Setup /> },
        { path: ':uid', element: <Setup /> }
      ]}
    ]
  }],
  {
    basename: '/demo/02/',
  }
)
