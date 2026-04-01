import { describe, expect, it } from 'vitest'
import {
  buildFallbackView,
  clampSegmentIndexes,
  geometryToLatLngTuples,
  latLngTuplesToGeometry,
} from '../geometry'

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

    expect(latLngTuplesToGeometry(tuples)).toEqual({
      type: 'LineString',
      coordinates: [
        { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
        { lat: 37.8672, lng: 112.5481, distanceKm: undefined },
      ],
    })
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
})
