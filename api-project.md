# Inicializacion de proyectos desde frontend

Este documento resume el contrato que debe usar frontend para crear un proyecto nuevo y abrir un proyecto existente en el editor.

## Base path

Todos los endpoints de proyectos cuelgan de:

```txt
/api/v1/projects
```

## Flujo recomendado

1. Crear el proyecto con `POST /api/v1/projects`.
2. Guardar el `projectId` devuelto por backend.
3. Hidratar el editor con `data.initialEditorState` de la respuesta.
4. Para volver a abrir un proyecto, pedir `GET /api/v1/projects/:projectId/editor-state`.

El frontend no debe generar ni enviar `id` ni `projectId` al crear un proyecto. El backend genera siempre un identificador con formato `proj_<uuid-sin-guiones>`.

## Crear proyecto

```http
POST /api/v1/projects
Content-Type: application/json
```

### Body

```ts
type CreateProjectPayload = {
  name: string;
  duration?: number;
  resolution: {
    w: number;
    h: number;
  };
};
```

Reglas:

- `name` es obligatorio, se recorta con `trim()` y debe tener entre 1 y 120 caracteres.
- `duration` es opcional. Si no se envia, backend usa `0`.
- `duration` debe ser un numero mayor o igual a `0`.
- `resolution.w` y `resolution.h` son obligatorios y deben ser enteros positivos.
- No se permiten campos extra.
- No enviar `id` ni `projectId`.

### Ejemplo de request

```ts
const response = await fetch("/api/v1/projects", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Mi nuevo proyecto",
    duration: 0,
    resolution: {
      w: 1920,
      h: 1080,
    },
  }),
});

const result = await response.json();
```

### Respuesta `201`

```ts
type CreateProjectResponse = {
  success: true;
  message: "Project created successfully";
  data: {
    project: ApiProject;
    initialEditorState: InitialEditorState;
  };
};

type ApiProject = {
  projectId: string;
  name: string;
  duration: number;
  resolution: {
    w: number;
    h: number;
  };
  createdAt: string;
  updatedAt: string;
};

type InitialEditorState = {
  projectId: string;
  project: {
    projectName: string;
    duration: number;
    resolution: {
      w: number;
      h: number;
    };
  };
  playback: {
    currentTime: number;
    isPlaying: boolean;
    zoomLevel: number;
  };
  selection: {
    selectedElementId: string | null;
    selectionSource: string | null;
  };
  assets: unknown[];
  tracks: unknown[];
  updatedAt: string;
};
```

Ejemplo de respuesta:

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "projectId": "proj_9f3c5d0d4a9a44cb8a3d4d63f5d0f84b",
      "name": "Mi nuevo proyecto",
      "duration": 0,
      "resolution": {
        "w": 1920,
        "h": 1080
      },
      "createdAt": "2026-04-29T09:00:00.000Z",
      "updatedAt": "2026-04-29T09:00:00.000Z"
    },
    "initialEditorState": {
      "projectId": "proj_9f3c5d0d4a9a44cb8a3d4d63f5d0f84b",
      "project": {
        "projectName": "Mi nuevo proyecto",
        "duration": 0,
        "resolution": {
          "w": 1920,
          "h": 1080
        }
      },
      "playback": {
        "currentTime": 0,
        "isPlaying": false,
        "zoomLevel": 100
      },
      "selection": {
        "selectedElementId": null,
        "selectionSource": null
      },
      "assets": [],
      "tracks": [],
      "updatedAt": "2026-04-29T09:00:00.000Z"
    }
  }
}
```

## Cargar proyectos

### Listar proyectos

```http
GET /api/v1/projects
```

Respuesta `200`:

```ts
type ListProjectsResponse = {
  success: true;
  message: "Projects fetched successfully";
  data: ApiProject[];
};
```

Los proyectos se devuelven ordenados por `updatedAt` y `createdAt` descendente.

### Obtener un proyecto

```http
GET /api/v1/projects/:projectId
```

Respuesta `200`:

```ts
type GetProjectResponse = {
  success: true;
  message: "Project fetched successfully";
  data: ApiProject;
};
```

### Obtener estado del editor

```http
GET /api/v1/projects/:projectId/editor-state
```

Respuesta `200`:

```ts
type GetEditorStateResponse = {
  success: true;
  message: "Editor state fetched successfully";
  data: InitialEditorState;
};
```

Este endpoint no crea proyectos automaticamente. Si el proyecto no existe, devuelve `404`.

## Errores

### Validacion

```http
422 Unprocessable Entity
```

```ts
type ValidationErrorResponse = {
  success: false;
  message: "Validation failed";
  errors: Array<{
    field: string;
    message: string;
  }>;
};
```

Ejemplos de campos que pueden fallar:

- `name`
- `duration`
- `resolution`
- `resolution.w`
- `resolution.h`
- `id`
- `projectId`
- cualquier campo no permitido

### Proyecto no encontrado

```http
404 Not Found
```

```json
{
  "success": false,
  "message": "Project not found"
}
```

### MongoDB no conectado

```http
503 Service Unavailable
```

```json
{
  "success": false,
  "message": "MongoDB is not connected"
}
```

### Error interno

```http
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Server error"
}
```

## Ejemplo de integracion frontend

```ts
async function createProject(input: CreateProjectPayload) {
  const response = await fetch("/api/v1/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result;
  }

  return result.data;
}

async function initializeEditor() {
  const { project, initialEditorState } = await createProject({
    name: "Mi nuevo proyecto",
    resolution: {
      w: 1920,
      h: 1080,
    },
  });

  localStorage.setItem("currentProjectId", project.projectId);

  return initialEditorState;
}
```

## Notas para frontend

- Usar `initialEditorState` directamente como estado inicial del editor tras crear proyecto.
- Persistir `project.projectId` para navegacion, guardado y recarga.
- No asumir que `GET /api/v1/projects/:projectId/editor-state` crea un estado si el proyecto no existe.
- Si se recibe `422`, mostrar los mensajes de `errors` junto al campo correspondiente.
- Si se recibe `503`, tratarlo como indisponibilidad temporal del backend/base de datos.
