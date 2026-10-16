/**
 * @fileoverview Unit tests for the migration planning rules.
 */
import assert from 'node:assert/strict'
import { migrationChecksum, planMigrations } from '../../lib/migrations'

const file = (name, sql = `-- ${name}`) => ({ name, sql })
const ledger = (...files) => new Map(files.map((entry) => [entry.name, migrationChecksum(entry.sql)]))

test('every file is pending on an empty ledger, in numeric order', () => {
  const plan = planMigrations([file('0003_c.sql'), file('0001_a.sql'), file('0002_b.sql')], new Map())
  assert.deepEqual(plan.pending.map((entry) => entry.name), ['0001_a.sql', '0002_b.sql', '0003_c.sql'])
  assert.deepEqual(plan.drifted, [])
  assert.deepEqual(plan.missing, [])
})

test('applied files are not run again, new ones are', () => {
  const a = file('0001_a.sql')
  const b = file('0002_b.sql')
  const plan = planMigrations([a, b], ledger(a))
  assert.deepEqual(plan.pending.map((entry) => entry.name), ['0002_b.sql'])
})

test('an applied file whose content changed is reported as drifted', () => {
  const original = file('0001_a.sql', 'CREATE TABLE a ();')
  const edited = file('0001_a.sql', 'CREATE TABLE a (id int);')
  const plan = planMigrations([edited], ledger(original))
  assert.deepEqual(plan.drifted, ['0001_a.sql'])
  assert.deepEqual(plan.pending, [])
})

test('an applied file that is gone from disk is reported as missing', () => {
  const a = file('0001_a.sql')
  const b = file('0002_b.sql')
  const plan = planMigrations([a], ledger(a, b))
  assert.deepEqual(plan.missing, ['0002_b.sql'])
})

test('bad names and duplicate numbers are rejected', () => {
  assert.throws(() => planMigrations([file('add_users.sql')], new Map()), /Invalid migration file name/)
  assert.throws(() => planMigrations([file('1_a.sql')], new Map()), /Invalid migration file name/)
  assert.throws(() => planMigrations([file('0001_A.sql')], new Map()), /Invalid migration file name/)
  assert.throws(() => planMigrations([file('0001_a.sql'), file('0001_b.sql')], new Map()), /share the number 0001/)
})

test('the checksum depends on the content', () => {
  assert.equal(migrationChecksum('x'), migrationChecksum('x'))
  assert.notEqual(migrationChecksum('x'), migrationChecksum('y'))
  assert.equal(migrationChecksum('').length, 64)
})
