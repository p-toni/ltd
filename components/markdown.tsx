'use client'

/* eslint-disable react/jsx-no-duplicate-props */

import { isValidElement, useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react'
import type { Image as ImageNode, ListItem, Paragraph, Root } from 'mdast'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PaperSource, TooltipDefinition } from '@/lib/tooltips'
import { PAPER_SOURCES, TOOLTIP_DEFINITIONS } from '@/lib/tooltips'
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
  protocols: {
    ...(defaultSchema.protocols ?? {}),
    href: [...(defaultSchema.protocols?.href ?? []), 'tooltip'],
  },
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

const SAFE_LINK_PROTOCOLS = /^(https?:|mailto:|tel:)/i

function urlTransform(href?: string) {
  if (!href) {
    return ''
  }

  if (href.startsWith('tooltip:')) {
    return href
  }

  if (
    href.startsWith('#') ||
    href.startsWith('/') ||
    href.startsWith('./') ||
    href.startsWith('../') ||
    SAFE_LINK_PROTOCOLS.test(href)
  ) {
    return href
  }

  return ''
}

function useIsCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const query = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setIsCoarse(query.matches)
    update()

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }

    query.addListener(update)
    return () => query.removeListener(update)
  }, [])

  return isCoarse
}

function TooltipBody({ tooltip, source }: { tooltip: TooltipDefinition; source?: PaperSource }) {
  return (
    <div className="space-y-2">
      {source ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/70 underline decoration-dotted underline-offset-2"
        >
          Source {tooltip.paper}
        </a>
      ) : (
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">
          Source {tooltip.paper}
        </div>
      )}
      <div className="text-xs font-semibold">{tooltip.title}</div>
      <div className="text-xs leading-relaxed text-black/80">{tooltip.body}</div>
    </div>
  )
}

function TooltipShell({
  tooltip,
  source,
  children,
}: {
  tooltip: TooltipDefinition
  source?: PaperSource
  children: ReactNode
}) {
  const isCoarse = useIsCoarsePointer()

  if (isCoarse) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          sideOffset={8}
          className="max-w-[280px] border border-black/20 bg-white p-3 text-black shadow-lg"
        >
          <TooltipBody tooltip={tooltip} source={source} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        sideOffset={8}
        className="max-w-[280px] border border-black/20 bg-white text-black shadow-lg"
      >
        <TooltipBody tooltip={tooltip} source={source} />
      </TooltipContent>
    </Tooltip>
  )
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextContent(child)).join('')
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>
    return extractTextContent(element.props.children ?? null)
  }

  return ''
}

function buildAsciiSectionHeader(raw: string): string | null {
  const normalized = raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  if (!normalized) {
    return null
  }

  const label = `>> ${normalized}`
  const minWidth = 24
  const baseLength = label.length + 2
  const innerWidth = Math.max(baseLength, minWidth)
  const padding = innerWidth - baseLength
  const lineContent = ` ${label}${' '.repeat(padding + 1)}`
  const top = `┌${'─'.repeat(innerWidth)}┐`
  const middle = `│${lineContent}│`
  const bottom = `└${'─'.repeat(innerWidth)}┘`

  return `${top}\n${middle}\n${bottom}`
}

type HeadingVariant = 'default' | 'ascii'

function createSectionHeadingRenderer(
  Tag: 'h2' | 'h3',
  options: { containerClassName: string; headingClassName: string },
) {
  type HeadingProps = ComponentPropsWithoutRef<typeof Tag> & { node?: unknown }

  const Renderer = ({
    node: _node,
    children,
    className,
    ...props
  }: HeadingProps) => {
    const ascii = buildAsciiSectionHeader(extractTextContent(children))
    const { containerClassName, headingClassName } = options
    const headingClasses = cn('markdown-heading', headingClassName, className)
    const HeadingTag = Tag

    return (
      <div className={cn(containerClassName)}>
        {ascii ? (
          <pre
            aria-hidden="true"
            role="presentation"
            className={cn(
              'markdown-ascii-heading',
              'mb-3 whitespace-pre text-[11px] font-mono uppercase text-[#ff6600]',
            )}
          >
            {ascii}
          </pre>
        ) : null}
        <HeadingTag {...(props as ComponentPropsWithoutRef<typeof Tag>)} className={headingClasses}>
          {children}
        </HeadingTag>
      </div>
    )
  }

  Renderer.displayName = `Markdown${String(Tag).toUpperCase()}AsciiHeading`

  return Renderer
}

function createMarkdownComponents(variant: HeadingVariant): Components {
  const h1 = ({ node: _node, children, ...props }: ComponentPropsWithoutRef<'h1'> & { node?: unknown }) => (
    <h1 {...props} className={cn('mb-6 text-3xl font-bold tracking-tight', props.className)}>
      {children}
    </h1>
  )

  const h2 =
    variant === 'ascii'
      ? createSectionHeadingRenderer('h2', {
          containerClassName: 'mt-8',
          headingClassName: 'mb-5 text-2xl font-semibold tracking-tight',
        })
      : ({ node: _node, children, ...props }: ComponentPropsWithoutRef<'h2'> & { node?: unknown }) => (
          <h2
            {...props}
            className={cn('mb-5 mt-8 text-2xl font-semibold tracking-tight', props.className)}
          >
            {children}
          </h2>
        )

  const h3 =
    variant === 'ascii'
      ? createSectionHeadingRenderer('h3', {
          containerClassName: 'mt-6',
          headingClassName: 'mb-4 text-xl font-semibold tracking-tight',
        })
      : ({ node: _node, children, ...props }: ComponentPropsWithoutRef<'h3'> & { node?: unknown }) => (
          <h3
            {...props}
            className={cn('mb-4 mt-6 text-xl font-semibold tracking-tight', props.className)}
          >
            {children}
          </h3>
        )

  return {
    h1,
    h2,
    h3,
    p: ({ node, children, className, ...rest }) =>
      renderParagraph({
        node: node as unknown as Paragraph,
        children,
        className: typeof className === 'string' ? className : undefined,
        fragment: undefined,
        extraProps: rest as Record<string, unknown>,
      }),
    a: ({ node: _node, children, className, href, ...props }) => {
      if (typeof href === 'string' && href.startsWith('tooltip:')) {
        const rawId = href.slice('tooltip:'.length).trim()
        const normalizedId = rawId.toUpperCase()
        const tooltip = TOOLTIP_DEFINITIONS[rawId] ?? TOOLTIP_DEFINITIONS[normalizedId]
        const source = tooltip ? PAPER_SOURCES[tooltip.paper] : undefined

        if (!tooltip) {
          return (
            <span className={cn('underline decoration-dotted underline-offset-2', className)}>
              {children}
            </span>
          )
        }

        return (
          <TooltipShell tooltip={tooltip} source={source}>
            <span
              tabIndex={0}
              className={cn(
                'cursor-help underline decoration-dotted underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                className,
              )}
            >
              {children}
            </span>
          </TooltipShell>
        )
      }

      return (
        <a
          {...props}
          href={href}
          className={cn(
            'text-xs font-semibold uppercase tracking-wide text-black underline underline-offset-4',
            className,
          )}
        >
          {children}
        </a>
      )
    },
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
      <blockquote {...props} className={cn('markdown-blockquote my-6 text-sm leading-relaxed', props.className)}>
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
  headingVariant?: HeadingVariant
}

export function Markdown({ content, className, pieceId, headingVariant = 'default' }: MarkdownProps) {
  const fragmentIdPrefix =
    typeof pieceId === 'number' ? `piece-${String(pieceId).padStart(3, '0')}` : undefined

  const baseComponents = useMemo<Components>(() => createMarkdownComponents(headingVariant), [headingVariant])

  const fragmentMetadata = useMemo<FragmentMetadataResult>(
    () => createFragmentMetadata(content, fragmentIdPrefix),
    [content, fragmentIdPrefix],
  )

  const fragmentAwareComponents = useMemo<Components>(() => {
    const map = fragmentMetadata.map

    return {
      ...baseComponents,
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
  }, [baseComponents, fragmentMetadata])

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        urlTransform={urlTransform}
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
