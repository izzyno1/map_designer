export const DEFAULT_DRAFT = {
  viewport: {
    center: {
      lat: 37.8735,
      lng: 112.5624,
    },
    zoom: 10,
  },
  pois: [],
  segments: [],
};

function cloneDefaultDraft() {
  return structuredClone(DEFAULT_DRAFT);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPoint(point) {
  return (
    point &&
    isFiniteNumber(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    isFiniteNumber(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

function toNonEmptyString(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const next = value.trim();
  return next.length > 0 ? next : fallback;
}

function normalizePoi(poi, index) {
  return {
    id: toNonEmptyString(poi?.id, `poi-${index + 1}`),
    name: toNonEmptyString(poi?.name, `标注点 ${index + 1}`),
    remark: typeof poi?.remark === "string" ? poi.remark : "",
    lat: poi.lat,
    lng: poi.lng,
  };
}

function normalizeSegment(segment, index) {
  return {
    id: toNonEmptyString(segment?.id, `segment-${index + 1}`),
    name: toNonEmptyString(segment?.name, `赛段 ${index + 1}`),
    remark: typeof segment?.remark === "string" ? segment.remark : "",
    points: segment.points.map((point) => ({
      lat: point.lat,
      lng: point.lng,
    })),
  };
}

export function isValidDraftPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const viewport = payload.viewport;
  if (!viewport || typeof viewport !== "object") {
    return false;
  }

  if (!isValidPoint(viewport.center)) {
    return false;
  }

  if (!isFiniteNumber(viewport.zoom) || viewport.zoom < 1 || viewport.zoom > 20) {
    return false;
  }

  if (!Array.isArray(payload.pois) || !Array.isArray(payload.segments)) {
    return false;
  }

  const hasInvalidPoi = payload.pois.some((poi) => {
    if (!poi || typeof poi !== "object") {
      return true;
    }

    if (!isValidPoint(poi)) {
      return true;
    }

    return typeof poi.name !== "string" || poi.name.trim().length === 0;
  });

  if (hasInvalidPoi) {
    return false;
  }

  const hasInvalidSegment = payload.segments.some((segment) => {
    if (!segment || typeof segment !== "object") {
      return true;
    }

    if (typeof segment.name !== "string" || segment.name.trim().length === 0) {
      return true;
    }

    if (!Array.isArray(segment.points) || segment.points.length < 2) {
      return true;
    }

    return segment.points.some((point) => !isValidPoint(point));
  });

  return !hasInvalidSegment;
}

export function normalizeDraftPayload(payload) {
  if (!isValidDraftPayload(payload)) {
    return cloneDefaultDraft();
  }

  return {
    viewport: {
      center: {
        lat: payload.viewport.center.lat,
        lng: payload.viewport.center.lng,
      },
      zoom: payload.viewport.zoom,
    },
    pois: payload.pois.map((poi, index) => normalizePoi(poi, index)),
    segments: payload.segments.map((segment, index) => normalizeSegment(segment, index)),
  };
}

export function getDefaultDraft() {
  return cloneDefaultDraft();
}
