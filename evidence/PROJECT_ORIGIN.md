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

## Deployment history (read from Vercel)

| Fact | Value | Source |
|---|---|---|
| Production deployment `dpl_A6LJWK6f7fhJdYhGKdqJbtSBe799` | created 2026-09-16 14:25 UTC, state READY | Vercel deployment record |
| Project created | 2026-08-14 20:24 UTC | Vercel project record |
| Source of that 16 Sep deployment | `cli`: uploaded with the Vercel CLI, so it has no git commit | Vercel deployment record |

### Vercel account activity log (August 2026)

Read directly from the Vercel account activity log on 15 Oct 2026. Times are UTC.
Account identifiers, environment values and tokens are left out on purpose.

| Date and time | Event |
|---|---|
| 2026-08-02 | Two database stores created on the account |
| 2026-08-14 20:24 | Project `propauto-ai-al-closer-saas` created; Web Analytics enabled the same minute |
| 2026-08-14 20:39 | Neon Postgres database created and connected to the project |
| 2026-08-14 20:44 | Blob storage created and connected |
| 2026-08-14 21:22 | AI Gateway keys created |
| 2026-08-15 16:29 | Second project `v0-project` created and deployed to production by v0 |
| 2026-08-16 13:55 to 14:06 | Four production deployments in 11 minutes, three requested by v0 |
| 2026-08-16 14:03 | Slack connector created and attached to the project |
| 2026-08-18 21:59 | Production deployment requested by v0 (after a new database was connected) |

The owner's own screenshot of the same activity log also shows, for the Vercel team,
a GitLab account link on 15 Aug 2026 and the team creation on 10 Jul 2026. I could
not read those two entries back through the API, so they stay owner-supplied.

### How a reviewer can check these facts

- Vercel project and deployments: https://vercel.com/ta-to/propauto-ai-al-closer-saas (project settings show the creation date; the deployment `A6LJWK6f7` shows Created Sep 16, Production, Ready).
- v0 chats of the same project show their own creation dates in v0.
- Both belong to the same account, `tato10861-2666`.

## Real usage

The Hobby plan keeps only the latest 31 days of analytics, so traffic before
mid-September cannot be read back from Vercel today. Two kinds of evidence follow,
kept apart on purpose.

### Verified directly from Vercel Web Analytics (production, 15 Sep to 14 Oct 2026)

| Measure | Value |
|---|---|
| Unique visitors | 105 |
| Page views | 158 |
| Countries | 13 |
| Top countries by visitors | Yemen 69, United States 18, Italy 4 |

### Screenshots of the owner's Vercel Analytics dashboard

Taken by the owner at the time. The dates below are read from each chart's axis.
They are supporting evidence, not independently verified.

| Window (from the chart axis) | Environment | Visitors | Page views |
|---|---|---|---|
| 17 to 23 Aug 2026 (7 days) | Production | 12 | 17 |
| 31 Aug to 6 Sep 2026 (7 days) | Production | 25 | 30 |
| about 24 Aug to 23 Sep 2026 (30 days) | Production | 97 | 144 |
| 29 Sep to 5 Oct 2026 (7 days) | Production | 41 | 50 |
| 15 Sep to 15 Oct 2026 (30 days) | All environments | 116 | 177 |

Windows overlap or repeat visitors, so these figures are not added together.
Audience mix in the 15 Sep to 15 Oct screenshots: Yemen 65%, United States 18%,
Italy 4%, India 2%, Jamaica 2%; mobile 69% and desktop 31%; Android 67%, Windows 23%,
Mac 5%, Linux 4%, iOS 3%. Bounce rate was 71% to 77% depending on the window.
No custom events were being tracked.

These are site visits. They are not customers, leads, or revenue.

## What this does not show

- No paying customers yet.
- Latency and concurrent-load figures have not been measured.
- Voice is the Vapi service and the model is a Gemini free tier; see
  `src/src/docs/ARCHITECTURE.md` for what is external and what is not built.
