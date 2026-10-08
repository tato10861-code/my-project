# PropAuto AI

PropAuto is a multilingual real-estate and automotive lead platform with an on-site Sarah concierge, visitor analytics, lead capture, and owner notifications.

## Features

- Multilingual buyer and investor qualification
- On-site text concierge backed by a server route
- Optional in-page voice concierge with microphone permission
- Lead persistence and owner email notifications
- Session-based visitor analytics and admin dashboard
- Better Auth, Neon/Postgres, Drizzle, Resend, and Vercel AI Gateway integrations

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Drizzle ORM, Neon Postgres, Better Auth, AI SDK, Resend, and Vapi Web.

## Quick start

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Run the release checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Environment

Use `.env.example` as the variable checklist. Keep production secrets in the deployment provider, never in Git. `RESEND_FROM_EMAIL` must be a verified sender for reliable production delivery. `NEXT_PUBLIC_VAPI_PUBLIC_KEY` must be a Vapi public key; private keys must remain server-side.

## Deployment

Deploy the project through Vercel or the repository's CI workflow. The workflow runs install, lint, type checking, dependency audit, secret-pattern checks, and production build.

## Security

Read [SECURITY.md](SECURITY.md) before handling credentials or customer information.
