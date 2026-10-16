/**
 * @fileoverview Unit tests for the configurable contact details.
 */
import assert from 'node:assert/strict'
import {
  contactEmail,
  notifyEmail,
  ownerEmail,
  whatsappDisplay,
  whatsappNumber,
  DEFAULT_OWNER_EMAIL,
} from '../../lib/site-config'

const KEYS = [
  'NEXT_PUBLIC_CONTACT_EMAIL',
  'NOTIFY_EMAIL',
  'OWNER_EMAIL',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'NEXT_PUBLIC_WHATSAPP_DISPLAY',
]
const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
beforeEach(() => {
  for (const key of KEYS) delete process.env[key]
})
afterAll(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

test('defaults keep an existing deployment working unchanged', () => {
  assert.equal(contactEmail(), 'propautoal@gmail.com')
  assert.equal(notifyEmail(), 'propautoal@gmail.com')
  assert.equal(ownerEmail(), DEFAULT_OWNER_EMAIL)
  assert.equal(whatsappNumber(), '967733393884')
  assert.equal(whatsappDisplay(), '+967 733 393 884')
})

test('each value can be set from the environment', () => {
  process.env.NEXT_PUBLIC_CONTACT_EMAIL = ' sales@buyer.example '
  process.env.OWNER_EMAIL = 'Boss@Buyer.Example'
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+1 (555) 010-0100'
  assert.equal(contactEmail(), 'sales@buyer.example')
  assert.equal(ownerEmail(), 'boss@buyer.example')
  assert.equal(whatsappNumber(), '15550100100')
  assert.equal(whatsappDisplay(), '+15550100100')
  process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY = '+1 555 010 0100'
  assert.equal(whatsappDisplay(), '+1 555 010 0100')
})

test('notifications follow the public contact email unless NOTIFY_EMAIL is set', () => {
  process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'hello@buyer.example'
  assert.equal(notifyEmail(), 'hello@buyer.example')
  process.env.NOTIFY_EMAIL = 'ops@buyer.example'
  assert.equal(notifyEmail(), 'ops@buyer.example')
})

test('a malformed value falls back to the default instead of breaking mail or the owner login', () => {
  for (const bad of ['not-an-email', 'a@b', '  ', '@x.com']) {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = bad
    process.env.NOTIFY_EMAIL = bad
    process.env.OWNER_EMAIL = bad
    assert.equal(contactEmail(), 'propautoal@gmail.com', bad)
    assert.equal(notifyEmail(), 'propautoal@gmail.com', bad)
    assert.equal(ownerEmail(), DEFAULT_OWNER_EMAIL, bad)
  }
  for (const bad of ['abc', '12', '1'.repeat(16)]) {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = bad
    assert.equal(whatsappNumber(), '967733393884', bad)
  }
})
