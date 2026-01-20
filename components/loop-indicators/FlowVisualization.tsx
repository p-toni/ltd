'use client'

import { useEffect, useState } from 'react'
import { loadLoopState, type LoopState } from '@/lib/loop-tracking'

interface FlowVisualizationProps {
  pieceId: number
}

export function FlowVisualization({ pieceId }: FlowVisualizationProps) {
  const [loopState, setLoopState] = useState<LoopState | null>(null)

  useEffect(() => {
    const state = loadLoopState(pieceId)
    setLoopState(state)
  }, [pieceId])

  if (!loopState) return null

  const getStageIcon = (completed: boolean, inProgress: boolean) => {
    if (completed) return '✓'
    if (inProgress) return '◷'
    return '○'
  }

  const getStageColor = (completed: boolean, inProgress: boolean) => {
    if (completed) return 'text-[var(--convergent)]'
    if (inProgress) return 'text-[var(--te-orange)]'
    return 'text-muted-foreground'
  }

  const stages = [
    {
      name: 'READ',
      description: '(you are\ncurrently here)',
      completed: loopState.stages.read.completed,
      inProgress: !loopState.stages.read.completed,
    },
    {
      name: 'EXTRACT',
      description: '(tooltips,\nhighlights)',
      completed: loopState.stages.extract.completed,
      inProgress: loopState.stages.read.completed && !loopState.stages.extract.completed,
      metrics: `tooltips: ${loopState.stages.extract.tooltipsViewed}`,
    },
    {
      name: 'INTEGRATE',
      description: '(chat, notes)',
      completed: loopState.stages.integrate.completed,
      inProgress: loopState.stages.extract.completed && !loopState.stages.integrate.completed,
      metrics: `chat: ${loopState.stages.integrate.chatOpened ? 'yes' : 'no'}`,
    },
    {
      name: 'DECIDE',
      description: '(bookmarks,\nnext actions)',
      completed: loopState.stages.decide.completed,
      inProgress: loopState.stages.integrate.completed && !loopState.stages.decide.completed,
      metrics: `bookmarked: ${loopState.stages.decide.bookmarked ? 'yes' : 'no'}`,
    },
    {
      name: 'FEEDBACK',
      description: '(return visits,\ncitations)',
      completed: loopState.stages.feedback.completed,
      inProgress: loopState.stages.decide.completed && !loopState.stages.feedback.completed,
      metrics: `visits: ${loopState.stages.feedback.returnVisits}`,
    },
  ]

  // Calculate leakage points
  const getLeakageLevel = (fromStage: number, toStage: number): 'LOW' | 'MED' | 'HIGH' => {
    const from = stages[fromStage]
    const to = stages[toStage]

    if (from.completed && to.completed) return 'LOW'
    if (from.completed && !to.completed) return 'MED'
    return 'HIGH'
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="font-mono text-sm font-semibold tracking-wider">LEARNING LOOP FLOW</div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">PIECE #{pieceId.toString().padStart(3, '0')}</div>
        </div>

        {/* ASCII Flow Diagram */}
        <div className="space-y-6 font-mono text-[11px] leading-relaxed">
          {stages.map((stage, index) => (
            <div key={stage.name}>
              {/* Stage Box */}
              <div
                className={`border ${getStageColor(stage.completed, stage.inProgress)} ${
                  stage.inProgress ? 'border-[var(--te-orange)] bg-[var(--te-orange)]/5' : 'border-current'
                } p-4`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-1 font-semibold">
                      {getStageIcon(stage.completed, stage.inProgress)} {stage.name}
                    </div>
                    <div className="whitespace-pre-line text-[9px] text-muted-foreground">{stage.description}</div>
                    {stage.metrics && <div className="mt-2 text-[9px] text-muted-foreground">{stage.metrics}</div>}
                  </div>
                  <div className={`text-2xl ${getStageColor(stage.completed, stage.inProgress)}`}>
                    {getStageIcon(stage.completed, stage.inProgress)}
                  </div>
                </div>
              </div>

              {/* Arrow and Leakage Info */}
              {index < stages.length - 1 && (
                <div className="py-3 pl-8">
                  <div className="text-muted-foreground">↓</div>
                  <div className="text-[9px] text-muted-foreground">
                    ATTENTION FLOW
                    {index === 0 && ' (leakage: ' + getLeakageLevel(index, index + 1) + ')'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Leakage Summary */}
        <div className="mt-8 border border-black p-4">
          <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">LEAKAGE POINTS</div>
          <div className="space-y-2 font-mono text-[9px]">
            {[0, 1, 2, 3].map((i) => {
              const level = getLeakageLevel(i, i + 1)
              const color =
                level === 'LOW' ? 'text-[var(--convergent)]' : level === 'MED' ? 'text-[var(--neutral-loop)]' : 'text-[var(--divergent)]'

              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">⚠</span>
                  <span className="text-muted-foreground">
                    {stages[i].name} → {stages[i + 1].name}:
                  </span>
                  <span className={color}>{level}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 border border-[var(--te-orange)] bg-[var(--te-orange)]/5 p-4">
          <div className="mb-2 font-mono text-[10px] font-semibold tracking-wider text-[var(--te-orange)]">
            CLOSE THE LOOP
          </div>
          <div className="font-mono text-[9px] text-muted-foreground">
            After reading, answer: &quot;What decision changed?&quot;
          </div>
        </div>
      </div>
    </div>
  )
}
