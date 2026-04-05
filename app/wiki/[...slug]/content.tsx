'use client'

import Link from 'next/link'

import { Markdown } from '@/components/markdown'

interface WikiPageContentProps {
  title: string
  body: string
  kindDir: string
}

export function WikiPageContent({ title, body, kindDir }: WikiPageContentProps) {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-xs font-mono uppercase tracking-widest text-text-tertiary hover:text-text-primary"
        >
          &larr; back
        </Link>
        <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary ml-4">
          wiki / {kindDir}
        </span>
      </nav>
      <h1 className="text-2xl font-serif mb-8">{title}</h1>
      <article className="prose prose-sm max-w-none">
        <Markdown content={body} />
      </article>
    </main>
  )
}
