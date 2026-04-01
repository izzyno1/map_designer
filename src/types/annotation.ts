import type { Poi } from './route'

export type Segment = {
  id: string
  routeId: string
  name: string
  type: 'climb' | 'flat' | 'tempo' | 'sprint'
  effort?: string
  rank?: string
  best?: string
  pr?: string
  likes?: number
  riders?: number
  startIndex?: number
  endIndex?: number
}

export type SelectedAnnotation =
  | { kind: 'poi'; id: string }
  | { kind: 'segment'; id: string }
  | { kind: 'geometry' }
  | { kind: 'new-poi' }
  | { kind: 'none' }

export type DraftPoi = Poi & { isNew?: boolean }
