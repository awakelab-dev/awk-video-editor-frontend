# Frontend: cargar y guardar proyectos completos

Este documento actualiza el contrato de frontend con una regla clara:

> Frontend debe poder cargar todo el editor con una sola llamada a `GET /api/v1/projects/:projectId`.

El documento de `projects` en backend contiene metadata, tracks, elementos, assets, playback, selection y revision. Los elementos no se consideran una entidad externa que haya que cargar aparte para abrir el editor.

## Endpoints a usar

```txt
POST  /api/v1/projects
GET   /api/v1/projects
GET   /api/v1/projects/:projectId
PATCH /api/v1/projects/:projectId
POST  /api/v1/projects/:projectId/elements
```

No usar endpoints paralelos de estado del editor. El nuevo frontend debe leer y editar `project` directamente.

## Estado minimo que debe conservar frontend

```ts
type ProjectApiSession = {
  projectId: string;
  revision: number;
  sessionId?: string;
};
```

Reglas:

- `projectId` viene de backend.
- `revision` viene del proyecto y se actualiza tras cada mutacion.
- `sessionId` se conserva si backend lo devuelve.
- Frontend no debe generar IDs definitivos de proyecto ni de elemento.

## Shape recomendado en frontend

Backend devuelve un proyecto completo:

```ts
type Project = {
  projectId: string;
  name: string;
  duration: number;
  resolution: {
    w: number;
    h: number;
  };
  revision: number;
  sessionId: string;
  playback: {
    currentTime: number;
    isPlaying: boolean;
    zoomLevel: number;
  };
  selection: {
    selectedElementId: string | null;
    selectedTrackId?: string | null;
    selectionSource: "canvas" | "timeline" | "element-library" | null;
  };
  assets: Record<string, ProjectAsset>;
  tracks: ProjectTrack[];
  elements: Record<string, ProjectElement>;
  createdAt: string;
  updatedAt: string;
};
```

Las tracks contienen ids:

```ts
type ProjectTrack = {
  id: string;
  name: string;
  type?: "video" | "image" | "audio" | "text" | "shape" | "mixed";
  locked?: boolean;
  muted?: boolean;
  hidden?: boolean;
  elementIds: string[];
};
```

Para pintar la UI, frontend puede derivar tracks hidratadas:

```ts
function hydrateTracks(project: Project) {
  return project.tracks.map((track) => ({
    ...track,
    elements: track.elementIds
      .map((elementId) => project.elements[elementId])
      .filter(Boolean),
  }));
}
```

## Crear proyecto

```http
POST /api/v1/projects
Content-Type: application/json
```

Payload:

```ts
type CreateProjectPayload = {
  name: string;
  resolution: {
    w: number;
    h: number;
  };
  duration?: number;
};
```

Ejemplo:

```ts
async function createProject(input: CreateProjectPayload) {
  const response = await fetch("/api/v1/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result;
  }

  return result.data.project;
}
```

Despues de crear:

```ts
const project = await createProject({
  name: "Mi proyecto",
  resolution: { w: 1920, h: 1080 },
  duration: 0,
});

setProject(project);
setApiSession({
  projectId: project.projectId,
  revision: project.revision,
  sessionId: project.sessionId,
});
```

## Abrir proyecto existente

```http
GET /api/v1/projects/:projectId
```

Esta es la llamada principal para cargar el editor.

```ts
async function loadProject(projectId: string) {
  const response = await fetch(`/api/v1/projects/${projectId}`);
  const result = await response.json();

  if (!response.ok) {
    throw result;
  }

  return result.data;
}
```

No hacer llamadas adicionales para abrir el proyecto. El proyecto ya debe traer todo.

## Listar proyectos

```http
GET /api/v1/projects
```

Usar solo para pantallas de listado/selector. Este endpoint debe devolver resumenes, no proyectos completos.

## Crear elemento

Cuando el usuario crea un elemento, frontend llama:

```http
POST /api/v1/projects/:projectId/elements
Content-Type: application/json
```

Ejemplo:

```ts
async function createTextElement(
  projectId: string,
  input: Omit<TextElement, "id">,
) {
  const response = await fetch(`/api/v1/projects/${projectId}/elements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result;
  }

  return result.data as {
    projectId: string;
    elementId: string;
    type: string;
    revision: number;
  };
}
```

Payload de texto:

```json
{
  "type": "text",
  "name": "Titulo",
  "startTime": 0,
  "duration": 4,
  "opacity": 100,
  "x": 960,
  "y": 540,
  "width": 800,
  "height": 160,
  "rotation": 0,
  "text": "Hola mundo",
  "fontFamily": "Inter",
  "fontSize": 64,
  "fontWeight": 700,
  "textColor": "#FFFFFF",
  "backgroundColor": "transparent",
  "lineHeight": 1.1,
  "letterSpacing": 0,
  "textAlign": "center"
}
```

Reglas:

- No enviar `id`, `_id` ni `projectId` en el body.
- Backend guarda el elemento dentro del documento `projects`.
- La respuesta trae `elementId` y la nueva `revision`.
- Frontend debe actualizar `revision` despues de crear el elemento.

## Colocar elemento en una track

Si backend no soporta `attachToTrack` dentro de `POST /elements`, hacer dos pasos:

1. Crear elemento.
2. Enviar patch para anadirlo a la track.

```ts
async function addTextToTrack(
  projectId: string,
  trackId: string,
  textInput: Omit<TextElement, "id">,
) {
  const created = await createTextElement(projectId, textInput);

  currentRevision = created.revision;

  const patched = await patchProject(projectId, {
    revision: currentRevision,
    changes: [
      {
        type: "element.add-to-track",
        trackId,
        elementId: created.elementId,
        index: 0,
      },
      {
        type: "selection.update",
        selectedElementId: created.elementId,
        selectionSource: "element-library",
      },
    ],
  });

  currentRevision = patched.revision;
  return created.elementId;
}
```

Si backend acepta `attachToTrack`, frontend puede enviar `attachToTrack` en la creacion para evitar el segundo request.

## Editar proyecto con cambios parciales

Usar:

```http
PATCH /api/v1/projects/:projectId
Content-Type: application/json
```

Payload:

```ts
type ProjectPatchPayload = {
  revision: number;
  sessionId?: string;
  changes: ProjectChange[];
};
```

Cliente base:

```ts
async function patchProject(projectId: string, payload: ProjectPatchPayload) {
  const response = await fetch(`/api/v1/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result;
  }

  return result.data as {
    projectId: string;
    revision: number;
    appliedChanges: number;
    updatedAt: string;
  };
}
```

Cada respuesta exitosa actualiza la revision local.

## Operaciones principales

### Cambiar posicion

```json
{
  "revision": 9,
  "changes": [
    {
      "type": "element.update",
      "elementId": "text_abc",
      "patch": {
        "x": 340,
        "y": 180
      }
    }
  ]
}
```

### Cambiar timing

```json
{
  "revision": 10,
  "changes": [
    {
      "type": "element.update",
      "elementId": "text_abc",
      "patch": {
        "startTime": 2.5,
        "duration": 4.2
      }
    }
  ]
}
```

### Cambiar estilo

```json
{
  "revision": 11,
  "changes": [
    {
      "type": "element.update",
      "elementId": "text_abc",
      "patch": {
        "fontSize": 72,
        "textColor": "#FFDD55"
      }
    }
  ]
}
```

### Crear track

```json
{
  "revision": 12,
  "changes": [
    {
      "type": "track.add",
      "track": {
        "name": "Textos",
        "type": "text",
        "index": 1
      }
    }
  ]
}
```

### Anadir elemento a track

```json
{
  "revision": 13,
  "changes": [
    {
      "type": "element.add-to-track",
      "trackId": "track_text_01",
      "elementId": "text_abc",
      "index": 0
    }
  ]
}
```

### Mover elemento entre tracks

```json
{
  "revision": 14,
  "changes": [
    {
      "type": "element.move",
      "elementId": "text_abc",
      "toTrackId": "track_text_02",
      "toIndex": 1
    }
  ]
}
```

### Eliminar elemento de track

```json
{
  "revision": 15,
  "changes": [
    {
      "type": "element.remove-from-track",
      "elementId": "text_abc",
      "trackId": "track_text_01"
    }
  ]
}
```

### Eliminar elemento del proyecto

```json
{
  "revision": 16,
  "changes": [
    {
      "type": "element.delete",
      "elementId": "text_abc"
    }
  ]
}
```

Backend debe quitarlo tambien de cualquier `track.elementIds`.

### Cambiar seleccion

```json
{
  "revision": 17,
  "changes": [
    {
      "type": "selection.update",
      "selectedElementId": "text_abc",
      "selectedTrackId": "track_text_01",
      "selectionSource": "timeline"
    }
  ]
}
```

## Cuando enviar patches

Enviar cuando termine una accion:

- `drag end`;
- `resize end`;
- `rotate end`;
- `drop` entre tracks;
- cambio confirmado en input;
- add/remove track;
- add/remove element.

Evitar enviar en cada pixel de movimiento. Durante drag, actualizar estado local de forma optimista y persistir al final o con throttle.

## Manejo de revision y conflictos

Si una mutacion devuelve `200`:

```ts
currentRevision = result.data.revision;
```

Si backend devuelve `409`:

1. Pausar cola de guardado.
2. Hacer `GET /api/v1/projects/:projectId`.
3. Reemplazar estado local por el proyecto de backend o rebasear cambios pendientes.
4. Reintentar con la nueva revision.

No reintentar con la misma revision.

## Cola de guardado recomendada

Centralizar todo en una funcion:

```ts
async function persistProjectChanges(changes: ProjectChange[]) {
  const result = await patchProject(currentProjectId, {
    revision: currentRevision,
    sessionId: currentSessionId,
    changes,
  });

  currentRevision = result.revision;
}
```

La UI puede seguir modificando el estado local directamente; la capa API transforma esas acciones en `changes`.

## Errores a evitar

- No cargar recursos secundarios despues de cargar `/projects/:projectId`.
- No mandar el proyecto completo para un cambio pequeno.
- No generar `projectId` definitivo en frontend.
- No generar `elementId` definitivo en frontend.
- No mezclar `_id`, `id` y `elementId` en el contrato externo.
- No ignorar la nueva `revision` tras `POST /elements`.
- No hacer retry infinito ante `409`.

## Checklist de refactor frontend

- [ ] Crear cliente API centralizado para `projects`.
- [ ] Cambiar apertura de proyecto a `GET /api/v1/projects/:projectId`.
- [ ] Eliminar cualquier dependencia de endpoints paralelos para hidratar el editor.
- [ ] Guardar `projectId`, `revision`, `sessionId`.
- [ ] Crear elementos con `POST /api/v1/projects/:projectId/elements`.
- [ ] Actualizar revision tras crear elemento.
- [ ] Enviar cambios de tracks/elementos con `PATCH /api/v1/projects/:projectId`.
- [ ] Implementar manejo de `409`.
- [ ] Derivar tracks hidratadas desde `tracks[].elementIds` + `elements`.

## Resumen final

Crear proyecto:

```txt
POST /api/v1/projects
```

Cargar todo el editor:

```txt
GET /api/v1/projects/:projectId
```

Crear elemento dentro del proyecto:

```txt
POST /api/v1/projects/:projectId/elements
```

Guardar cambios incrementales:

```txt
PATCH /api/v1/projects/:projectId
```
