export type RouteSummary = {
  id: string
  name: string
  distanceKm: number
  updatedAt: string
  status: 'draft' | 'review'
}

export type RouteGeometryPoint = {
  lat: number
  lng: number
  distanceKm: number | undefined
}

export type RouteGeometry = {
  type: 'LineString'
  coordinates: RouteGeometryPoint[]
}

export type Poi = {
  id: string
  name: string
  type: 'supply' | 'coffee' | 'repair' | 'meetup'
  iconName: string
  distanceLabel: string
  description: string
  tone: string
  lat: number
  lng: number
}

export type RouteDetail = RouteSummary & {
  description: string
  geometry: RouteGeometry
}

export type RouteMapDataResponse = {
  route: RouteDetail
  pois: Poi[]
}
