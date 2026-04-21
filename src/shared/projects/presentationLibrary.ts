import heroImage from '../../assets/hero.png'
import { useEditorStore } from '../store'
import {
  AUDIO_TRACK_ID,
  AUDIO_TRACK_NAME,
  MEDIA_TRACK_ID,
  MEDIA_TRACK_NAME,
  TEXT_TRACK_ID,
  TEXT_TRACK_NAME,
} from '../store/defaultTracks'
import type { ImageElement, MediaAsset, ShapeElement, TextElement, Track } from '../types/editor'

export type PresentationProjectStatus = 'draft' | 'review' | 'published'

export type PresentationThumbnail = {
  gradient: string
  title: string
  subtitle: string
  bullets: string[]
}

export type PresentationProject = {
  id: string
  name: string
  description: string
  owner: string
  status: PresentationProjectStatus
  slides: number
  durationSeconds: number
  resolution: { w: number; h: number }
  lastEditedAt: string
  collaborators: number
  tags: string[]
  thumbnail: PresentationThumbnail
  tracks: Track[]
  assets: MediaAsset[]
}

function createTextElement(
  overrides: Pick<TextElement, 'id' | 'name' | 'text' | 'startTime' | 'duration'> &
    Partial<TextElement>,
): TextElement {
  const { id, name, text, startTime, duration, ...rest } = overrides

  return {
    id,
    type: 'text',
    name,
    startTime,
    duration,
    opacity: 1,
    effects: [],
    x: 180,
    y: 160,
    width: 1560,
    height: 160,
    rotation: 0,
    text,
    fontFamily: 'Inter',
    fontSize: 68,
    fontWeight: 700,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    lineHeight: 1.08,
    letterSpacing: 0,
    textAlign: 'left',
    ...rest,
  }
}

function createShapeElement(
  overrides: Pick<ShapeElement, 'id' | 'name' | 'startTime' | 'duration'> & Partial<ShapeElement>,
): ShapeElement {
  const { id, name, startTime, duration, ...rest } = overrides

  return {
    id,
    type: 'shape',
    name,
    startTime,
    duration,
    opacity: 1,
    effects: [],
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    rotation: 0,
    shapeType: 'rectangle',
    fillColor: '#111827',
    strokeColor: 'transparent',
    strokeWidth: 0,
    cornerRadius: 0,
    ...rest,
  }
}

function createImageElement(
  overrides: Pick<ImageElement, 'id' | 'name' | 'source' | 'startTime' | 'duration'> & Partial<ImageElement>,
): ImageElement {
  const { id, name, source, startTime, duration, ...rest } = overrides

  return {
    id,
    type: 'image',
    name,
    source,
    startTime,
    duration,
    opacity: 1,
    effects: [],
    x: 980,
    y: 170,
    width: 760,
    height: 760,
    rotation: 0,
    fit: 'cover',
    borderWidth: 0,
    borderColor: 'transparent',
    ...rest,
  }
}

export const presentationProjects: PresentationProject[] = [
  {
    id: 'launch-q3',
    name: 'Q3 Launch Roadshow',
    description: 'Deck para equipos de ventas con propuesta de valor, demo y cierre.',
    owner: 'Equipo Growth',
    status: 'published',
    slides: 14,
    durationSeconds: 96,
    resolution: { w: 1920, h: 1080 },
    lastEditedAt: '2026-04-18T11:40:00.000Z',
    collaborators: 4,
    tags: ['ventas', 'roadshow', 'producto'],
    thumbnail: {
      gradient: 'linear-gradient(135deg, #1f2937 0%, #0f172a 45%, #1d4ed8 100%)',
      title: 'Launch Q3',
      subtitle: 'Roadshow deck',
      bullets: ['Narrativa', 'Demo', 'CTA'],
    },
    tracks: [
      {
        id: TEXT_TRACK_ID,
        name: TEXT_TRACK_NAME,
        kind: 'text',
        elements: [
          createTextElement({
            id: 'launch-title',
            name: 'Titulo portada',
            text: 'Q3 Launch Roadshow',
            startTime: 0,
            duration: 24,
            x: 140,
            y: 120,
            width: 980,
          }),
          createTextElement({
            id: 'launch-subtitle',
            name: 'Subtitulo portada',
            text: 'How we scale pipeline in 90 days',
            startTime: 0,
            duration: 24,
            x: 142,
            y: 320,
            width: 920,
            fontSize: 44,
            fontWeight: 500,
            textColor: '#bfdbfe',
          }),
          createTextElement({
            id: 'launch-slide-2',
            name: 'Slide problemas',
            text: 'Pain points solved',
            startTime: 24,
            duration: 32,
            x: 140,
            y: 140,
            fontSize: 58,
            width: 980,
          }),
          createTextElement({
            id: 'launch-slide-3',
            name: 'Slide cierre',
            text: 'Close with confidence',
            startTime: 56,
            duration: 40,
            x: 140,
            y: 140,
            fontSize: 58,
            width: 1000,
          }),
        ],
      },
      {
        id: AUDIO_TRACK_ID,
        name: AUDIO_TRACK_NAME,
        kind: 'audio',
        elements: [],
      },
      {
        id: MEDIA_TRACK_ID,
        name: MEDIA_TRACK_NAME,
        kind: 'media',
        elements: [
          createShapeElement({
            id: 'launch-bg-1',
            name: 'Fondo portada',
            startTime: 0,
            duration: 24,
            fillColor: '#0f172a',
          }),
          createImageElement({
            id: 'launch-hero',
            name: 'Imagen hero',
            source: heroImage,
            startTime: 0,
            duration: 24,
            x: 1040,
            y: 140,
            width: 760,
            height: 820,
          }),
          createShapeElement({
            id: 'launch-bg-2',
            name: 'Fondo problemas',
            startTime: 24,
            duration: 32,
            fillColor: '#172554',
          }),
          createShapeElement({
            id: 'launch-bg-3',
            name: 'Fondo cierre',
            startTime: 56,
            duration: 40,
            fillColor: '#1e3a8a',
          }),
        ],
      },
    ],
    assets: [
      {
        id: 'asset-launch-hero',
        fileName: 'hero.png',
        type: 'image',
        source: heroImage,
        mimeType: 'image/png',
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    id: 'board-update-apr',
    name: 'Board Update April',
    description: 'Resumen ejecutivo mensual con metricas, riesgos y roadmap.',
    owner: 'Direccion',
    status: 'review',
    slides: 11,
    durationSeconds: 84,
    resolution: { w: 1920, h: 1080 },
    lastEditedAt: '2026-04-20T08:05:00.000Z',
    collaborators: 3,
    tags: ['board', 'metricas', 'roadmap'],
    thumbnail: {
      gradient: 'linear-gradient(140deg, #111827 0%, #134e4a 48%, #0f766e 100%)',
      title: 'Board Update',
      subtitle: 'April report',
      bullets: ['KPI', 'Riesgos', 'Plan Q4'],
    },
    tracks: [
      {
        id: TEXT_TRACK_ID,
        name: TEXT_TRACK_NAME,
        kind: 'text',
        elements: [
          createTextElement({
            id: 'board-title',
            name: 'Titulo board',
            text: 'Board Update - April',
            startTime: 0,
            duration: 28,
            x: 140,
            y: 130,
            width: 1040,
            fontSize: 62,
          }),
          createTextElement({
            id: 'board-kpi',
            name: 'Slide KPI',
            text: 'Revenue +18% YoY',
            startTime: 28,
            duration: 28,
            x: 180,
            y: 170,
            width: 980,
            fontSize: 70,
            textColor: '#99f6e4',
          }),
          createTextElement({
            id: 'board-risk',
            name: 'Slide riesgo',
            text: 'Main risk: onboarding speed',
            startTime: 56,
            duration: 28,
            x: 180,
            y: 170,
            width: 1140,
            fontSize: 54,
          }),
        ],
      },
      {
        id: AUDIO_TRACK_ID,
        name: AUDIO_TRACK_NAME,
        kind: 'audio',
        elements: [],
      },
      {
        id: MEDIA_TRACK_ID,
        name: MEDIA_TRACK_NAME,
        kind: 'media',
        elements: [
          createShapeElement({
            id: 'board-bg-1',
            name: 'Fondo board 1',
            startTime: 0,
            duration: 28,
            fillColor: '#0f172a',
          }),
          createShapeElement({
            id: 'board-bg-2',
            name: 'Fondo board 2',
            startTime: 28,
            duration: 28,
            fillColor: '#0f766e',
          }),
          createShapeElement({
            id: 'board-bg-3',
            name: 'Fondo board 3',
            startTime: 56,
            duration: 28,
            fillColor: '#164e63',
          }),
        ],
      },
    ],
    assets: [],
  },
  {
    id: 'onboarding-v2',
    name: 'Onboarding Narrative V2',
    description: 'Presentacion para nuevos clientes con estructura por valor de negocio.',
    owner: 'Customer Success',
    status: 'draft',
    slides: 9,
    durationSeconds: 72,
    resolution: { w: 1920, h: 1080 },
    lastEditedAt: '2026-04-16T15:20:00.000Z',
    collaborators: 2,
    tags: ['onboarding', 'clientes', 'storytelling'],
    thumbnail: {
      gradient: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 45%, #9a3412 100%)',
      title: 'Onboarding V2',
      subtitle: 'Client journey',
      bullets: ['Contexto', 'Impacto', 'Proximos pasos'],
    },
    tracks: [
      {
        id: TEXT_TRACK_ID,
        name: TEXT_TRACK_NAME,
        kind: 'text',
        elements: [
          createTextElement({
            id: 'onboarding-title',
            name: 'Titulo onboarding',
            text: 'Welcome to your first 30 days',
            startTime: 0,
            duration: 24,
            x: 120,
            y: 130,
            width: 1240,
            fontSize: 62,
          }),
          createTextElement({
            id: 'onboarding-middle',
            name: 'Slide narrativa',
            text: 'From setup to measurable wins',
            startTime: 24,
            duration: 24,
            x: 140,
            y: 210,
            width: 1240,
            fontSize: 56,
          }),
          createTextElement({
            id: 'onboarding-last',
            name: 'Slide cierre',
            text: 'Week 4: team autonomy',
            startTime: 48,
            duration: 24,
            x: 140,
            y: 210,
            width: 1140,
            fontSize: 56,
          }),
        ],
      },
      {
        id: AUDIO_TRACK_ID,
        name: AUDIO_TRACK_NAME,
        kind: 'audio',
        elements: [],
      },
      {
        id: MEDIA_TRACK_ID,
        name: MEDIA_TRACK_NAME,
        kind: 'media',
        elements: [
          createShapeElement({
            id: 'onboarding-bg-1',
            name: 'Fondo onboarding 1',
            startTime: 0,
            duration: 24,
            fillColor: '#312e81',
          }),
          createShapeElement({
            id: 'onboarding-bg-2',
            name: 'Fondo onboarding 2',
            startTime: 24,
            duration: 24,
            fillColor: '#4338ca',
          }),
          createShapeElement({
            id: 'onboarding-bg-3',
            name: 'Fondo onboarding 3',
            startTime: 48,
            duration: 24,
            fillColor: '#7c3aed',
          }),
        ],
      },
    ],
    assets: [],
  },
  {
    id: 'product-demo-es',
    name: 'Product Demo ES',
    description: 'Demo comercial en espanol con narrativa breve por caso de uso.',
    owner: 'Sales Iberia',
    status: 'published',
    slides: 12,
    durationSeconds: 88,
    resolution: { w: 1920, h: 1080 },
    lastEditedAt: '2026-04-19T17:30:00.000Z',
    collaborators: 5,
    tags: ['demo', 'es', 'casos de uso'],
    thumbnail: {
      gradient: 'linear-gradient(140deg, #111827 0%, #7f1d1d 50%, #dc2626 100%)',
      title: 'Demo ES',
      subtitle: 'Producto en accion',
      bullets: ['Live flow', 'Casos reales', 'ROI'],
    },
    tracks: [
      {
        id: TEXT_TRACK_ID,
        name: TEXT_TRACK_NAME,
        kind: 'text',
        elements: [
          createTextElement({
            id: 'demo-title',
            name: 'Titulo demo',
            text: 'Demo comercial en vivo',
            startTime: 0,
            duration: 30,
            x: 130,
            y: 140,
            width: 1080,
            fontSize: 60,
          }),
          createTextElement({
            id: 'demo-middle',
            name: 'Slide valor',
            text: '3 casos de uso en 10 minutos',
            startTime: 30,
            duration: 28,
            x: 130,
            y: 210,
            width: 1100,
            fontSize: 52,
            textColor: '#fee2e2',
          }),
          createTextElement({
            id: 'demo-cta',
            name: 'Slide CTA',
            text: 'Activa piloto esta semana',
            startTime: 58,
            duration: 30,
            x: 130,
            y: 210,
            width: 1000,
            fontSize: 58,
          }),
        ],
      },
      {
        id: AUDIO_TRACK_ID,
        name: AUDIO_TRACK_NAME,
        kind: 'audio',
        elements: [],
      },
      {
        id: MEDIA_TRACK_ID,
        name: MEDIA_TRACK_NAME,
        kind: 'media',
        elements: [
          createShapeElement({
            id: 'demo-bg-1',
            name: 'Fondo demo 1',
            startTime: 0,
            duration: 30,
            fillColor: '#7f1d1d',
          }),
          createShapeElement({
            id: 'demo-bg-2',
            name: 'Fondo demo 2',
            startTime: 30,
            duration: 28,
            fillColor: '#991b1b',
          }),
          createShapeElement({
            id: 'demo-bg-3',
            name: 'Fondo demo 3',
            startTime: 58,
            duration: 30,
            fillColor: '#b91c1c',
          }),
        ],
      },
    ],
    assets: [],
  },
]

function cloneTracks(tracks: Track[]): Track[] {
  return tracks.map((track) => ({
    ...track,
    elements: track.elements.map((element) => ({
      ...element,
      effects: [...element.effects],
    })),
  }))
}

function cloneAssets(assets: MediaAsset[]): MediaAsset[] {
  return assets.map((asset) => ({ ...asset }))
}

export function loadPresentationProject(projectId: string): boolean {
  const project = presentationProjects.find((item) => item.id === projectId)

  if (!project) {
    return false
  }

  useEditorStore.setState({
    projectName: project.name,
    duration: project.durationSeconds,
    resolution: { ...project.resolution },
    tracks: cloneTracks(project.tracks),
    assets: cloneAssets(project.assets),
    selectedElementId: null,
    selectionSource: null,
    currentTime: 0,
    isPlaying: false,
    zoomLevel: 100,
  })

  return true
}
