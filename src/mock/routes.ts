import type { RouteDetail, RouteSummary } from '../types/route'

export const mockRouteSummaries: RouteSummary[] = [
  {
    id: 'sx-taiyuan-river-loop',
    name: '太原汾河晨骑环线',
    distanceKm: 71.5,
    updatedAt: '2026-03-31T10:00:00Z',
    status: 'draft',
  },
  {
    id: 'sx-jiexiu-ancient-city',
    name: '介休古城进阶训练线',
    distanceKm: 96.2,
    updatedAt: '2026-03-29T08:30:00Z',
    status: 'review',
  },
]

export const mockRouteDetails: Record<string, RouteDetail> = {
  'sx-taiyuan-river-loop': {
    id: 'sx-taiyuan-river-loop',
    name: '太原汾河晨骑环线',
    distanceKm: 71.5,
    updatedAt: '2026-03-31T10:00:00Z',
    status: 'draft',
    description: '沿汾河主线展开的城市长距离训练路线。',
    geometry: {
      type: 'LineString',
      coordinates: [
        { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
        { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
        { lat: 37.8581, lng: 112.534, distanceKm: 16.7 },
        { lat: 37.8451, lng: 112.5202, distanceKm: 28.4 },
        { lat: 37.8512, lng: 112.5383, distanceKm: 71.5 },
      ],
    },
  },
  'sx-jiexiu-ancient-city': {
    id: 'sx-jiexiu-ancient-city',
    name: '介休古城进阶训练线',
    distanceKm: 96.2,
    updatedAt: '2026-03-29T08:30:00Z',
    status: 'review',
    description: '适合节奏骑与赛段维护演示的晋中区域训练线。',
    geometry: {
      type: 'LineString',
      coordinates: [
        { lat: 37.0274, lng: 111.9131, distanceKm: 0 },
        { lat: 37.041, lng: 111.9278, distanceKm: 15.4 },
        { lat: 37.0553, lng: 111.9362, distanceKm: 40.1 },
        { lat: 37.0698, lng: 111.9429, distanceKm: 67.8 },
        { lat: 37.0841, lng: 111.955, distanceKm: 96.2 },
      ],
    },
  },
}
