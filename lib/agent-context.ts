import type { Piece } from './pieces'
import type { AgentState } from './agent-types'

export function buildAgentContext(pieces: Piece[], state: AgentState) {
  const availablePieces = pieces
    .map((piece) => `- #${String(piece.id).padStart(3, '0')} ${piece.title} (${piece.readTime}, mood: ${piece.mood.join(', ')})`)
    .join('\n')

  return [
    'Current UI State:',
    `- selectedPieceId: ${state.selectedPieceId ?? 'none'}`,
    `- moodFilter: ${state.moodFilter}`,
    `- showExcerpts: ${state.showExcerpts ? 'on' : 'off'}`,
    `- compactView: ${state.compactView ? 'on' : 'off'}`,
    `- theme: ${state.theme}`,
    `- engine: ${state.engine}`,
    '',
    'Available pieces:',
    availablePieces || '- none',
    '',
    'User vocabulary:',
    '- “open piece 004” means open_piece with that id.',
    '- “filter by mood” means set_mood_filter.',
    '- “compact view” toggles compact mode.',
    '- “excerpts” toggles excerpt visibility.',
    '- “light/dark mode” means set_theme.',
    '- “focus/discover” means set_engine.',
  ].join('\n')
}
