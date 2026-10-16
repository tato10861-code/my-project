/**
 * @fileoverview Unit tests for the connection-string TLS normalisation.
 */
import assert from 'node:assert/strict'
import { withExplicitSslMode } from '../../lib/connection-string'

const base = 'postgresql://user:p%40ss@ep-example-123.us-east-2.aws.neon.tech/neondb'

test('rewrites the legacy aliases to verify-full and keeps everything else', () => {
  for (const mode of ['require', 'prefer', 'verify-ca']) {
    const out = new URL(withExplicitSslMode(`${base}?sslmode=${mode}&channel_binding=require`))
    assert.equal(out.searchParams.get('sslmode'), 'verify-full', mode)
    assert.equal(out.searchParams.get('channel_binding'), 'require')
    assert.equal(out.username, 'user')
    assert.equal(out.password, 'p%40ss')
    assert.equal(out.host, 'ep-example-123.us-east-2.aws.neon.tech')
    assert.equal(out.pathname, '/neondb')
  }
})

test('leaves explicit and unrelated modes alone', () => {
  for (const mode of ['verify-full', 'disable', 'no-verify', 'allow']) {
    const input = `${base}?sslmode=${mode}`
    assert.equal(withExplicitSslMode(input), input, mode)
  }
  assert.equal(withExplicitSslMode(base), base)
})

test('respects an explicit opt-in to libpq semantics', () => {
  const input = `${base}?uselibpqcompat=true&sslmode=require`
  assert.equal(withExplicitSslMode(input), input)
})

test('returns anything that is not a postgres URL unchanged', () => {
  assert.equal(withExplicitSslMode('not a url'), 'not a url')
  assert.equal(withExplicitSslMode(''), '')
  const http = 'https://example.com/?sslmode=require'
  assert.equal(withExplicitSslMode(http), http)
})
