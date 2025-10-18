'use client'

/* eslint-disable react/jsx-no-duplicate-props */

import { useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import type { Image as ImageNode, ListItem, Paragraph, Root } from 'mdast'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { cn } from '@/lib/utils'

interface FragmentMeta {
  id?: string
  order: number
}

interface FragmentMetadataResult {
  map: Map<string, FragmentMeta>
  ids: string[]
}

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
    'img',
    'figure',
    'figcaption',
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
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'src',
      'alt',
      'title',
      'loading',
      'width',
      'height',
      'className',
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
  p: ({ node, children, className, ...rest }) =>
    renderParagraph({
      node: node as unknown as Paragraph,
      children,
      className: typeof className === 'string' ? className : undefined,
      fragment: undefined,
      extraProps: rest as Record<string, unknown>,
    }),
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
  code: ({
    node: _node,
    inline,
    className,
    children,
    ...props
  }: {
    node?: unknown
    inline?: boolean
    className?: string
    children?: ReactNode
  } & ComponentPropsWithoutRef<'code'>) => {
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
  img: ({ node: _node, className, loading, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt ?? ''}
      loading={loading ?? 'lazy'}
      className={cn('max-w-full rounded border border-black/10 bg-black/5', className)}
    />
  ),
}

interface ParagraphRenderOptions {
  node?: Paragraph
  children: ReactNode
  className?: string
  fragment?: FragmentMeta
  extraProps?: Record<string, unknown>
}

function renderParagraph({ node, children, className, fragment, extraProps }: ParagraphRenderOptions) {
  const baseProps: Record<string, unknown> = { ...(extraProps ?? {}) }
  if (fragment?.id) {
    baseProps.id = fragment.id
  }
  if (fragment?.order) {
    baseProps['data-fragment-order'] = fragment.order
  }

  const imageNode = node ? extractSingleImage(node) : null
  if (imageNode) {
    const caption = imageNode.title ?? imageNode.alt ?? ''
    return (
      <figure {...baseProps} className={cn('my-6', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageNode.url ?? ''}
          alt={imageNode.alt ?? ''}
          title={imageNode.title ?? undefined}
          loading="lazy"
          className="w-full rounded border border-black/10 bg-black/5"
        />
        {caption ? (
          <figcaption className="mt-2 text-center text-[10px] uppercase tracking-[0.25em]">{caption}</figcaption>
        ) : null}
      </figure>
    )
  }

  return (
    <p {...baseProps} className={cn('mb-4 text-sm leading-relaxed', className)}>
      {children}
    </p>
  )
}

function extractSingleImage(node: Paragraph): ImageNode | null {
  if (!node.children || node.children.length !== 1) {
    return null
  }

  const [child] = node.children
  return child.type === 'image' ? (child as ImageNode) : null
}

interface MarkdownProps {
  content: string
  className?: string
  pieceId?: number
}

export function Markdown({ content, className, pieceId }: MarkdownProps) {
  const fragmentIdPrefix =
    typeof pieceId === 'number' ? `piece-${String(pieceId).padStart(3, '0')}` : undefined

  const fragmentMetadata = useMemo<FragmentMetadataResult>(
    () => createFragmentMetadata(content, fragmentIdPrefix),
    [content, fragmentIdPrefix],
  )

  const fragmentAwareComponents = useMemo<Components>(() => {
    const map = fragmentMetadata.map

    return {
      ...markdownComponents,
      p: ({ node, children, className, ...props }) => {
        const key = createFragmentKey(node as unknown as Paragraph)
        const fragment = key ? map.get(key) : undefined
        return renderParagraph({
          node: node as unknown as Paragraph,
          children,
          className: typeof className === 'string' ? className : undefined,
          fragment,
          extraProps: props as Record<string, unknown>,
        })
      },
      li: ({ node, children, className, ...props }) => {
        const key = createFragmentKey(node as unknown as ListItem)
        const fragment = key ? map.get(key) : undefined
        const mergedProps = {
          ...(props as Record<string, unknown>),
          ...(fragment?.id ? { id: fragment.id } : {}),
          ...(fragment?.order ? { 'data-fragment-order': fragment.order } : {}),
        }

        return (
          <li
            {...mergedProps}
            className={cn(
              'mb-2 text-sm leading-relaxed',
              typeof className === 'string' ? className : undefined,
            )}
          >
            {children}
          </li>
        )
      },
    }
  }, [fragmentMetadata])

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        components={fragmentAwareComponents}
      >
        {content}
      </ReactMarkdown>
      {fragmentIdPrefix && fragmentMetadata.ids.length > 0 ? (
        <small className="hidden" data-fragments={fragmentMetadata.ids.join(',')} />
      ) : null}
    </div>
  )
}

function createFragmentMetadata(content: string, fragmentIdPrefix?: string | null): FragmentMetadataResult {
  const map = new Map<string, FragmentMeta>()
  const ids: string[] = []
  const processor = unified().use(remarkParse).use(remarkGfm)
  const tree = processor.parse(content) as Root
  let order = 0

  visit(tree, ['paragraph', 'listItem'], (node) => {
    const typed = node as Paragraph | ListItem
    order += 1
    const key = createFragmentKey(typed)
    const id =
      fragmentIdPrefix !== undefined && fragmentIdPrefix !== null
        ? `${fragmentIdPrefix}-fragment-${String(order).padStart(3, '0')}`
        : undefined

    if (key) {
      map.set(key, { id, order })
    }

    if (id) {
      ids.push(id)
    }
  })

  return { map, ids }
}

function createFragmentKey(node: Paragraph | ListItem | null | undefined): string | null {
  if (!node || !node.position) {
    return null
  }

  const { type, position } = node
  const offset = position.start?.offset

  if (typeof offset === 'number') {
    return `${type}-${offset}`
  }

  const line = position.start?.line ?? 0
  const column = position.start?.column ?? 0
  return `${type}-${line}-${column}`
}
/* eslint-disable react/jsx-no-duplicate-props */
