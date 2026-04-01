import { mockRouteDetails } from './routes'
import type { RouteMapDataResponse } from '../types/route'

export const mockMapData: Record<string, RouteMapDataResponse> = {
  'sx-taiyuan-river-loop': {
    route: mockRouteDetails['sx-taiyuan-river-loop'],
    pois: [
      {
        id: 'poi-1',
        name: '汾河补水点',
        type: 'supply',
        iconName: 'water',
        distanceLabel: '约 8km',
        description: '河边便利店，适合补水。',
        tone: '轻松补给',
        lat: 37.8672,
        lng: 112.5481,
      },
      {
        id: 'poi-2',
        name: '桥头咖啡站',
        type: 'coffee',
        iconName: 'coffee',
        distanceLabel: '约 28km',
        description: '适合短暂停留。',
        tone: '提神一下',
        lat: 37.8451,
        lng: 112.5202,
      },
    ],
  },
  'sx-jiexiu-ancient-city': {
    route: mockRouteDetails['sx-jiexiu-ancient-city'],
    pois: [],
  },
}
