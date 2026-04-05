import { NextResponse } from 'next/server'

import { runDigest } from '../../../../scripts/research/digest'

const CRON_SECRET = process.env.CRON_SECRET

// Force Node runtime so the digest module can use crypto + fs
export const runtime = 'nodejs'
// Never cache
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (CRON_SECRET) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await runDigest()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[cron/digest] failed:', error)
    return NextResponse.json(
      { error: 'Digest failed', detail: (error as Error).message },
      { status: 500 },
    )
  }
}
