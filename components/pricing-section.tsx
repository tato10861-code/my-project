import { Check } from 'lucide-react'
import { formatMoney } from '@/lib/math'
import { PLANS, TRIAL_DAYS } from '@/lib/plans'

/** Optional Stripe customer-portal login link for existing subscribers. */
const portalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL

/**
 * Monthly plans. Each card posts its plan id to /api/checkout, which redirects
 * to Stripe-hosted Checkout with the free trial and automatic tax.
 */
export function PricingSection({ locale }: { locale: string }) {
  const ar = locale === 'ar'
  return (
    <section id="pricing" className="px-5 py-24 lg:px-12" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-2xl">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">{ar ? 'الباقات' : 'Plans'}</div>
          <h2 id="pricing-title" className="font-serif text-4xl leading-tight sm:text-6xl">
            {ar ? 'اشتراك شهري لوكالتك أو معرضك.' : 'Monthly plans for agencies and showrooms.'}
          </h2>
          <p className="mt-5 leading-7 text-[#b4c1bf]">
            {ar
              ? `تجربة مجانية ${TRIAL_DAYS} يوماً على كل الباقات، ثم يبدأ الاشتراك تلقائياً. ألغِ في أي وقت. الأسعار لا تشمل الضريبة.`
              : `${TRIAL_DAYS}-day free trial on every plan, then billed monthly. Cancel anytime. Prices exclude tax.`}
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <form
              key={plan.id}
              action="/api/checkout"
              method="POST"
              className={`flex flex-col rounded-3xl border p-6 sm:p-8 ${plan.id === 'growth' ? 'border-[#d5b77b] bg-[#112127]' : 'border-[#f5f1e8]/10 bg-[#0d1a1e]'}`}
            >
              <input type="hidden" name="plan" value={plan.id} />
              <h3 className="font-serif text-3xl">{plan.name}</h3>
              <p className="mt-4">
                <span className="font-serif text-5xl text-[#d5b77b]">
                  {formatMoney(BigInt(plan.priceInCents), 'USD', 'en-US')}
                </span>
                <span className="text-sm text-[#80908d]"> / {ar ? 'شهرياً' : 'month'}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[#b4c1bf]">
                {(ar ? plan.features.ar : plan.features.en).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d5b77b]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="submit"
                className="mt-8 rounded-full bg-[#d5b77b] px-5 py-3 text-sm font-semibold text-[#071014] transition hover:bg-[#ead29d]"
              >
                {ar ? `ابدأ التجربة المجانية` : `Start ${TRIAL_DAYS}-day free trial`}
              </button>
            </form>
          ))}
        </div>
        {portalUrl && (
          <p className="mt-6 text-sm text-[#80908d]">
            {ar ? 'مشترك بالفعل؟ ' : 'Already subscribed? '}
            <a href={portalUrl} className="text-[#d5b77b] hover:underline">
              {ar ? 'إدارة الاشتراك والفواتير' : 'Manage your subscription and invoices'}
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
