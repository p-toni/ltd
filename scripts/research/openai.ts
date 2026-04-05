/**
 * JSON completion helper used across the research pipeline.
 *
 * Despite the filename, this module is provider-aware. Set LLM_PROVIDER
 * to "openai" (default) or "anthropic" and the corresponding API key env
 * var is read automatically. Callers don't pass or manage keys.
 */

type Provider = 'openai' | 'anthropic'

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini'

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_VERSION = '2023-06-01'

interface CompleteJsonParams {
  systemPrompt: string
  userPrompt: string
  model?: string
  maxTokens?: number
  temperature?: number
}

interface ProviderCall {
  apiKey: string
  systemPrompt: string
  userPrompt: string
  model: string
  maxTokens: number
  temperature: number
}

function resolveProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase()
  if (raw === 'anthropic' || raw === 'claude') return 'anthropic'
  if (raw === 'openai' || raw === '') return 'openai'
  throw new Error(`Unknown LLM_PROVIDER: ${raw}. Use "openai" or "anthropic".`)
}

function resolveApiKey(provider: Provider): string {
  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY is required for LLM_PROVIDER=anthropic')
    return key
  }
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is required for LLM_PROVIDER=openai (default)')
  return key
}

function extractJsonBlock(text: string) {
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) return null
  return text.slice(first, last + 1)
}

function parseJsonResponse<T>(content: string): T {
  try {
    return JSON.parse(content) as T
  } catch {
    const extracted = extractJsonBlock(content)
    if (!extracted) throw new Error('LLM response did not contain JSON')
    return JSON.parse(extracted) as T
  }
}

async function callOpenAI<T>({ apiKey, systemPrompt, userPrompt, model, maxTokens, temperature }: ProviderCall): Promise<T> {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
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
  if (!content) throw new Error('OpenAI completion missing content')
  return parseJsonResponse<T>(content)
}

async function callAnthropic<T>({ apiKey, systemPrompt, userPrompt, model, maxTokens, temperature }: ProviderCall): Promise<T> {
  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic request failed: ${errorText}`)
  }

  const payload = (await response.json()) as { content?: Array<{ type?: string; text?: string }> }
  const content = payload.content?.find((block) => block.type === 'text')?.text
  if (!content) throw new Error('Anthropic completion missing content')
  return parseJsonResponse<T>(content)
}

export async function completeJson<T>({
  systemPrompt,
  userPrompt,
  model,
  maxTokens = 800,
  temperature = 0.2,
}: CompleteJsonParams): Promise<T> {
  const provider = resolveProvider()
  const apiKey = resolveApiKey(provider)
  const resolvedModel = model ?? (provider === 'anthropic' ? ANTHROPIC_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL)

  const call = { apiKey, systemPrompt, userPrompt, model: resolvedModel, maxTokens, temperature }
  return provider === 'anthropic' ? callAnthropic<T>(call) : callOpenAI<T>(call)
}
