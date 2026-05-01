import { useCallback } from "react";
import {
  createElementInProjectTrack,
  getProjectsApiErrorMessage,
  isElementsApiEnabled,
} from "../../../shared/api/projectsApi";
import { useEditorStore } from "../../../shared/store";
import {
  MEDIA_TRACK_ID,
  MEDIA_TRACK_NAME,
} from "../../../shared/store/defaultTracks";
import type { ShapeElement, Track } from "../../../shared/types/editor";
import type { ShapePreset } from "../types";

const SHAPE_PRESET_CONFIG: Record<
  ShapePreset,
  {
    label: string;
    shapeType: ShapeElement["shapeType"];
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    cornerRadius: number;
    width: number;
    height: number;
    x: number;
    y: number;
  }
> = {
  rectangle: {
    label: "Rectángulo",
    shapeType: "rectangle",
    fillColor: "#4f46e5",
    strokeColor: "#1e1b4b",
    strokeWidth: 0,
    cornerRadius: 12,
    width: 320,
    height: 180,
    x: 320,
    y: 220,
  },
  ellipse: {
    label: "Círculo",
    shapeType: "ellipse",
    fillColor: "#22c55e",
    strokeColor: "#14532d",
    strokeWidth: 0,
    // For renderers that only support borderRadius (not true ellipse drawing)
    cornerRadius: 9999,
    width: 220,
    height: 220,
    x: 380,
    y: 200,
  },
  background: {
    label: "Cuadrado",
    shapeType: "rectangle",
    fillColor: "#111827",
    strokeColor: "#111827",
    strokeWidth: 0,
    cornerRadius: 12,
    width: 260,
    height: 260,
    x: 360,
    y: 160,
  },
};

type AddShapeOptions = {
  preset?: ShapePreset;
  label?: string;
  dropPosition?: { x: number; y: number };
};

function buildShapeElement(
  sequence: number,
  { preset = "rectangle", label, dropPosition }: AddShapeOptions,
  startTime: number,
): ShapeElement {
  const config = SHAPE_PRESET_CONFIG[preset];
  const baseLabel = label ?? config.label;
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `shape-${Date.now()}-${sequence}`;

  const element: ShapeElement = {
    id,
    type: "shape",
    name,
    startTime,
    duration: 5,
    opacity: 1,
    effects: [],
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    rotation: 0,
    shapeType: config.shapeType,
    fillColor: config.fillColor,
    strokeColor: config.strokeColor,
    strokeWidth: config.strokeWidth,
    cornerRadius: config.cornerRadius,
  };

  if (dropPosition) {
    element.x = Math.round(dropPosition.x - element.width / 2);
    element.y = Math.round(dropPosition.y - element.height / 2);
  }

  return element;
}

function createMediaTrack(): Track {
  return {
    id: MEDIA_TRACK_ID,
    name: MEDIA_TRACK_NAME,
    kind: "media",
    elements: [],
  };
}

export function useAddShapeElement() {
  const tracks = useEditorStore((state) => state.tracks);
  const projectId = useEditorStore((state) => state.projectId);
  const createTrack = useEditorStore((state) => state.createTrack);
  const addElement = useEditorStore((state) => state.addElement);
  const selectElement = useEditorStore((state) => state.selectElement);
  const currentTime = useEditorStore((state) => state.currentTime);

  return useCallback(
    async (options: AddShapeOptions = {}) => {
      let mediaTrack = tracks.find((track) => track.id === MEDIA_TRACK_ID);
      if (!mediaTrack) {
        mediaTrack = createMediaTrack();
        createTrack(mediaTrack);
      }

      const sequence = mediaTrack.elements.filter(
        (element) => element.type === "shape",
      ).length;
      let element = buildShapeElement(sequence, options, currentTime);
      if (isElementsApiEnabled() && projectId) {
        try {
          element = (await createElementInProjectTrack(projectId, mediaTrack.id, element)) as ShapeElement;
        } catch (error) {
          console.error("[ElementLibrary][shape] create api failed", getProjectsApiErrorMessage(error));
          return null;
        }
      }
      addElement(mediaTrack.id, element);
      selectElement(element.id, "element-library", mediaTrack.id);
      return element;
    },
    [tracks, projectId, createTrack, addElement, selectElement, currentTime],
  );
}

