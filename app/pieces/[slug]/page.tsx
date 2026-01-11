import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import TacticalBlog from '@/components/tactical-blog'
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

  return {
    title: `${piece.title} · toni.ltd`,
    description: piece.excerpt,
  }
}

export default async function PiecePage({ params }: PiecePageProps) {
  const { slug } = await params
  const pieces = await getPieces()
  const piece = pieces.find((entry) => entry.slug === slug)

  if (!piece) {
    notFound()
  }

  return <TacticalBlog pieces={pieces} initialPieceId={piece.id} />
}
