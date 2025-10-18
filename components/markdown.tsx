'use client'

/* eslint-disable react/jsx-no-duplicate-props */

import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const markdownSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', 'language-*'],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', 'token', 'token-*'],
    ],
  },
} as const

const markdownComponents: Components = {
  h1: ({ node: _node, children, ...props }) => (
    <h1 {...props} className={cn('mb-6 text-3xl font-bold tracking-tight', props.className)}>
      {children}
    </h1>
  ),
  h2: ({ node: _node, children, ...props }) => (
    <h2 {...props} className={cn('mb-5 mt-8 text-2xl font-semibold tracking-tight', props.className)}>
      {children}
    </h2>
  ),
  h3: ({ node: _node, children, ...props }) => (
    <h3 {...props} className={cn('mb-4 mt-6 text-xl font-semibold tracking-tight', props.className)}>
      {children}
    </h3>
  ),
  p: ({ node: _node, children, ...props }) => (
    <p {...props} className={cn('mb-4 text-sm leading-relaxed', props.className)}>
      {children}
    </p>
  ),
  a: ({ node: _node, children, ...props }) => (
    <a
      {...props}
      className={cn(
        'text-xs font-semibold uppercase tracking-wide text-black underline underline-offset-4',
        props.className,
      )}
    >
      {children}
    </a>
  ),
  ul: ({ node: _node, children, ...props }) => (
    <ul {...props} className={cn('mb-4 list-disc pl-5 text-sm leading-relaxed', props.className)}>
      {children}
    </ul>
  ),
  ol: ({ node: _node, children, ...props }) => (
    <ol {...props} className={cn('mb-4 list-decimal pl-5 text-sm leading-relaxed', props.className)}>
      {children}
    </ol>
  ),
  li: ({ node: _node, children, ...props }) => (
    <li {...props} className={cn('mb-2 text-sm leading-relaxed', props.className)}>
      {children}
    </li>
  ),
  blockquote: ({ node: _node, children, ...props }) => (
    <blockquote
      {...props}
      className={cn(
        'my-4 border-l-2 border-black/50 pl-4 text-sm italic leading-relaxed text-muted-foreground',
        props.className,
      )}
    >
      {children}
    </blockquote>
  ),
  code: ({ node: _node, inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code {...props} className={cn('rounded bg-black/5 px-1 py-[2px] text-xs font-mono', className)}>
          {children}
        </code>
      )
    }

    return (
      <pre className="mb-4 overflow-x-auto rounded border border-black/10 bg-black text-white">
        <code {...props} className={cn('block whitespace-pre px-4 py-3 text-xs font-mono', className)}>
          {children}
        </code>
      </pre>
    )
  },
  hr: ({ node: _node, ...props }) => <hr {...props} className={cn('my-8 border-black/20', props.className)} />,
  strong: ({ node: _node, children, ...props }) => (
    <strong {...props} className={cn('font-semibold', props.className)}>
      {children}
    </strong>
  ),
  em: ({ node: _node, children, ...props }) => (
    <em {...props} className={cn('italic', props.className)}>
      {children}
    </em>
  ),
  table: ({ node: _node, children, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table {...props} className={cn('w-full text-left text-sm', props.className)}>
        {children}
      </table>
    </div>
  ),
  thead: ({ node: _node, children, ...props }) => (
    <thead
      {...props}
      className={cn('border-b border-black/20 bg-black/5 text-[10px] uppercase tracking-wide', props.className)}
    >
      {children}
    </thead>
  ),
  th: ({ node: _node, children, ...props }) => (
    <th {...props} className={cn('px-3 py-2 text-left font-semibold', props.className)}>
      {children}
    </th>
  ),
  td: ({ node: _node, children, ...props }) => (
    <td {...props} className={cn('px-3 py-2 align-top text-sm', props.className)}>
      {children}
    </td>
  ),
}

interface MarkdownProps {
  content: string
  className?: string
  pieceId?: number
}

export function Markdown({ content, className, pieceId }: MarkdownProps) {
  const fragmentIdPrefix =
    typeof pieceId === 'number' ? `piece-${String(pieceId).padStart(3, '0')}` : undefined
  let fragmentIndex = 0

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        components={markdownComponents}
        transformImageUri={(uri) => uri}
        components={{
          ...markdownComponents,
          p: ({ node, children, ...props }) => {
            fragmentIndex += 1
            const id =
              fragmentIdPrefix !== undefined
                ? `${fragmentIdPrefix}-fragment-${String(fragmentIndex).padStart(3, '0')}`
                : undefined
            const { id: existingId, ['data-fragment-order']: _ignored, ...rest } = props as Record<string, unknown>
            return (
              <p
                {...rest}
                id={id ?? (typeof existingId === 'string' ? existingId : undefined)}
                data-fragment-order={fragmentIndex}
              >
                {children}
              </p>
            )
          },
          li: ({ node, children, ...props }) => {
            fragmentIndex += 1
            const id =
              fragmentIdPrefix !== undefined
                ? `${fragmentIdPrefix}-fragment-${String(fragmentIndex).padStart(3, '0')}`
                : undefined
            const { id: existingId, ['data-fragment-order']: _ignored, ...rest } = props as Record<string, unknown>
            return (
              <li
                {...rest}
                id={id ?? (typeof existingId === 'string' ? existingId : undefined)}
                data-fragment-order={fragmentIndex}
              >
                {children}
              </li>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
/* eslint-disable react/jsx-no-duplicate-props */
