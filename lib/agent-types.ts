export type AgentMoodFilter = 'all' | 'contemplative' | 'analytical' | 'exploratory' | 'critical'

export type AgentTheme = 'light' | 'dark'

export type AgentEngine = 'discover' | 'focus'

export type AgentAction =
  | { type: 'open_piece'; pieceId: number }
  | { type: 'set_mood_filter'; mood: AgentMoodFilter }
  | { type: 'toggle_excerpts'; value?: boolean }
  | { type: 'toggle_compact'; value?: boolean }
  | { type: 'set_theme'; theme: AgentTheme }
  | { type: 'set_engine'; engine: AgentEngine }
  | { type: 'noop'; reason?: string }

export interface AgentState {
  selectedPieceId: number | null
  moodFilter: AgentMoodFilter
  showExcerpts: boolean
  compactView: boolean
  theme: AgentTheme
  engine: AgentEngine
}

export interface AgentResponse {
  message: string
  actions: AgentAction[]
}
