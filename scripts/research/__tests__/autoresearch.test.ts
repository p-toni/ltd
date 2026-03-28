import { describe, expect, it } from 'vitest'

import { parseDirectCommandArgs } from '../autoresearch'

describe('parseDirectCommandArgs', () => {
  it('parses simple quoted commands for direct execution', () => {
    expect(
      parseDirectCommandArgs('bash "/tmp/mock-autoresearch.sh" "piece-slug" "/tmp/output dir" "query | title"'),
    ).toEqual(['bash', '/tmp/mock-autoresearch.sh', 'piece-slug', '/tmp/output dir', 'query | title'])
  })

  it('falls back when shell operators are required', () => {
    expect(parseDirectCommandArgs('python3 script.py --query "$QUERY" | tee /tmp/out.txt')).toBeNull()
  })

  it('rejects malformed quoted commands', () => {
    expect(parseDirectCommandArgs('bash "unterminated')).toBeNull()
  })
})
