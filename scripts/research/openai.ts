const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

interface OpenAIParams {
  apiKey: string
  systemPrompt: string
  userPrompt: string
  model?: string
  maxTokens?: number
  temperature?: number
}

function extractJsonBlock(text: string) {
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) {
    return null
  }
  return text.slice(first, last + 1)
}

export async function completeJson<T>({
  apiKey,
  systemPrompt,
  userPrompt,
  model = DEFAULT_MODEL,
  maxTokens = 800,
  temperature = 0.2,
}: OpenAIParams): Promise<T> {
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
  if (!content) {
    throw new Error('OpenAI completion missing content')
  }

  try {
    return JSON.parse(content) as T
  } catch (error) {
    const extracted = extractJsonBlock(content)
    if (!extracted) {
      throw new Error('OpenAI response did not contain JSON')
    }
    return JSON.parse(extracted) as T
  }
}
