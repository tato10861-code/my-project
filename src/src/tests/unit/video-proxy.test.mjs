/**
 * @fileoverview Unit tests for the byte-range video proxy.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { proxyVideo, videoResponseHeaders } from '../../lib/video-proxy.ts'

test('partial responses are never publicly cacheable and always vary on Range', () => {
  const upstream = new Headers({ 'content-type': 'video/mp4', 'content-range': 'bytes 0-99/1000', 'content-length': '100' })
  const partial = videoResponseHeaders(upstream, 206, 'public')
  assert.equal(partial.get('cache-control'), 'private, no-store')
  assert.equal(partial.get('vary'), 'Range')
  assert.equal(partial.get('content-range'), 'bytes 0-99/1000')

  const full = videoResponseHeaders(new Headers(), 200, 'public')
  assert.equal(full.get('cache-control'), 'public, max-age=3600')
  assert.equal(full.get('content-type'), 'video/mp4')

  assert.equal(videoResponseHeaders(new Headers(), 200, 'private').get('cache-control'), 'private, no-store')
})

test('proxyVideo forwards the Range header and the partial status', async () => {
  let seenRange
  const fakeFetch = async (_url, init) => {
    seenRange = init.headers?.range
    return new Response('abc', { status: 206, headers: { 'content-range': 'bytes 0-2/10' } })
  }
  const response = await proxyVideo(new Request('https://example.com/api/video', { headers: { range: 'bytes=0-2' } }), 'public', fakeFetch)
  assert.equal(seenRange, 'bytes=0-2')
  assert.equal(response.status, 206)
  assert.equal(await response.text(), 'abc')
})

test('proxyVideo answers 504 when the origin cannot be reached', async () => {
  const failingFetch = async () => { throw new DOMException('timed out', 'TimeoutError') }
  const response = await proxyVideo(new Request('https://example.com/api/video'), 'public', failingFetch)
  assert.equal(response.status, 504)
})

test('proxyVideo maps origin errors to 502', async () => {
  const response = await proxyVideo(new Request('https://example.com/api/video'), 'public', async () => new Response('nope', { status: 500 }))
  assert.equal(response.status, 502)
})
