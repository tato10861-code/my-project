/**
 * @fileoverview The owner check gates sign-up and every owner-only route.
 */
import assert from 'node:assert/strict'
import { OWNER_EMAIL, isOwnerEmail } from '../../lib/owner'

test('isOwnerEmail accepts the owner regardless of case and surrounding space', () => {
  assert.equal(isOwnerEmail(OWNER_EMAIL), true)
  assert.equal(isOwnerEmail(`  ${OWNER_EMAIL.toUpperCase()} `), true)
})

test('isOwnerEmail rejects everyone else, including look-alikes', () => {
  for (const email of ['visitor@example.com', `${OWNER_EMAIL}.evil.com`, `x${OWNER_EMAIL}`, '', null, undefined]) {
    assert.equal(isOwnerEmail(email), false, String(email))
  }
})

test('the owner login can be changed with OWNER_EMAIL', () => {
  const saved = process.env.OWNER_EMAIL
  process.env.OWNER_EMAIL = 'boss@buyer.example'
  try {
    assert.equal(isOwnerEmail('BOSS@buyer.example '), true)
    assert.equal(isOwnerEmail(OWNER_EMAIL), false)
  } finally {
    if (saved === undefined) delete process.env.OWNER_EMAIL
    else process.env.OWNER_EMAIL = saved
  }
})
