import { describe, expect, it } from 'vitest'
import {
  applyGeometryEdit,
  buildFallbackView,
  clampSegmentIndexes,
  geometryToLatLngTuples,
  latLngTuplesToGeometry,
} from '../geometry'
import type { Segment } from '../../types/annotation'
import type { RouteGeometryPoint } from '../../types/route'

describe('geometry utilities', () => {
  it('converts geometry points to lat lng tuples', () => {
    const geometry = {
      type: 'LineString' as const,
      coordinates: [
        { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
        { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
      ],
    }

    expect(geometryToLatLngTuples(geometry)).toEqual([
      [37.8735, 112.5624],
      [37.8672, 112.5481],
    ])
  })

  it('round-trips lat lng tuples back to a line string', () => {
    const tuples: Array<[number, number]> = [
      [37.8735, 112.5624],
      [37.8672, 112.5481],
    ]

    const geometry = latLngTuplesToGeometry(tuples)

    expect(geometry.coordinates[0]).toEqual({
      lat: 37.8735,
      lng: 112.5624,
      distanceKm: 0,
    })
    expect(geometry.coordinates[1]).toMatchObject({
      lat: 37.8672,
      lng: 112.5481,
    })
    expect(geometry.coordinates[1].distanceKm).toBeCloseTo(1.437, 3)
  })

  it('clamps segment indexes into the available range', () => {
    expect(clampSegmentIndexes(-1, 99, 12)).toEqual({
      startIndex: 0,
      endIndex: 11,
    })
  })

  it('builds the Shanxi fallback view with no points', () => {
    expect(buildFallbackView([])).toEqual({
      center: [37.8735, 112.5624],
      zoom: 7,
    })
  })

  it('shifts segment indexes forward when inserting a geometry point before a segment', () => {
    const previousGeometry = {
      type: 'LineString' as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 5 },
        { lat: 0, lng: 0.02, distanceKm: 10 },
      ],
    }
    const nextGeometry = {
      type: 'LineString' as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.005, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 5 },
        { lat: 0, lng: 0.02, distanceKm: 10 },
      ],
    }
    const segments: Segment[] = [
      {
        id: 'segment-1',
        routeId: 'route-1',
        name: '赛段 1',
        type: 'tempo',
        startIndex: 1,
        endIndex: 2,
      },
    ]

    const result = applyGeometryEdit(previousGeometry, nextGeometry, segments)

    expect(result.segments).toEqual([
      expect.objectContaining({
        id: 'segment-1',
        startIndex: 2,
        endIndex: 3,
      }),
    ])
    expect(result.geometry.coordinates[1].distanceKm).toBeGreaterThan(0)
    expect(result.geometry.coordinates[2].distanceKm).toBeGreaterThan(
      result.geometry.coordinates[1].distanceKm ?? 0,
    )
  })

  it('recomputes distanceKm after deleting a point and keeps it monotonic', () => {
    const previousGeometry = {
      type: 'LineString' as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 10 },
        { lat: 0, lng: 0.02, distanceKm: 20 },
        { lat: 0, lng: 0.03, distanceKm: 30 },
      ],
    }
    const nextGeometry = {
      type: 'LineString' as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.02, distanceKm: 20 },
        { lat: 0, lng: 0.03, distanceKm: 30 },
      ],
    }

    const result = applyGeometryEdit(previousGeometry, nextGeometry, [])
    const distances = result.geometry.coordinates.map(
      (point: RouteGeometryPoint) => point.distanceKm ?? -1,
    )

    expect(distances[0]).toBe(0)
    expect(distances[1]).toBeLessThan(20)
    expect(distances[2]).toBeLessThan(30)
    expect(distances[1]).toBeGreaterThan(distances[0])
    expect(distances[2]).toBeGreaterThan(distances[1])
  })
})
