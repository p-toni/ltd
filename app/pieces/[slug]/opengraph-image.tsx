import { ImageResponse } from 'next/og'

import { getPieces } from '@/lib/pieces'

export const runtime = 'nodejs'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const clampText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  const pieces = await getPieces()
  const piece = pieces.find((entry) => entry.slug === params.slug)
  const title = clampText(piece?.title ?? 'toni.ltd', 72)
  const excerpt = clampText(piece?.excerpt ?? 'stabilizing the human-AI loop', 160)
  const moods = piece?.mood ?? []
  const date = piece?.date ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          backgroundColor: '#101012',
          backgroundImage:
            'linear-gradient(135deg, #101012, #18181B)',
          color: '#EDEDEF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: '#E03E2D', fontWeight: 700 }}>
            TONI.LTD
          </div>
          {date ? (
            <div style={{ fontSize: 22, color: '#9b9b9b', letterSpacing: 2 }}>{date}</div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 70, fontWeight: 700, lineHeight: 1.08, maxWidth: '980px' }}>
            {title}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: '#b5b5b5', maxWidth: '980px' }}>
            {excerpt}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {moods.map((mood) => (
              <div
                key={mood}
                style={{
                  fontSize: 20,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(224, 62, 45, 0.15)',
                  color: '#E03E2D',
                  border: '1px solid rgba(224, 62, 45, 0.45)',
                  padding: '8px 14px',
                  borderRadius: 999,
                }}
              >
                {mood}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 20, color: '#6b6b6b', letterSpacing: 2 }}>
            /pieces/{params.slug}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
