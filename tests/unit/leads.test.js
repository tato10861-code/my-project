/**
 * @fileoverview Unit tests for lead validation and owner notification helpers.
 */
import assert from 'node:assert/strict'
import {
  buildLeadEmail,
  escapeHtml,
  isMissingColumnError,
  leadIdempotencyKey,
  leadRow,
  leadSchema,
} from '../../lib/leads'

const lead = leadSchema.parse({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  intent: 'investor',
  phone: '+15550100',
  budget: '2M',
  message: 'Hello',
})

test('leadSchema accepts every field the forms send', () => {
  assert.equal(lead.phone, '+15550100')
  assert.equal(lead.budget, '2M')
  assert.equal(lead.message, 'Hello')
})

test('leadSchema rejects malformed leads', () => {
  assert.equal(leadSchema.safeParse({ name: 'A', email: 'ada@example.com', intent: 'buyer' }).success, false)
  assert.equal(leadSchema.safeParse({ name: 'Ada', email: 'not-an-email', intent: 'buyer' }).success, false)
  assert.equal(leadSchema.safeParse({ name: 'Ada', email: 'ada@example.com', intent: 'spam' }).success, false)
})

test('leadSchema accepts a chatbot transcript longer than 1000 characters', () => {
  assert.equal(
    leadSchema.safeParse({ name: 'Ada', email: 'ada@example.com', intent: 'buyer', message: 'x'.repeat(3000) }).success,
    true,
  )
})

test('escapeHtml neutralizes markup', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;')
})

test('buildLeadEmail escapes user input and strips newlines from the subject', () => {
  const email = buildLeadEmail({ ...lead, name: 'Eve\r\nBcc: x@y.z', message: '<script>alert(1)</script>' })
  assert.ok(!email.subject.includes('\n'))
  assert.ok(!email.html.includes('<script>'))
  assert.ok(email.html.includes('&lt;script&gt;'))
})

test('leadIdempotencyKey is stable for a retry and differs for a different lead', () => {
  const now = new Date('2026-10-08T12:00:00Z')
  const later = new Date('2026-10-08T12:00:30Z')
  assert.equal(leadIdempotencyKey(lead, now), leadIdempotencyKey(lead, later))
  assert.equal(leadIdempotencyKey({ ...lead, email: 'ADA@example.com' }, now), leadIdempotencyKey(lead, now))
  assert.notEqual(leadIdempotencyKey({ ...lead, message: 'Other' }, now), leadIdempotencyKey(lead, now))
  assert.match(leadIdempotencyKey(lead, now), /^propauto-lead\/[0-9a-f]{40}$/)
})

test('leadRow keeps every optional detail the forms collect', () => {
  assert.deepEqual(leadRow(lead), {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    intent: 'investor',
    source: 'web',
    phone: '+15550100',
    budget: '2M',
    message: 'Hello',
    language: null,
  })
})

test('isMissingColumnError finds the SQLSTATE through ORM wrapping', () => {
  const pgError = Object.assign(new Error('column "phone" does not exist'), { code: '42703' })
  const wrapped = Object.assign(new Error('Failed query'), { cause: pgError })
  assert.equal(isMissingColumnError(wrapped), true)
  assert.equal(isMissingColumnError(pgError), true)
  assert.equal(isMissingColumnError(Object.assign(new Error('timeout'), { code: '57014' })), false)
  assert.equal(isMissingColumnError(null), false)
})
