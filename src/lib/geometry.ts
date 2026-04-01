import {
  SHANXI_FALLBACK_CENTER,
  SHANXI_FALLBACK_ZOOM,
} from './constants'
import type { Segment } from '../types/annotation'
import type { RouteGeometry, RouteGeometryPoint } from '../types/route'

export const geometryToLatLngTuples = (
  geometry: RouteGeometry,
): Array<[number, number]> =>
  geometry.coordinates.map(({ lat, lng }) => [lat, lng])

export const latLngTuplesToGeometry = (
  tuples: Array<[number, number]>,
): RouteGeometry =>
  recalculateGeometryDistances({
    type: 'LineString',
    coordinates: tuples.map(([lat, lng]) => ({
      lat,
      lng,
    })),
  })

export const clampSegmentIndexes = (
  startIndex: number,
  endIndex: number,
  length: number,
): { startIndex: number; endIndex: number } => ({
  startIndex: Math.max(0, Math.min(startIndex, Math.max(0, length - 1))),
  endIndex: Math.max(0, Math.min(endIndex, Math.max(0, length - 1))),
})

export const buildFallbackView = (
  points: RouteGeometryPoint[],
): { center: [number, number]; zoom: number } =>
  points.length > 0
    ? { center: [points[0].lat, points[0].lng], zoom: 11 }
    : { center: SHANXI_FALLBACK_CENTER, zoom: SHANXI_FALLBACK_ZOOM }

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

const calculateDistanceKm = (
  start: RouteGeometryPoint,
  end: RouteGeometryPoint,
): number => {
  const latDelta = toRadians(end.lat - start.lat)
  const lngDelta = toRadians(end.lng - start.lng)
  const startLat = toRadians(start.lat)
  const endLat = toRadians(end.lat)
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

const roundDistanceKm = (value: number): number => Number(value.toFixed(3))

const arePointsEqual = (
  first: RouteGeometryPoint,
  second: RouteGeometryPoint,
): boolean => first.lat === second.lat && first.lng === second.lng

const findInsertedIndex = (
  previousPoints: RouteGeometryPoint[],
  nextPoints: RouteGeometryPoint[],
): number => {
  for (let index = 0; index < previousPoints.length; index += 1) {
    if (!arePointsEqual(previousPoints[index], nextPoints[index])) {
      return index
    }
  }

  return previousPoints.length
}

const findDeletedIndex = (
  previousPoints: RouteGeometryPoint[],
  nextPoints: RouteGeometryPoint[],
): number => {
  for (let index = 0; index < nextPoints.length; index += 1) {
    if (!arePointsEqual(previousPoints[index], nextPoints[index])) {
      return index
    }
  }

  return nextPoints.length
}

const normalizeSegmentIndexes = (
  startIndex: number | undefined,
  endIndex: number | undefined,
  length: number,
): { startIndex: number | undefined; endIndex: number | undefined } => {
  if (startIndex === undefined || endIndex === undefined) {
    return { startIndex, endIndex }
  }

  if (length <= 0) {
    return { startIndex: undefined, endIndex: undefined }
  }

  const normalized = clampSegmentIndexes(
    Math.min(startIndex, endIndex),
    Math.max(startIndex, endIndex),
    length,
  )

  return normalized
}

const adjustSegmentIndexes = (
  previousPoints: RouteGeometryPoint[],
  nextPoints: RouteGeometryPoint[],
  segments: Segment[],
): Segment[] => {
  const previousLength = previousPoints.length
  const nextLength = nextPoints.length

  if (previousLength === nextLength) {
    return segments.map((segment) => ({
      ...segment,
      ...normalizeSegmentIndexes(segment.startIndex, segment.endIndex, nextLength),
    }))
  }

  if (nextLength === previousLength + 1) {
    const insertedIndex = findInsertedIndex(previousPoints, nextPoints)

    return segments.map((segment) => ({
      ...segment,
      ...normalizeSegmentIndexes(
        segment.startIndex === undefined
          ? undefined
          : segment.startIndex >= insertedIndex
            ? segment.startIndex + 1
            : segment.startIndex,
        segment.endIndex === undefined
          ? undefined
          : segment.endIndex >= insertedIndex
            ? segment.endIndex + 1
            : segment.endIndex,
        nextLength,
      ),
    }))
  }

  if (nextLength === previousLength - 1) {
    const deletedIndex = findDeletedIndex(previousPoints, nextPoints)
    const mapDeletedIndex = (value: number | undefined): number | undefined => {
      if (value === undefined) {
        return value
      }

      if (value < deletedIndex) {
        return value
      }

      if (value > deletedIndex) {
        return value - 1
      }

      return Math.min(deletedIndex, Math.max(0, nextLength - 1))
    }

    return segments.map((segment) => ({
      ...segment,
      ...normalizeSegmentIndexes(
        mapDeletedIndex(segment.startIndex),
        mapDeletedIndex(segment.endIndex),
        nextLength,
      ),
    }))
  }

  return segments.map((segment) => ({
    ...segment,
    ...normalizeSegmentIndexes(segment.startIndex, segment.endIndex, nextLength),
  }))
}

export const recalculateGeometryDistances = (
  geometry: RouteGeometry,
): RouteGeometry => {
  let distanceKm = 0

  return {
    ...geometry,
    coordinates: geometry.coordinates.map((point, index, coordinates) => {
      if (index === 0) {
        return {
          ...point,
          distanceKm: 0,
        }
      }

      distanceKm += calculateDistanceKm(coordinates[index - 1], point)

      return {
        ...point,
        distanceKm: roundDistanceKm(distanceKm),
      }
    }),
  }
}

export const applyGeometryEdit = (
  previousGeometry: RouteGeometry | null,
  nextGeometry: RouteGeometry,
  segments: Segment[],
): { geometry: RouteGeometry; segments: Segment[] } => {
  const geometry = recalculateGeometryDistances(nextGeometry)
  const previousPoints = previousGeometry?.coordinates ?? []

  return {
    geometry,
    segments: adjustSegmentIndexes(previousPoints, geometry.coordinates, segments),
  }
}
