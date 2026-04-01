import { describe, expect, it } from 'vitest'
import { getSegmentSlice, isSegmentIndexRangeValid } from '../segments'

describe('segment utilities', () => {
  it('returns the expected segment slice', () => {
    const coordinates = [
      { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
      { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
      { lat: 37.8581, lng: 112.534, distanceKm: 16.7 },
      { lat: 37.8451, lng: 112.5202, distanceKm: 28.4 },
    ]

    expect(getSegmentSlice(coordinates, 1, 2)).toEqual([
      { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
      { lat: 37.8581, lng: 112.534, distanceKm: 16.7 },
    ])
  })

  it('rejects reversed index ranges', () => {
    expect(isSegmentIndexRangeValid(4, 2, 5)).toBe(false)
  })

  it('accepts an in-bounds index range', () => {
    expect(isSegmentIndexRangeValid(0, 4, 5)).toBe(true)
  })
})
