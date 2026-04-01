import type { RouteGeometryPoint } from '../types/route'

export const isSegmentIndexRangeValid = (
  startIndex: number | undefined,
  endIndex: number | undefined,
  length: number,
): boolean => {
  if (startIndex === undefined || endIndex === undefined) {
    return false
  }

  if (startIndex < 0 || endIndex < 0) {
    return false
  }

  if (startIndex > endIndex) {
    return false
  }

  return endIndex < length
}

export const getSegmentSlice = (
  coordinates: RouteGeometryPoint[],
  startIndex: number | undefined,
  endIndex: number | undefined,
): RouteGeometryPoint[] =>
  isSegmentIndexRangeValid(startIndex, endIndex, coordinates.length)
    ? (() => {
        const safeStartIndex = startIndex as number
        const safeEndIndex = endIndex as number

        return coordinates.slice(safeStartIndex, safeEndIndex + 1)
      })()
    : []
