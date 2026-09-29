# Security Policy

This document covers high-level security considerations for PropAuto AI.

Secrets
- Never commit secrets to the repository. Use .env.local for local secrets and environment variables in CI.
- An example `.env.example` is provided. Do not put real secrets in the repo.

Rate limiting
- All public API endpoints should implement rate limiting. A simple token-bucket or sliding window at the edge is recommended.

Input validation
- Server routes must validate input using Zod (already used in /api/leads).

Responsible disclosure
- Email security@yourcompany.example with any vulnerability reports.

