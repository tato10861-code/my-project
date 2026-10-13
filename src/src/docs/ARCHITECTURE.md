# PropAuto AI: architecture and integration notes

An honest technical summary for a reviewer, buyer, or licensee. It separates what
this repository implements from what it relies on others for.

## What it is

A Next.js (App Router) SaaS for luxury real estate and car sales. Sarah is an AI
sales consultant who qualifies a visitor, offers real free time slots, and takes
a viewing or test-drive request that the team confirms by email.

Stack: Next.js, React, TypeScript, Neon Postgres, better-auth, Stripe,
Vercel, Vercel AI SDK with Google Gemini, Vapi (voice), Resend or Gmail SMTP (email).

## How the pieces are separated

| Concern | Where | Swap it by |
|---|---|---|
| Persona and language rules | `lib/sarah-prompt.ts` | editing one file |
| Which model, in what order | `lib/sarah-models.ts` (`SARAH_MODEL`, `SARAH_FALLBACK_MODELS`) | changing two environment variables, no code |
| Trying models until one answers | `lib/sarah-fallback.ts` | generic, testable without a network |
| Chat transport and tools | `app/api/sarah/route.ts` | one route; the widgets call only this |
| Booking rules, slots, signed links | `lib/bookings.ts` | pure functions, unit tested |
| Booking storage and notification | `lib/db/booking-service.ts`, `lib/db/bookings.ts` | Resend or Gmail chosen by environment |
| Request safety (size, rate limit) | `lib/request-security.ts` | shared by every API route |
| Payments | `lib/payments.ts`, `app/api/webhooks/stripe` | Stripe only |

Changing the AI provider means changing the `model` line in the route (the
AI SDK accepts other providers). The prompt, booking rules, and tests do not move.

## Reliability

- **Quota and outages.** Free Gemini tiers give each model its own daily
  allowance. Sarah tries the configured models in order and answers from the next
  one when a model refuses, so a visitor does not see an error.
- **No replayed side effects.** If a booking tool already ran, the turn is not
  retried on another model.
- **Last resort.** When every model fails, the widget gets a short localized
  greeting with a retryable status, never an empty page.
- **Courtesy emails cannot break chat.** The "hot lead" alert has its own error
  handling.
- **No double bookings.** A partial unique index on live slots decides, not
  application code. A slot is released when its confirmation email cannot be sent.
- **Signed confirmation links.** HMAC with a server secret, compared in constant time.

## Security

- No secrets in the repository. `.env.example` lists names only. CI runs a secrets
  scan and a dependency audit.
- Request bodies are size-limited and validated with schemas. Chat is rate limited.
- Logs carry the error class and message, never customer text or keys.

## Languages

Sarah answers in the language the visitor writes in and switches fully when asked.
The booking records the language in plain English, and the team's email subject
shows the customer and language.

## Tests and checks

Jest unit suites for business logic, with coverage floors enforced in CI
(lines 95, branches 85), plus type checking, lint, and a smoke test.

## What is not in this repository

Stated plainly so nothing is oversold:

- **Voice** is the Vapi service. This code passes its public key to the widget.
  Voice quality and latency belong to that provider.
- **WhatsApp, Telegram, and Messenger** are not integrated. The chat route is a
  single entry point, so a channel is a thin adapter that forwards messages to it.
  WhatsApp needs a business phone number and a Meta account.
- **Latency and concurrency figures** have not been measured, so none are claimed.
- **Chat history** is not stored, by design, so there is no conversation dataset.
- **Free-tier model quotas** are a limit of the demo setup. A paid key or another
  provider removes it without code changes.
