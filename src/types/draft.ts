export type DraftPoint = {
  lat: number;
  lng: number;
};

export type DraftViewport = {
  center: DraftPoint;
  zoom: number;
};

export type DraftPoi = {
  id: string;
  name: string;
  remark?: string;
  lat: number;
  lng: number;
};

export type DraftSegment = {
  id: string;
  name: string;
  remark?: string;
  points: DraftPoint[];
};

export type AnnotationDraft = {
  viewport: DraftViewport;
  pois: DraftPoi[];
  segments: DraftSegment[];
};

export type DraftSelection =
  | { kind: "none" }
  | { kind: "poi"; id: string }
  | { kind: "segment"; id: string };

export type DraftInteractionMode = "browse" | "create-poi" | "draw-segment";
