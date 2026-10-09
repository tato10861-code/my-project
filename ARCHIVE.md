# Archived material

The following were moved off `main` on 2026-10-09 to keep the deployed
product in one place. Nothing was deleted: they live, with their full history,
on the branch [`archive/static-site-and-snapshots`](https://github.com/tato10861-code/my-project/tree/archive/static-site-and-snapshots).

| Path | What it is |
|---|---|
| `static-site/` | Static-HTML rebuild of the site with its dev server (`server.js`). Incomplete in this repository: `assets/` and `lib/storage.js` were never committed. Production runs the Next.js app in `src/src`. |
| `PropAuto-AI-complete.zip`, `propauto-complete-project.zip`, `propauto-project-ready.zip` | Earlier snapshots of the Next.js app (September–October 2026). Everything in them is present in `src/src` or its history. |

Restore any of them with:

```bash
git checkout archive/static-site-and-snapshots -- static-site
```
