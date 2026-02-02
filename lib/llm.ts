import { AgentResponse, AgentState } from './agent-types'
import { RetrievalResult } from './retrieval'

export type LlmProvider = 'anthropic' | 'openai'

interface StreamParams {
  provider: LlmProvider
  apiKey: string
  prompt: string
  retrieval: RetrievalResult
}

interface AgentParams {
  provider: LlmProvider
  apiKey: string
  prompt: string
  state: AgentState
  context: string
}

const OPENAI_MODEL = 'gpt-4o-mini'
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20240620'
const AGENT_OPENAI_MODEL = 'gpt-4o-mini'
const AGENT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20240620'

function buildContextPrompt(prompt: string, retrieval: RetrievalResult) {
  const lines: string[] = []

  if (retrieval.pieces.length || retrieval.fragments.length) {
    lines.push('CONTEXT:')

    retrieval.pieces.forEach(({ piece, score }) => {
      lines.push(
        `[#${String(piece.id).padStart(3, '0')}] ${piece.title} (${piece.readTime}) · score ${score.toFixed(2)}`,
      )
    })

    if (retrieval.fragments.length) {
      if (retrieval.pieces.length) {
        lines.push('')
      }
      retrieval.fragments.forEach(({ fragment, score }) => {
        const prefix = `[#${String(fragment.pieceId).padStart(3, '0')}-F${String(fragment.order).padStart(3, '0')}]`
        const snippet = fragment.text.replace(/\s+/g, ' ')
        lines.push(`${prefix} ${snippet} · score ${score.toFixed(2)}`)
      })
    }
  } else {
    lines.push('No direct matches found in the archive. Answer using general knowledge, but state the gap.')
  }

  lines.push('', 'TASK:', prompt.trim())

  return lines.join('\n')
}

function buildSystemPrompt() {
  return [
    'You are the tactical blog synthesizer.',
    'Answer concisely using the provided context fragments. When citing, reference the fragment IDs like [#004-F001].',
    'If context is insufficient, explicitly say so before offering general guidance.',
  ].join(' ')
}

function buildAgentSystemPrompt(context: string) {
  return `You are the Toni.LTD site agent. You can help readers navigate, filter, and control the interface.

You MUST return a JSON object with two keys:
- "message": a short response to show the user.
- "actions": an array of actions for the UI to take.

Valid actions:
- {"type":"open_piece","pieceId":number}
- {"type":"set_mood_filter","mood":"all"|"contemplative"|"analytical"|"exploratory"|"critical"}
- {"type":"toggle_excerpts","value"?:boolean}
- {"type":"toggle_compact","value"?:boolean}
- {"type":"set_theme","theme":"light"|"dark"}
- {"type":"set_engine","engine":"discover"|"focus"}
- {"type":"noop","reason"?:string}

Only include actions that match the user's request. If the request is informational, respond with message and a noop action.

${context}`
}

function parseAgentResponse(payload: string): AgentResponse {
  const parsed = JSON.parse(payload) as AgentResponse
  if (!parsed || typeof parsed.message !== 'string' || !Array.isArray(parsed.actions)) {
    throw new Error('Invalid agent response shape')
  }
  return parsed
}

export async function* streamLlmResponse({ provider, apiKey, prompt, retrieval }: StreamParams) {
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildContextPrompt(prompt, retrieval)

  switch (provider) {
    case 'openai':
      yield* streamOpenAI({ apiKey, systemPrompt, userPrompt })
      return
    case 'anthropic':
      yield* streamAnthropic({ apiKey, systemPrompt, userPrompt })
      return
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

export async function runAgentResponse({ provider, apiKey, prompt, state, context }: AgentParams) {
  const systemPrompt = buildAgentSystemPrompt(context)
  const userPrompt = `State: ${JSON.stringify(state)}\n\nUser request: ${prompt.trim()}`

  const content =
    provider === 'openai'
      ? await completeOpenAI({ apiKey, systemPrompt, userPrompt, model: AGENT_OPENAI_MODEL })
      : await completeAnthropic({ apiKey, systemPrompt, userPrompt, model: AGENT_ANTHROPIC_MODEL })

  return parseAgentResponse(content)
}

interface ProviderParams {
  apiKey: string
  systemPrompt: string
  userPrompt: string
}

interface CompletionParams extends ProviderParams {
  model: string
}

async function* streamOpenAI({ apiKey, systemPrompt, userPrompt }: ProviderParams) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${errorText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })

    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data:')) {
          continue
        }
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') {
          continue
        }
        const payload = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = payload.choices?.[0]?.delta?.content
        if (delta) {
          yield delta
        }
      }
    }
  }
}

async function* streamAnthropic({ apiKey, systemPrompt, userPrompt }: ProviderParams) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    throw new Error(`Anthropic request failed: ${errorText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const lines = chunk.split('\n')

      let dataLine: string | null = null
      let eventType: string | null = null

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataLine = line.slice(5).trim()
        }
      }

      if (!dataLine) {
        continue
      }

      if (dataLine === '[DONE]') {
        return
      }

      const payload = JSON.parse(dataLine) as {
        type?: string
        delta?: { type?: string; text?: string }
        content_block_delta?: { delta?: { text?: string } }
      }

      if (payload.type === 'content_block_delta') {
        const text = payload.delta?.text ?? payload.content_block_delta?.delta?.text
        if (text) {
          yield text
        }
      } else if (eventType === 'content_block_delta') {
        const text = payload.delta?.text ?? payload.content_block_delta?.delta?.text
        if (text) {
          yield text
        }
      }
    }
  }
}

async function completeOpenAI({ apiKey, systemPrompt, userPrompt, model }: CompletionParams) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${errorText}`)
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI completion missing content')
  }
  return content
}

async function completeAnthropic({ apiKey, systemPrompt, userPrompt, model }: CompletionParams) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic request failed: ${errorText}`)
  }

  const payload = (await response.json()) as { content?: Array<{ text?: string }> }
  const content = payload.content?.[0]?.text
  if (!content) {
    throw new Error('Anthropic completion missing content')
  }
  return content
}
