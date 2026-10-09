import { bigint, boolean, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const propautoEvents = pgTable('propauto_events', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text('session_id').notNull(),
  eventName: text('event_name').notNull(),
  path: text('path').notNull().default('/'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const propautoLeads = pgTable('propauto_leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  intent: text('intent').notNull(),
  source: text('source').notNull().default('web'),
  // Added by db/migrations/0001_lead_details.sql
  phone: text('phone'),
  budget: text('budget'),
  message: text('message'),
  language: text('language'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const propautoOperatorLogs = pgTable('propauto_operator_logs', {
  id: serial('id').primaryKey(),
  botName: text('bot_name').notNull(),
  action: text('action').notNull(),
  status: text('status').notNull().default('queued'),
  details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Added by db/migrations/0002_subscriptions.sql. One row per Stripe subscription,
// kept current by /api/webhooks/stripe.
export const propautoSubscriptions = pgTable('propauto_subscriptions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  plan: text('plan'),
  priceId: text('price_id'),
  status: text('status').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  livemode: boolean('livemode').notNull(),
  lastEventCreated: bigint('last_event_created', { mode: 'number' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
