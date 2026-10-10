# Archive: v0 project, August 2026

This branch is a read-only archive. It is an orphan branch: it has no shared
history with `main`, and nothing here is merged into `main`.

## What this is

The first PropAuto project was built in v0 and deployed on Vercel.
This branch keeps the evidence that exists for that period. The source code of
that period is not included in this branch yet.

## Files

| File | What it is | Source | Date |
|---|---|---|---|
| `evidence/v0-project-routes-august.csv` | List of routes and static files from the August v0 deployment (page, API routes, assets), with sizes. | Vercel deployment export of `v0-project-nl2jxc8si-ta-to.vercel.app` | Deployment created 15 Aug 2026 |
| `evidence/v0-project-request-log-2026-10-10.json` | Request log for the v0 project, including requests to `/api/checkout` answered with HTTP 503 (payments not configured in that deployment). | Vercel log export, project `v0-project` | Exported 10 Oct 2026 |
| `evidence/src-pnpm-lock.yaml` | Dependency lockfile of the August project (`src/src`). Shows Next.js 16.3.0, Stripe 22.5.0, AI SDK 7.0.66, Drizzle ORM 0.45.2. | Uploaded by the project owner | August 2026 build |

## Other evidence (not stored in this repository)

- Vercel project `propauto-ai-al-closer-saas` was created on **14 Aug 2026**
  (project `createdAt` in the Vercel API).
- Vercel "Source" page of deployment `3icLQyhhikWo3SKaoeWG1cdPe4iz`
  (team `ta-to`), created 15 Aug 2026.

## Relation to `main`

- `main` starts from the first Git commit on 24 Sep 2026. There are no August
  commits in Git.
- The current code on `main` is a later version of the same product. Its
  dependencies moved from Next.js 16.3.0 to 16.3.8, and from Stripe 22.5.0 to 23.
- Nothing in this branch has been merged into `main`.

## Not included yet

- The full August source code. It has to be exported from v0 (Download / Export
  code) and added to this branch in a separate commit.
- Screenshots of the August deployment.
