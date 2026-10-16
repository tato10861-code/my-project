/**
 * @fileoverview Unit tests for Sarah's prompt rules and the model fallback runner.
 */
import assert from 'node:assert/strict'
import { fallbackReply, SARAH_SYSTEM_PROMPT, sarahSystem } from '../../lib/sarah-prompt'
import { runWithModelFallback } from '../../lib/sarah-fallback'

test('prompt tells Sarah to follow the customer language and switch on request', () => {
  assert.equal(SARAH_SYSTEM_PROMPT.includes('switch immediately and completely'), true)
  assert.equal(SARAH_SYSTEM_PROMPT.includes('Never mix languages'), true)
  assert.equal(SARAH_SYSTEM_PROMPT.includes('request_booking set language'), true)
})

test('system instruction carries the widget language code', () => {
  assert.equal(sarahSystem('fr').endsWith('Preferred language code: fr.'), true)
})

test('system instruction carries the configured contact email, not a hard-coded one', () => {
  assert.equal(SARAH_SYSTEM_PROMPT.includes('@'), false)
  const saved = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'hello@buyer.example'
  try {
    assert.equal(sarahSystem('en').includes('Current company contact: hello@buyer.example.'), true)
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_CONTACT_EMAIL
    else process.env.NEXT_PUBLIC_CONTACT_EMAIL = saved
  }
})

test('fallback reply is localized and defaults to English', () => {
  assert.equal(fallbackReply('ar').includes('سارة'), true)
  assert.equal(fallbackReply('fr').startsWith('Bonjour'), true)
  assert.equal(fallbackReply('es').startsWith('Hola'), true)
  assert.equal(fallbackReply('de').startsWith('Hi, Sarah'), true)
})

test('fallback runner returns the first model that answers', async () => {
  const failed = []
  const out = await runWithModelFallback(['a', 'b', 'c'], async (name) => {
    if (name === 'a') throw new Error('quota')
    return `reply from ${name}`
  }, { onFailure: (name) => failed.push(name) })
  assert.deepEqual(out, { result: 'reply from b', model: 'b' })
  assert.deepEqual(failed, ['a'])
})

test('fallback runner throws the last error when every model fails', async () => {
  await assert.rejects(
    runWithModelFallback(['a', 'b'], async (name) => { throw new Error(`down ${name}`) }),
    /down b/,
  )
})

test('fallback runner stops when told a side effect already happened', async () => {
  let tried = 0
  await assert.rejects(
    runWithModelFallback(['a', 'b'], async () => { tried += 1; throw new Error('late failure') }, { stopAfterFailure: () => true }),
    /late failure/,
  )
  assert.equal(tried, 1)
})

test('fallback runner reports an empty model list', async () => {
  await assert.rejects(runWithModelFallback([], async () => 'x'), /No model configured/)
})
