# Resumen de cambios en la API de proyectos

Este documento resume los cambios aplicados en el frontend para alinear las llamadas a la API con el nuevo contrato descrito en `frontend-refactor-api.md`.

## Idea principal

El frontend ahora trata `project` como el recurso principal del editor.

Los elementos ya no se cargan ni se gestionan como una entidad paralela para abrir el editor. Ahora viven dentro del documento de proyecto, junto con metadata, tracks, assets, playback, selection, revision y sessionId.

## Endpoints usados

El frontend debe trabajar con estos endpoints:

```txt
POST  /api/v1/projects
GET   /api/v1/projects
GET   /api/v1/projects/:projectId
PATCH /api/v1/projects/:projectId
POST  /api/v1/projects/:projectId/elements
```

Ya no se debe usar el endpoint antiguo:

```txt
GET /api/v1/projects/:projectId/editor-state
```

Tampoco se debe usar `trackId` como query param al crear elementos:

```txt
POST /api/v1/projects/:projectId/elements?trackId=...
```

## Carga del editor

Antes, el editor se hidrataba desde:

```txt
GET /api/v1/projects/:projectId/editor-state
```

Ahora se carga todo el editor con una sola llamada:

```txt
GET /api/v1/projects/:projectId
```

La respuesta debe traer el proyecto completo:

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
  sessionId?: string;
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

Para pintar la UI, el frontend deriva las tracks hidratadas a partir de:

```txt
tracks[].elementIds + elements
```

## Estado minimo de sesion API

El frontend ahora guarda esta sesion minima:

```ts
type ProjectApiSession = {
  projectId: string;
  revision: number;
  sessionId?: string;
};
```

Reglas:

- `projectId` viene del backend.
- `revision` viene del proyecto.
- `revision` se actualiza despues de cada mutacion exitosa.
- `sessionId` se conserva si backend lo devuelve.
- El frontend no debe generar IDs definitivos de proyecto ni de elemento.

## Crear proyecto

Se usa:

```txt
POST /api/v1/projects
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

El frontend no envia `id` ni `projectId` al crear un proyecto.

Despues de crear, se guarda:

```ts
{
  projectId: project.projectId,
  revision: project.revision,
  sessionId: project.sessionId,
}
```

## Crear elementos

Antes se creaban elementos asi:

```txt
POST /api/v1/projects/:projectId/elements?trackId=track-text
```

Y el frontend enviaba un body con `id` y `trackId`.

Ahora se usa:

```txt
POST /api/v1/projects/:projectId/elements
```

El body no debe incluir:

```txt
id
_id
projectId
trackId
```

Ejemplo de body para texto:

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

Backend devuelve:

```ts
type CreateProjectElementResult = {
  projectId: string;
  elementId: string;
  type: string;
  revision: number;
  sessionId?: string;
};
```

El frontend usa el `elementId` devuelto por backend como ID definitivo del elemento.

## Colocar elemento en una track

Despues de crear el elemento, se actualiza el proyecto con:

```txt
PATCH /api/v1/projects/:projectId
```

Ejemplo:

```json
{
  "revision": 12,
  "sessionId": "session_abc",
  "changes": [
    {
      "type": "element.add-to-track",
      "trackId": "track-text",
      "elementId": "text_abc",
      "index": 0
    },
    {
      "type": "selection.update",
      "selectedElementId": "text_abc",
      "selectedTrackId": "track-text",
      "selectionSource": "element-library"
    }
  ]
}
```

## Editar elementos

Al cambiar un elemento no se envia el proyecto entero.

Se envia un patch incremental:

```txt
PATCH /api/v1/projects/:projectId
```

Payload base:

```ts
type ProjectPatchPayload = {
  revision: number;
  sessionId?: string;
  changes: ProjectChange[];
};
```

Ejemplo para mover un elemento:

```json
{
  "revision": 9,
  "sessionId": "session_abc",
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

Ejemplo para cambiar timing:

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

Ejemplo para cambiar estilo:

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

## Relacion con la store

La store sigue siendo la fuente local inmediata para que la UI responda rapido.

La idea de persistencia es:

```txt
store change -> ProjectChange[] -> PATCH /api/v1/projects/:projectId
```

Ejemplos de traduccion:

```txt
updateElementProperty(...) -> element.update
addElement(...)            -> element.add-to-track
moveElement(...)           -> element.move
removeElement(...)         -> element.delete o element.remove-from-track
selectElement(...)         -> selection.update
createTrack(...)           -> track.add
```

No todos los cambios de store deben persistirse con la misma frecuencia. Por ejemplo:

- durante drag o resize, la store puede actualizarse en vivo;
- al terminar la accion, se envia el patch;
- `currentTime` durante reproduccion no deberia enviarse en cada frame.

## Manejo de revision y conflictos

Cada mutacion usa la `revision` actual del proyecto.

Si backend responde correctamente, el frontend actualiza:

```ts
revision = result.revision;
```

Si backend responde `409`:

1. Se recarga el proyecto con `GET /api/v1/projects/:projectId`.
2. Se reemplaza o actualiza el estado local con la version del backend.
3. Se reintenta el patch una vez con la nueva `revision`.

No se debe reintentar indefinidamente ni reintentar con la misma `revision`.

## Cambios aplicados en codigo

Los cambios principales se hicieron en:

```txt
src/shared/api/projectsApi.ts
src/shared/api/textElementsApi.ts
src/shared/store/projectSlice.ts
src/shared/store/selectionSlice.ts
src/shared/store/tracksSlice.ts
src/features/element-library/hooks/*
src/features/element-library/components/ElementLibraryPanel.tsx
```

Resumen de implementacion:

- `projectsApi.ts` es ahora el cliente API central.
- `GET /projects/:projectId` reemplaza a `/editor-state`.
- `POST /projects/:projectId/elements` crea elementos sin IDs definitivos generados por frontend.
- `PATCH /projects/:projectId` aplica cambios incrementales al proyecto.
- Se guarda `projectId`, `revision` y `sessionId` en la store.
- Se guarda `selectedTrackId` junto a la seleccion.
- `textElementsApi.ts` queda como wrapper de compatibilidad sobre `projectsApi.ts`.

## Estado actual

Ya esta implementado:

- Crear proyecto.
- Listar proyectos.
- Cargar proyecto completo.
- Crear elementos dentro del proyecto.
- Actualizar `revision` tras crear elementos.
- Adjuntar elementos a tracks con `PATCH`.
- Actualizar selection con `PATCH`.
- Manejar conflicto `409` recargando proyecto y reintentando una vez.

Pendiente para completar la idea de autosave total:

- Conectar todas las mutaciones persistibles de la store a `persistProjectChanges(...)`.
- Enviar `element.update` cuando cambien propiedades desde inspector, canvas o timeline.
- Enviar `element.move` al mover entre tracks.
- Enviar `element.delete` o `element.remove-from-track` al borrar.
- Enviar `track.add` al crear tracks.
- Definir debounce o eventos de fin de accion para drag, resize y scrubbing.

