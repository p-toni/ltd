'use client'

import { useCallback, useState, type FormEvent } from 'react'

export default function ClipPage() {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [token, setToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const authenticate = useCallback(async () => {
    setStatus('sending')
    try {
      const response = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (response.ok) {
        setAuthenticated(true)
        setStatus('idle')
        setMessage('')
      } else {
        setStatus('error')
        setMessage('Invalid token')
      }
    } catch {
      setStatus('error')
      setMessage('Connection failed')
    }
  }, [token])

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (!url.trim()) return

      setStatus('sending')
      try {
        const response = await fetch('/api/clip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url.trim(),
            note: note.trim() || undefined,
            tags: tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        })

        if (response.ok) {
          setStatus('success')
          setMessage('Clipped')
          setUrl('')
          setNote('')
          setTags('')
          setTimeout(() => setStatus('idle'), 2000)
        } else {
          const data = (await response.json()) as { error?: string }
          if (response.status === 401) {
            setAuthenticated(false)
            setStatus('idle')
          } else {
            setStatus('error')
            setMessage(data.error ?? 'Failed')
          }
        }
      } catch {
        setStatus('error')
        setMessage('Connection failed')
      }
    },
    [url, note, tags],
  )

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xs font-mono uppercase tracking-widest text-white/40">
          clip to inbox
        </h1>

        {!authenticated ? (
          <div className="space-y-3">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Auth token"
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              onKeyDown={(e) => e.key === 'Enter' && authenticate()}
            />
            <button
              type="button"
              onClick={authenticate}
              disabled={status === 'sending'}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white/20 disabled:opacity-50"
            >
              {status === 'sending' ? '...' : 'authenticate'}
            </button>
            {message && (
              <p className="text-xs font-mono text-red-400">{message}</p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              required
              autoFocus
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white/20 disabled:opacity-50"
            >
              {status === 'sending' ? '...' : status === 'success' ? 'clipped' : 'clip'}
            </button>
            {status === 'error' && (
              <p className="text-xs font-mono text-red-400">{message}</p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}
