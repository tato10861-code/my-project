/**
 * @fileoverview Unit tests for the order in which Sarah tries Gemini models.
 */
import assert from 'node:assert/strict'
import { DEFAULT_SARAH_MODEL, sarahModelNames } from '../../lib/sarah-models'

test('uses the default model when nothing is configured', () => {
  assert.deepEqual(sarahModelNames({}), [DEFAULT_SARAH_MODEL])
})

test('SARAH_MODEL replaces the default and blank values fall back to it', () => {
  assert.deepEqual(sarahModelNames({ SARAH_MODEL: ' gemini-x ' }), ['gemini-x'])
  assert.deepEqual(sarahModelNames({ SARAH_MODEL: '   ' }), [DEFAULT_SARAH_MODEL])
})

test('fallback models follow the primary in the order given', () => {
  assert.deepEqual(sarahModelNames({ SARAH_MODEL: 'a', SARAH_FALLBACK_MODELS: 'b, c' }), ['a', 'b', 'c'])
})

test('blank entries and repeats are dropped so a model is never tried twice', () => {
  assert.deepEqual(sarahModelNames({ SARAH_MODEL: 'a', SARAH_FALLBACK_MODELS: ' ,b,,a, b ' }), ['a', 'b'])
})
