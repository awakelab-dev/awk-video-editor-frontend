import { useCallback } from "react";
import { useEditorStore } from "../../../shared/store";
import {
  MEDIA_TRACK_ID,
  MEDIA_TRACK_NAME,
} from "../../../shared/store/defaultTracks";
import type { VideoElement, Track } from "../../../shared/types/editor";

type AddVideoOptions = {
  assetId: string;
  label?: string;
  duration?: number;
  dropPosition?: { x: number; y: number };
  startTime?: number;
};

function createMediaTrack(): Track {
  return {
    id: MEDIA_TRACK_ID,
    name: MEDIA_TRACK_NAME,
    kind: "media",
    elements: [],
  };
}

function buildVideoElement(
  sequence: number,
  asset: {
    id: string;
    fileName: string;
    source: string;
    duration?: number;
    width?: number;
    height?: number;
  },
  options: AddVideoOptions,
  resolution: { w: number; h: number },
  startTime: number,
): VideoElement {
  const baseLabel = options.label ?? asset.fileName;
  const name = sequence === 0 ? baseLabel : `${baseLabel} ${sequence + 1}`;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `video-${Date.now()}-${sequence}`;

  const maxWidth = Math.round(resolution.w * 0.7);
  const maxHeight = Math.round(resolution.h * 0.7);
  const intrinsicWidth = asset.width ?? maxWidth;
  const intrinsicHeight = asset.height ?? maxHeight;
  const scale = Math.min(
    maxWidth / Math.max(intrinsicWidth, 1),
    maxHeight / Math.max(intrinsicHeight, 1),
    1,
  );
  const width = Math.max(160, Math.round(intrinsicWidth * scale));
  const height = Math.max(90, Math.round(intrinsicHeight * scale));
  let x = Math.round((resolution.w - width) / 2);
  let y = Math.round((resolution.h - height) / 2);

  if (options.dropPosition) {
    x = Math.round(options.dropPosition.x - width / 2);
    y = Math.round(options.dropPosition.y - height / 2);
  }

  return {
    id,
    type: "video",
    name,
    startTime,
    duration: options.duration ?? asset.duration ?? 5,
    opacity: 1,
    effects: [],
    x,
    y,
    width,
    height,
    rotation: 0,
    source: asset.source,
    trimStart: 0,
    trimEnd: options.duration ?? asset.duration ?? 5,
    playbackRate: 1,
    volume: 1,
    muted: false,
  };
}

export function useAddVideoElement() {
  const tracks = useEditorStore((state) => state.tracks);
  const assets = useEditorStore((state) => state.assets);
  const currentTime = useEditorStore((state) => state.currentTime);
  const resolution = useEditorStore((state) => state.resolution);
  const createTrack = useEditorStore((state) => state.createTrack);
  const addElement = useEditorStore((state) => state.addElement);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElementProperty = useEditorStore(
    (state) => state.updateElementProperty,
  );

  return useCallback(
    (options: AddVideoOptions) => {
      const asset = assets.find((a) => a.id === options.assetId);
      if (!asset) {
        console.warn("[ElementLibrary][video] asset not found", options);
        return null;
      }
      let mediaTrack = tracks.find((track) => track.id === MEDIA_TRACK_ID);
      if (!mediaTrack) {
        mediaTrack = createMediaTrack();
        createTrack(mediaTrack);
      }

      const sequence = mediaTrack.elements.filter(
        (element) => element.type === "video",
      ).length;
      const element = buildVideoElement(
        sequence,
        asset,
        options,
        resolution,
        options.startTime ?? currentTime,
      );
      addElement(mediaTrack.id, element);
      selectElement(element.id, "element-library");
      console.log("[ElementLibrary][video] created", {
        trackId: mediaTrack.id,
        element,
        assetId: asset.id,
      });

      if (!options.duration && !asset.duration) {
        try {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = asset.source;
          video.onloadedmetadata = () => {
            const duration = video.duration;
            if (Number.isFinite(duration) && duration > 0) {
              updateElementProperty(
                mediaTrack.id,
                element.id,
                "duration",
                duration,
              );
              updateElementProperty(
                mediaTrack.id,
                element.id,
                "trimEnd",
                duration,
              );
              if (
                Number.isFinite(video.videoWidth) &&
                Number.isFinite(video.videoHeight) &&
                video.videoWidth > 0 &&
                video.videoHeight > 0
              ) {
                const maxWidth = Math.round(resolution.w * 0.7);
                const maxHeight = Math.round(resolution.h * 0.7);
                const scale = Math.min(
                  maxWidth / video.videoWidth,
                  maxHeight / video.videoHeight,
                  1,
                );
                const width = Math.max(
                  160,
                  Math.round(video.videoWidth * scale),
                );
                const height = Math.max(
                  90,
                  Math.round(video.videoHeight * scale),
                );
                updateElementProperty(
                  mediaTrack.id,
                  element.id,
                  "width",
                  width,
                );
                updateElementProperty(
                  mediaTrack.id,
                  element.id,
                  "height",
                  height,
                );
                if (!options.dropPosition) {
                  updateElementProperty(
                    mediaTrack.id,
                    element.id,
                    "x",
                    Math.round((resolution.w - width) / 2),
                  );
                  updateElementProperty(
                    mediaTrack.id,
                    element.id,
                    "y",
                    Math.round((resolution.h - height) / 2),
                  );
                }
              }
              console.log("[ElementLibrary][video] duration resolved", {
                elementId: element.id,
                duration,
              });
            }
            video.src = "";
          };
          video.onerror = () => {
            video.src = "";
          };
        } catch {
          // ignore metadata failures
        }
      }

      return element;
    },
    [
      assets,
      tracks,
      currentTime,
      resolution,
      createTrack,
      addElement,
      selectElement,
      updateElementProperty,
    ],
  );
}

