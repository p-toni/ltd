'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type JSX } from 'react'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'
import {
  CHAT_ROLE_LABEL,
  CITATION_REGEX,
  type ChatMessage,
} from '@/hooks/use-tactical-blog-experience'
import { cn } from '@/lib/utils'

export function CommandBar() {
  const {
    chatMessages,
    agentInput,
    setAgentInput,
    handleAgentSubmit,
    isChatLoading,
    chatProvider,
    setChatProvider,
    chatApiKey,
    setChatApiKey,
    registerChatContainer,
    registerChatInput,
    focusChatInput,
    handleCitationClick,
    aiEnabled,
  } = useTacticalBlogContext()

  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    requestAnimationFrame(() => focusChatInput())
  }, [focusChatInput])

  const close = useCallback(() => {
    setIsOpen(false)
    setShowSettings(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isOpen && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault()
        open()
      }
      if (event.key === 'Escape' && isOpen) {
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, open, close])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleAgentSubmit(agentInput)
    focusChatInput()
  }

  const renderedMessages = useMemo(() => {
    return chatMessages.map((message) => {
      const roleLabel = CHAT_ROLE_LABEL[message.role]
      const isUser = message.role === 'user'
      const isError = message.role === 'error'
      const chunks: Array<string | JSX.Element> = []
      let lastIndex = 0
      const regex = new RegExp(CITATION_REGEX.source, 'g')
      let match: RegExpExecArray | null

      while ((match = regex.exec(message.content)) !== null) {
        const [full, pieceStr, fragmentStr] = match
        if (match.index > lastIndex) {
          chunks.push(message.content.slice(lastIndex, match.index))
        }
        const pieceId = Number(pieceStr)
        const fragmentOrder = fragmentStr ? Number(fragmentStr) : undefined
        chunks.push(
          <button
            key={`${message.id}-${match.index}`}
            type="button"
            className="inline-flex items-center border border-accent/40 bg-accent-muted text-accent text-[10px] tracking-[0.04em] px-1.5 mx-0.5 uppercase font-mono"
            onClick={() => handleCitationClick(pieceId, fragmentOrder)}
          >
            {full}
          </button>,
        )
        lastIndex = match.index + full.length
      }

      if (lastIndex < message.content.length) {
        chunks.push(message.content.slice(lastIndex))
      }

      return (
        <div
          key={message.id}
          className={cn(
            'flex gap-3 text-sm',
            isUser && 'justify-end',
          )}
        >
          {!isUser && (
            <span className={cn(
              'shrink-0 font-mono text-[11px] uppercase tracking-[0.04em] pt-0.5',
              isError ? 'text-accent' : 'text-text-tertiary',
            )}>
              {roleLabel}
            </span>
          )}
          <div className={cn(
            'max-w-[85%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
            isUser ? 'bg-surface text-text' : isError ? 'text-accent' : 'text-text-secondary',
          )}>
            {chunks.length ? chunks : message.content}
          </div>
          {isUser && (
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.04em] pt-0.5 text-text-tertiary">
              {roleLabel}
            </span>
          )}
        </div>
      )
    })
  }, [chatMessages, handleCitationClick])

  return (
    <>
      {/* FAB button */}
      {!isOpen && (
        <button
          type="button"
          onClick={open}
          className="fixed bottom-6 right-6 w-12 h-12 bg-accent text-white flex items-center justify-center z-40 hover:opacity-90 transition-opacity"
          aria-label="Open command bar"
        >
          <span className="font-mono text-lg font-bold">/</span>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === overlayRef.current) close() }}
        >
          <div className="command-bar-enter w-full max-w-[640px] max-h-[60vh] mx-4 flex flex-col border border-border-strong bg-surface-raised">
            {/* Header */}
            <header className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-text-tertiary">AGENT</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="font-mono text-[11px] text-text-tertiary hover:text-text uppercase tracking-[0.04em]"
                >
                  {showSettings ? 'HIDE' : 'SETTINGS'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="text-text-tertiary hover:text-text text-lg leading-none"
                  aria-label="Close command bar"
                >
                  ×
                </button>
              </div>
            </header>

            {/* Settings */}
            {showSettings && (
              <div className="px-4 py-3 border-b border-border grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-text-tertiary">Provider</span>
                  <select
                    value={chatProvider}
                    onChange={(e) => setChatProvider(e.target.value as 'anthropic' | 'openai')}
                    className="bg-surface border border-border text-text text-sm px-2 py-1.5 font-sans"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-text-tertiary">API Key</span>
                  <input
                    type="password"
                    value={chatApiKey}
                    onChange={(e) => setChatApiKey(e.target.value)}
                    placeholder="Required to chat"
                    className="bg-surface border border-border text-text text-sm px-2 py-1.5 font-sans"
                  />
                </label>
              </div>
            )}

            {/* Messages */}
            <div ref={registerChatContainer} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar min-h-0">
              {renderedMessages}
              {isChatLoading && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-accent uppercase tracking-[0.04em]">
                  <span className="animate-pulse">STREAMING</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-border px-4 py-3 shrink-0">
              {!aiEnabled ? (
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-text-tertiary py-2">
                  AI disabled
                </div>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    ref={registerChatInput}
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAgentSubmit(agentInput)
                        focusChatInput()
                      }
                    }}
                    rows={1}
                    placeholder="Ask about the pieces..."
                    disabled={isChatLoading}
                    className="flex-1 bg-surface border border-border text-text text-sm px-3 py-2 font-sans resize-none placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-accent text-white font-mono text-[11px] uppercase tracking-[0.04em] disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
