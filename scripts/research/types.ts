import type { Piece } from '../../lib/pieces'

export type Stance = 'support' | 'extend' | 'contradict'

export interface DiscoveryPlanFocusArea {
  id: string
  label: string
  rationale: string
  queries: string[]
  stanceTargets: Stance[]
}

export interface DiscoveryPlanSourcePolicy {
  domains: string[]
  feeds: string[]
  recencyDays: number
  maxResultsPerQuery: number
}

export interface DiscoveryPlan {
  version: number
  pieceId: number
  pieceSlug: string
  createdAt: string
  contentHash: string
  focusAreas: DiscoveryPlanFocusArea[]
  sourcePolicy: DiscoveryPlanSourcePolicy
}

export interface SearchResult {
  title: string
  url: string
  description?: string
  publishedAt?: string
  source?: string
}

export interface IngestedSource {
  url: string
  title: string
  publisher: string
  publishedAt?: string
  contentText: string
}

export interface VerificationResult {
  stance: Stance
  confidence: number
  summary: string
  evidence: string
  whyItMatters: string
  recommendedUpdate: 'insert' | 'skip'
}

export interface RewriteResult {
  summary: string
  riskAssessment: string
  rationale: string
  newContent: string
}

export interface PlanContext {
  piece: Piece
  nowIso: string
}

export interface RunStats {
  piecesReviewed: number
  proposals: number
  updatesApplied: number
}
