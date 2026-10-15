# PropAuto AI: project origin and usage evidence

Facts only, each with its source. Nothing here changes git history.

## Why git history starts on 24 September 2026

The project was built in v0 and deployed on Vercel from 14 August 2026. It was
moved into this repository on 24 September 2026, so the first commit here is
that date. Earlier work is documented below, not backdated into git.

## Origin (read from the Vercel and v0 platforms on 14 October 2026)

| Fact | Value | Source |
|---|---|---|
| Vercel project | `propauto-ai-al-closer-saas` | Vercel project record |
| Project created | 2026-08-14 20:24 UTC | Vercel `createdAt` |
| Same owner account on both platforms | yes | v0 chat author and Vercel project owner match |

### v0 chats on the same Vercel project (titles and creation dates only)

| Created (UTC) | Title |
|---|---|
| 2026-08-14 | PropAuto AI & Al Closer SaaS |
| 2026-08-18 | Conversation continuation |
| 2026-08-23 | PropAuto landing page |
| 2026-08-24 | v0/tato10861-2666-ffae6261 |
| 2026-08-25 | Conversation summary |
| 2026-09-03 onward | Further build chats |

Chat contents are not copied here.

## Files in this folder

- `v0-project-routes-august.csv`: the routes the v0 project exposed in August.
- `v0-project-request-log-2026-10-10.json`: request log exported from the v0 project.
- `src-pnpm-lock.yaml`: dependency lockfile from the v0 project.

## Real usage (Vercel Web Analytics, production)

Window: 15 September to 14 October 2026. The free plan exposes only the latest
31 days, so earlier traffic cannot be shown.

| Measure | Value |
|---|---|
| Unique visitors | 105 |
| Page views | 158 |
| Countries | 13 |
| Top countries by visitors | Yemen 69, United States 18, Italy 4 |

These are site visits. They are not customers, leads, or revenue.

## What this does not show

- No paying customers yet.
- Latency and concurrent-load figures have not been measured.
- Voice is the Vapi service and the model is a Gemini free tier; see
  `src/src/docs/ARCHITECTURE.md` for what is external and what is not built.
