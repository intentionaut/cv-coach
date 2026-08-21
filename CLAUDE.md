@AGENTS.md

# Project notes (persistent, not auto-regenerated)

Naming is inconsistent across systems — resolve like this:
- Local folder: `cv-coach-main`
- GitHub repo: `intentionaut/cv-coach`
- Vercel project: `cv-coach` under team `intentionauts-projects` (a stray duplicate project `cv-coach-main` also exists from a linking mistake on 2026-08-21 — unused, ignorable)
- Production domain: `friday.intentionaut.com` (product is branded "Friday"; default Vercel URL is `cv-coach-chi.vercel.app`)

**Deployment is manual, not Git-integrated.** No CI/CD is wired up — `git push` to GitHub does NOT deploy. To ship: commit + push to GitHub (history/source of truth), then separately run `vercel --prod` from this folder to actually deploy.

**Logs**: Hobby-tier Vercel plan — historical `vercel logs`/`vercel metrics` mostly don't return anything (metrics needs paid Observability Plus). To debug a live issue, tail with `vercel logs friday.intentionaut.com --follow` in the background and have the bug reproduced while it's running. Note: macOS has no `timeout` command by default.

**Fixed 2026-08-21**: `GET /api/cv` was double-JSON-parsing `jsonb` columns that Neon's driver already deserializes (this was the actual "CV parsing bug" reported in production — it was the fetch-back path, not upload/extraction). Also fixed: returning users always saw the upload screen instead of their saved CV, and CV analysis was being fully re-run through Claude on every login instead of reusing the stored result — see git history around commit `48d93b4` for details. Also fixed: `lib/tier.ts`'s `getModelForTier()` was returning `'claude-haiku-4-5'` for free-tier users (missing the required `-20251001` date suffix), an invalid model ID that silently 400'd and was masked as a generic "temporarily unavailable" error — this meant free-tier AI calls likely weren't working at all before this fix.
