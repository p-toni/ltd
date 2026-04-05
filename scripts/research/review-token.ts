import crypto from 'node:crypto'

import type { WikiPageKind } from './types'

export type ReviewAction = 'publish' | 'reject'

export interface ReviewTokenPayload {
  pageId: string
  kind: WikiPageKind
  action: ReviewAction
  exp: number // unix seconds
}

const VALID_ACTIONS: ReviewAction[] = ['publish', 'reject']
const VALID_KINDS: WikiPageKind[] = ['concept', 'entity', 'source']

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

function sign(payload: string, secret: string): string {
  return base64url(crypto.createHmac('sha256', secret).update(payload).digest())
}

export function signReviewToken(payload: ReviewTokenPayload, secret: string): string {
  const encoded = base64url(JSON.stringify(payload))
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

export type VerifyReviewTokenResult =
  | { ok: true; payload: ReviewTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' | 'invalid-payload' }

export function verifyReviewToken(token: string, secret: string, nowSeconds: number = Math.floor(Date.now() / 1000)): VerifyReviewTokenResult {
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'malformed' }

  const [encoded, signature] = parts
  const expected = sign(encoded, secret)

  // Constant-time compare
  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== signatureBuffer.length) return { ok: false, reason: 'bad-signature' }
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return { ok: false, reason: 'bad-signature' }

  let payload: ReviewTokenPayload
  try {
    payload = JSON.parse(base64urlDecode(encoded).toString('utf8')) as ReviewTokenPayload
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (
    typeof payload.pageId !== 'string' ||
    !payload.pageId ||
    !VALID_KINDS.includes(payload.kind) ||
    !VALID_ACTIONS.includes(payload.action) ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false, reason: 'invalid-payload' }
  }

  if (payload.exp < nowSeconds) return { ok: false, reason: 'expired' }

  return { ok: true, payload }
}
