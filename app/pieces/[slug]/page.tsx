import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import SystemDashboardWrapper from '@/components/system-dashboard-wrapper'
import { getPieces } from '@/lib/pieces'

interface PiecePageParams {
  slug: string
}

interface PiecePageProps {
  params: Promise<PiecePageParams>
}

export async function generateStaticParams() {
  const pieces = await getPieces()
  return pieces.map((piece) => ({ slug: piece.slug }))
}

export async function generateMetadata({ params }: PiecePageProps): Promise<Metadata> {
  const { slug } = await params
  const pieces = await getPieces()
  const piece = pieces.find((entry) => entry.slug === slug)
  if (!piece) {
    return {}
  }

  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.toni.ltd')
  const siteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`
  const pieceUrl = `${siteUrl}/pieces/${piece.slug}`
  const ogImage = `/pieces/${piece.slug}/opengraph-image`

  return {
    title: `${piece.title} · toni.ltd`,
    description: piece.excerpt,
    alternates: {
      canonical: pieceUrl,
    },
    openGraph: {
      title: piece.title,
      description: piece.excerpt,
      url: pieceUrl,
      siteName: 'toni.ltd',
      type: 'article',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: piece.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: piece.title,
      description: piece.excerpt,
      images: [ogImage],
    },
  }
}

export default async function PiecePage({ params }: PiecePageProps) {
  const { slug } = await params
  const pieces = await getPieces()
  const piece = pieces.find((entry) => entry.slug === slug)

  if (!piece) {
    notFound()
  }

  return <SystemDashboardWrapper pieces={pieces} initialPieceId={piece.id} />
}
