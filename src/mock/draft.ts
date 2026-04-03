import type { AnnotationDraft } from "../types/draft";
import { SHANXI_FALLBACK_CENTER, SHANXI_FALLBACK_ZOOM } from "../lib/constants";

export const mockDraft: AnnotationDraft = {
  viewport: {
    center: {
      lat: SHANXI_FALLBACK_CENTER[0],
      lng: SHANXI_FALLBACK_CENTER[1],
    },
    zoom: SHANXI_FALLBACK_ZOOM,
  },
  pois: [],
  segments: [],
};
