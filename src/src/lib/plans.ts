/**
 * @fileoverview Subscription plans. Prices live in Stripe and are resolved at
 * checkout through their lookup keys, so the same code works against the test
 * and live accounts without hard-coded price ids. The amounts here are for
 * display only and must match the Stripe prices.
 */

export type PlanId = 'starter' | 'growth' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  /** Stripe price lookup key (the price is monthly, USD, tax exclusive). */
  lookupKey: string
  priceInCents: number
  features: { en: string[]; ar: string[] }
}

/** Free trial length; a card is collected up front and charged when it ends. */
export const TRIAL_DAYS = 14

export const PLANS: readonly Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    lookupKey: 'propauto_starter_monthly',
    priceInCents: 4_900,
    features: {
      en: ['AI chat agent on your site', 'Lead qualification and capture', 'Email alerts for new leads'],
      ar: ['وكيل محادثة ذكي على موقعك', 'تأهيل العملاء المحتملين وتسجيلهم', 'تنبيهات بالبريد لكل عميل جديد'],
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    lookupKey: 'propauto_growth_monthly',
    priceInCents: 14_900,
    features: {
      en: ['Everything in Starter', 'AI voice agent', 'Automated follow-up and appointment setting'],
      ar: ['كل مزايا Starter', 'وكيل صوتي ذكي', 'متابعة تلقائية وحجز المواعيد'],
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    lookupKey: 'propauto_pro_monthly',
    priceInCents: 39_900,
    features: {
      en: ['Everything in Growth', 'Multi-branch agencies and showrooms', 'Priority support and onboarding'],
      ar: ['كل مزايا Growth', 'للوكالات والمعارض متعددة الفروع', 'دعم وتهيئة بأولوية'],
    },
  },
]

/** Looks up a plan by id; undefined for anything else. */
export function getPlan(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id)
}
