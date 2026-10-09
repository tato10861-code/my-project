# Security

PropAuto keeps credentials server-side and validates API input with Zod. Do not commit `.env` files, provider keys, database URLs, or customer data.

## Reporting

Please report security issues privately to the project owner. Include a reproducible description and avoid sharing live credentials or personal customer data.

## Operational controls

- Use separate Preview and Production secrets.
- Keep `BETTER_AUTH_SECRET` and `DATABASE_URL` server-only.
- Use a verified `RESEND_FROM_EMAIL` domain for production mail.
- Use only a Vapi public key in browser code; never expose a private provider key.
- Review CI, dependency audit, and deployment logs before each release.
