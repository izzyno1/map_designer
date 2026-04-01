export type RouteSummary = {
  id: string
  name: string
  distanceKm?: number
  updatedAt?: string
  status?: string
}

export type RouteGeometryPoint = {
  lat: number
  lng: number
  distanceKm?: number
}

export type RouteGeometry = {
  type: 'LineString'
  coordinates: RouteGeometryPoint[]
}

export type Poi = {
  id: string
  name: string
  type: 'supply' | 'coffee' | 'repair' | 'meetup'
  iconName?: string
  distanceLabel?: string
  description?: string
  tone?: string
  lat: number
  lng: number
}

export type RouteDetail = RouteSummary & {
  description?: string
  geometry: RouteGeometry
}

export type RouteMapDataResponse = {
  routeId: string
  geometry: RouteGeometry
  pois: Poi[]
}
