'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useState, type FormEvent, type JSX } from 'react'

import { TerminalLoader } from '@/components/mobile/terminal-loader'
import styles from '@/components/mobile/layout.module.css'
import {
  CHAT_CONTENT_CLASSNAME,
  CHAT_ROLE_CLASSNAME,
  CHAT_ROLE_LABEL,
  CITATION_REGEX,
  type ChatMessage,
} from '@/hooks/use-tactical-blog-experience'

interface ChatSheetProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  chatInput: string
  setChatInput: (value: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
  provider: 'anthropic' | 'openai'
  setProvider: (provider: 'anthropic' | 'openai') => void
  apiKey: string
  setApiKey: (value: string) => void
  onCitation: (pieceId: number, fragmentOrder?: number) => void
  registerContainer: (node: HTMLDivElement | null) => void
  registerInput: (node: HTMLTextAreaElement | null) => void
  focusInput: () => void
}

export function ChatSheet({
  isOpen,
  onClose,
  messages,
  chatInput,
  setChatInput,
  onSubmit,
  isLoading,
  provider,
  setProvider,
  apiKey,
  setApiKey,
  onCitation,
  registerContainer,
  registerInput,
  focusInput,
}: ChatSheetProps) {
  const [showApi, setShowApi] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setShowApi(false)
      return
    }
    const timer = window.setTimeout(() => setShowApi(true), 150)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handle = window.requestAnimationFrame(() => focusInput())
    return () => window.cancelAnimationFrame(handle)
  }, [focusInput, isOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit()
    focusInput()
  }

  const renderedMessages = useMemo(() => {
    return messages.map((message) => {
      const roleLabel = CHAT_ROLE_LABEL[message.role]
      const roleClass = CHAT_ROLE_CLASSNAME[message.role]
      const contentClass = CHAT_CONTENT_CLASSNAME[message.role]
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
            className={styles.chatCitation}
            onClick={() => onCitation(pieceId, fragmentOrder)}
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
        <div key={message.id} className={styles.chatMessage}>
          <div className={clsx(styles.chatRole, roleClass)}>{roleLabel}</div>
          <div className={clsx(styles.chatContent, contentClass)}>{chunks.length ? chunks : message.content}</div>
        </div>
      )
    })
  }, [messages, onCitation])

  return (
    <>
      <div className={clsx(styles.chatOverlay, isOpen && styles.chatOverlayVisible)} onClick={onClose} aria-hidden />
      <section className={clsx(styles.chatSheet, isOpen && styles.chatSheetOpen)} aria-label="Chat system">
        <div className={styles.chatHandle}>
          <div className={styles.chatHandleBar} />
        </div>
        <header className={styles.chatHeader}>
          <span>CHAT SYSTEM</span>
          <button type="button" className={styles.chatClose} onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </header>

        <div ref={registerContainer} className={styles.chatMessages}>
          {renderedMessages}
          {isLoading && <TerminalLoader text="STREAMING" />}
        </div>

        <form className={styles.chatInputSection} onSubmit={handleSubmit}>
          <div className={clsx(styles.chatApiRow, showApi && styles.chatApiRowVisible)}>
            <label className={styles.chatLabel}>
              PROVIDER
              <select
                className={styles.chatProviderSelect}
                value={provider}
                onChange={(event) => setProvider(event.target.value as 'anthropic' | 'openai')}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label className={styles.chatLabel}>
              API KEY
              <input
                type="password"
                className={styles.chatApiInput}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Required to chat"
              />
            </label>
          </div>

          <label className={styles.chatTextareaLabel}>
            PROMPT
            <textarea
              className={styles.chatTextarea}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              rows={3}
              placeholder=">_ Ask the system..."
              disabled={isLoading}
              ref={registerInput}
            />
          </label>

          <div className={styles.chatSubmitRow}>
            <button type="submit" className={styles.chatSubmitButton} disabled={isLoading}>
              {isLoading ? 'SENDING…' : 'SEND'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
