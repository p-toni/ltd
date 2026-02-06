import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
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
        <div style={{ fontSize: 26, letterSpacing: 6, color: '#E03E2D', fontWeight: 700 }}>
          TONI.LTD
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.05, maxWidth: '980px' }}>
            Stabilizing the human-AI loop.
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: '#b5b5b5', maxWidth: '980px' }}>
            Tactical essays on control, feedback, and intentional technology.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 20,
            color: '#6b6b6b',
            letterSpacing: 2,
          }}
        >
          <div>FIELD NOTES</div>
          <div>www.toni.ltd</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
