import { NextResponse } from 'next/server'

import { streamLlmResponse, type LlmProvider } from '@/lib/llm'
import { retrieveContext } from '@/lib/retrieval'

interface ChatRequestBody {
  prompt?: string
  pieceId?: number
  limitFragments?: number
  limitPieces?: number
  provider?: LlmProvider
  apiKey?: string
}

export async function POST(request: Request) {
  let body: ChatRequestBody

  try {
    body = (await request.json()) as ChatRequestBody
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const provider = (body.provider ?? 'anthropic') as LlmProvider
  if (provider !== 'anthropic' && provider !== 'openai') {
    return NextResponse.json({ error: `Unsupported provider: ${body.provider}` }, { status: 400 })
  }
  const apiKey = body.apiKey?.trim()

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  try {
    const retrieval = await retrieveContext(prompt, {
      limitFragments: body.limitFragments ?? 6,
      limitPieces: body.limitPieces ?? 3,
      filterPieceIds: body.pieceId ? [body.pieceId] : undefined,
      minScore: 0.1,
    })

    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        }

        try {
          send({ type: 'meta', retrieval })

          for await (const token of streamLlmResponse({ provider, apiKey, prompt, retrieval })) {
            if (!token) {
              continue
            }
            send({ type: 'token', delta: token })
          }

          send({ type: 'done' })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'LLM streaming failed'
          send({ type: 'error', message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process chat request'
    console.error('Chat API failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
