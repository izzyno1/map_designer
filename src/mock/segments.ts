import type { Segment } from '../types/annotation'

export const mockSegmentsByRoute: Record<string, Segment[]> = {
  'sx-taiyuan-river-loop': [
    {
      id: 'segment-1',
      routeId: 'sx-taiyuan-river-loop',
      name: '汾河节奏段',
      type: 'tempo',
      effort: '持续输出',
      rank: 'A',
      best: '08:45',
      pr: '09:10',
      likes: 123,
      riders: 58,
      startIndex: 1,
      endIndex: 3,
    },
  ],
  'sx-jiexiu-ancient-city': [],
}
