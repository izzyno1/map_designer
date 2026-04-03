export const SHANXI_FALLBACK_CENTER: [number, number] = [37.8735, 112.5624]
export const SHANXI_FALLBACK_ZOOM = 7

export const ROUTE_GEOMETRY_SNAP_MIN_POINTS = 2
export const ROUTE_GEOMETRY_SNAP_MAX_POINTS = 50

export function getRouteGeometrySnapDisabledReason(pointCount: number) {
  if (pointCount < ROUTE_GEOMETRY_SNAP_MIN_POINTS) {
    return "至少需要两个坐标点"
  }

  if (pointCount > ROUTE_GEOMETRY_SNAP_MAX_POINTS) {
    return `贴路最多支持 ${ROUTE_GEOMETRY_SNAP_MAX_POINTS} 个坐标点，请先删减路线坐标。`
  }

  return null
}
