const EARTH_RADIUS_KM = 6371;
const DEFAULT_OSRM_BASE_URL = "https://router.project-osrm.org";
export const MAX_SNAP_WAYPOINTS = 50;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function roundDistanceKm(value) {
  return Math.round(value * 1000) / 1000;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLatitude(value) {
  return isFiniteNumber(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return isFiniteNumber(value) && value >= -180 && value <= 180;
}

function isValidGeometryPoint(point) {
  return (
    point !== null &&
    typeof point === "object" &&
    !Array.isArray(point) &&
    isValidLatitude(point.lat) &&
    isValidLongitude(point.lng) &&
    (point.distanceKm === undefined || isFiniteNumber(point.distanceKm))
  );
}

function isValidOsrmCoordinate(point) {
  return (
    Array.isArray(point) &&
    point.length >= 2 &&
    isValidLongitude(point[0]) &&
    isValidLatitude(point[1])
  );
}

function resolveOsrmBaseUrl() {
  return (process.env.OSRM_BASE_URL ?? DEFAULT_OSRM_BASE_URL).replace(/\/+$/, "");
}

function buildOsrmUrl(geometry, osrmBaseUrl) {
  const coordinates = geometry.coordinates
    .map(({ lng, lat }) => `${lng},${lat}`)
    .join(";");

  return `${osrmBaseUrl}/route/v1/bike/${coordinates}?overview=full&geometries=geojson`;
}

function toGeometryCoordinates(routeCoordinates) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2 || !routeCoordinates.every(isValidOsrmCoordinate)) {
    throw new Error("Invalid OSRM geometry");
  }

  const geometryCoordinates = [];
  let distanceKm = 0;

  for (let index = 0; index < routeCoordinates.length; index += 1) {
    const [lng, lat] = routeCoordinates[index];
    if (index > 0) {
      distanceKm += haversineKm(routeCoordinates[index - 1], routeCoordinates[index]);
    }

    geometryCoordinates.push({
      lat,
      lng,
      distanceKm: roundDistanceKm(distanceKm),
    });
  }

  return geometryCoordinates;
}

export function isValidSnapGeometry(geometry) {
  return (
    isValidRouteGeometry(geometry) &&
    geometry.coordinates.length <= MAX_SNAP_WAYPOINTS
  );
}

export function isValidRouteGeometry(geometry) {
  return (
    geometry !== null &&
    typeof geometry === "object" &&
    !Array.isArray(geometry) &&
    geometry.type === "LineString" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2 &&
    geometry.coordinates.every(isValidGeometryPoint)
  );
}

export async function snapGeometry({ geometry, fetchImpl = globalThis.fetch } = {}) {
  if (!isValidSnapGeometry(geometry)) {
    throw new Error("Invalid geometry payload");
  }

  const response = await fetchImpl(buildOsrmUrl(geometry, resolveOsrmBaseUrl()));
  if (!response.ok) {
    throw new Error("Upstream route service failed");
  }

  const payload = await response.json();
  const routeGeometry = payload?.routes?.[0]?.geometry;
  if (!routeGeometry || routeGeometry.type !== "LineString") {
    throw new Error("Upstream route service returned invalid geometry");
  }

  if (!Array.isArray(routeGeometry.coordinates) || routeGeometry.coordinates.length < 2) {
    throw new Error("Upstream route service returned invalid geometry");
  }

  if (!routeGeometry.coordinates.every(isValidOsrmCoordinate)) {
    throw new Error("Upstream route service returned invalid geometry");
  }

  return {
    geometry: {
      type: "LineString",
      coordinates: toGeometryCoordinates(routeGeometry.coordinates),
    },
  };
}
