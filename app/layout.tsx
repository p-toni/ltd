import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import { GeistPixelSquare } from 'geist/font/pixel'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sans',
})

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.toni.ltd')
const siteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`
const siteDescription = 'stabilizing the human-AI loop'

export const metadata: Metadata = {
  title: 'toni.ltd',
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'toni.ltd',
    description: siteDescription,
    url: siteUrl,
    siteName: 'toni.ltd',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'toni.ltd',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'toni.ltd',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable} ${GeistPixelSquare.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
