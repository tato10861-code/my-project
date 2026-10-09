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
