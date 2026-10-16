# Archived material

The following were moved off `main` on 2026-10-09 to keep the deployed
product in one place. Nothing was deleted: they live, with their full history,
on the branch [`archive/static-site-and-snapshots`](https://github.com/tato10861-code/my-project/tree/archive/static-site-and-snapshots).

| Path | What it is |
|---|---|
| `static-site/` | Static-HTML rebuild of the site with its dev server (`server.js`). Incomplete in this repository: `assets/` and `lib/storage.js` were never committed. Production runs the Next.js app at the repository root. |
| `PropAuto-AI-complete.zip`, `propauto-complete-project.zip`, `propauto-project-ready.zip` | Earlier snapshots of the Next.js app (September–October 2026). Everything in them is present in the root app or its history. |

Restore any of them with:

```bash
git checkout archive/static-site-and-snapshots -- static-site
```

## Removed from `main`: the early Sara agent (`agents/sara-closer`)

A separate, never-deployed eve agent app that Sara's live implementation (`app/api/sarah`) superseded. It was removed from `main` so the repository holds one application. It is not lost: it is in the git history as of commit `3fa6f77`. To restore it, run `git checkout 3fa6f77 -- agents/sara-closer`. An early scaffold of the same agent is also in the archived `sara-propauto-closer-agent` repository.
