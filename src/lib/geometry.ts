import {
  SHANXI_FALLBACK_CENTER,
  SHANXI_FALLBACK_ZOOM,
} from './constants'
import type { RouteGeometry, RouteGeometryPoint } from '../types/route'

export const geometryToLatLngTuples = (
  geometry: RouteGeometry,
): Array<[number, number]> =>
  geometry.coordinates.map(({ lat, lng }) => [lat, lng])

export const latLngTuplesToGeometry = (
  tuples: Array<[number, number]>,
): RouteGeometry => ({
  type: 'LineString',
  coordinates: tuples.map(([lat, lng], index) => ({
    lat,
    lng,
    distanceKm: index === 0 ? 0 : undefined,
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
