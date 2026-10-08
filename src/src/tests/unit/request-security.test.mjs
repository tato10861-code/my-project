/**
 * @fileoverview Unit tests for the request security layer (rate limiting,
 * oversized-body detection, and origin validation).
 *
 * The module under test has no Next.js imports, so it runs directly under the
 * Node test runner:
 *   node --test tests/unit/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getClientKey,
  rateLimit,
  tooManyRequests,
  getConfiguredOrigin,
  hasOversizedBody,
} from '../../lib/request-security.ts'

test('getClientKey falls back to unknown when no IP headers exist', () => {
  const request = new Request('https://example.com')
  assert.equal(getClientKey(request, 'leads'), 'leads:unknown')
})

test('getClientKey prefers the first x-forwarded-for entry', () => {
  const request = new Request('https://example.com', {
    headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
  })
  assert.equal(getClientKey(request, 'leads'), 'leads:203.0.113.7')
})

test('getClientKey uses x-real-ip when forwarded header is absent', () => {
  const request = new Request('https://example.com', {
    headers: { 'x-real-ip': '198.51.100.4' },
  })
  assert.equal(getClientKey(request, 'events'), 'events:198.51.100.4')
})

test('rateLimit allows the first request and blocks past the limit', () => {
  const key = 'test:first'
  assert.equal(rateLimit(key, 2).allowed, true)
  assert.equal(rateLimit(key, 2).allowed, true)
  const blocked = rateLimit(key, 2)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfter >= 1)
})

test('rateLimit keeps independent keys independent', () => {
  const keyA = 'test:a'
  const keyB = 'test:b'
  rateLimit(keyA, 1)
  assert.equal(rateLimit(keyA, 1).allowed, false)
  assert.equal(rateLimit(keyB, 1).allowed, true)
})

test('tooManyRequests returns a 429 with retry headers', () => {
  const response = tooManyRequests(42)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '42')
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('hasOversizedBody rejects invalid content-length values', () => {
  const noHeader = new Request('https://example.com')
  assert.equal(hasOversizedBody(noHeader, 1024), false)

  const negative = new Request('https://example.com', {
    headers: { 'content-length': '-5' },
  })
  assert.equal(hasOversizedBody(negative, 1024), true)

  const notANumber = new Request('https://example.com', {
    headers: { 'content-length': 'abc' },
  })
  assert.equal(hasOversizedBody(notANumber, 1024), true)
})

test('hasOversizedBody flags bodies above the byte limit', () => {
  const large = new Request('https://example.com', {
    method: 'POST',
    headers: { 'content-length': '2048' },
  })
  assert.equal(hasOversizedBody(large, 1024), true)
  assert.equal(hasOversizedBody(large, 4096), false)
})

test('getConfiguredOrigin returns null without configuration', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.BETTER_AUTH_URL
  assert.equal(getConfiguredOrigin(), null)
  if (previous !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previous
})

test('getConfiguredOrigin normalizes a configured https origin', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://propauto-ai-al-closer-saas.vercel.app'
  assert.equal(getConfiguredOrigin(), 'https://propauto-ai-al-closer-saas.vercel.app')
  if (previous !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previous
  else delete process.env.NEXT_PUBLIC_SITE_URL
})

test('getConfiguredOrigin rejects plain http in production', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NODE_ENV = 'production'
  process.env.NEXT_PUBLIC_SITE_URL = 'http://insecure.example.com'
  assert.equal(getConfiguredOrigin(), null)
  if (previousNodeEnv !== undefined) process.env.NODE_ENV = previousNodeEnv
  else delete process.env.NODE_ENV
  if (previousUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previousUrl
  else delete process.env.NEXT_PUBLIC_SITE_URL
})