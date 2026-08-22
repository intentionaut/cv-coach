@AGENTS.md

# Project notes (persistent, not auto-regenerated)

## Naming across systems

Naming is inconsistent — resolve like this:
- Local folder: `cv-coach-main`
- GitHub repo: `intentionaut/cv-coach`
- Vercel project: `cv-coach` under team `intentionauts-projects` (a stray duplicate project `cv-coach-main` also exists from a linking mistake on 2026-08-21 — unused, ignorable)
- Production domain: `friday.intentionaut.com` (product is branded "Friday"; default Vercel URL is `cv-coach-chi.vercel.app`)

**Deployment is manual, not Git-integrated.** No CI/CD is wired up — `git push` to GitHub does NOT deploy. To ship: commit + push to GitHub (history/source of truth), then separately run `vercel --prod` from this folder.

**Migrations are run by the user, never by Claude.** Any secret Claude's tools touch gets redacted to the literal string `[SENSITIVE]` on disk, so Claude cannot hold a real `DATABASE_URL`. Write the migration to `lib/db/migrations/`, then give the user the SQL to paste into Neon's SQL Editor. **Always confirm a migration is applied before deploying code that depends on it** — deploying first broke production once (migration 005).

**Logs**: Hobby-tier Vercel — historical `vercel logs`/`vercel metrics` mostly return nothing (metrics needs paid Observability Plus). To debug live, tail with `vercel logs friday.intentionaut.com --follow` in the background while the user reproduces. Note: the stream dies after ~5 minutes, so wrap it in a restart loop. macOS has no `timeout` command by default.

## Product shape

The user journey is **Upload CV → Edit & Improve → Write a Cover Letter → Apply**, and the dashboard presents exactly those three build stages in that order. Keep any new surface consistent with that sequence rather than adding a fourth peer card.

**The role is the organising object.** A CV carries `job_title` and `job_description`; interview practice sessions link to a CV via `cv_id`, which is what makes questions and feedback role-specific rather than generic. When adding features, hang them off the role rather than creating a new silo.

## Coaching philosophy — this is the product's actual differentiator

All four AI surfaces (CV analysis, cover letter generation/review, written interview, voice interview) follow the same rules. **Do not break these when editing prompts:**

- **Never hand the user finished prose to paste in.** Name what's missing and ask the question that helps them find their own answer. `suggestedRevision` was removed from both interview routes for exactly this reason.
- **No AI-tell language** — an explicit banned list (spearheaded, leveraged, utilized, dynamic, results-driven, passionate about, seamlessly, robust, self-starter, stacked em-dashes) appears in every prompt.
- **Illustrative examples must come from an adjacent scenario**, never the user's own, so nothing is directly copy-pasteable.
- **Don't overclaim.** Where a limit is real (we can't see an employer's ATS; a score is one opinion), say so. The ATS panel ships a "what these checks can't tell you" denominator for this reason.

## Scoring — one number, deliberately

There is exactly **one** coaching score. When a job description is set it means "how ready is this CV for this role" (quality and fit together); without one it's quality against general industry standards. A separate match score existed briefly and was merged — two `/100` numbers on one page read as competing verdicts.

The **ATS panel is not a second score.** It's mechanical readability (can software parse the file), deterministic, zero AI cost, reported as "11/14 checks passed". Keep it visually subordinate to the coaching score.

## Conventions worth following

- **Design system first.** `/design-system` renders the live tokens and shared components. Check it before authoring new UI; if you add a genuinely new pattern, document it there.
- **Shared components** live in `components/ui/` (icons, `BackToDashboard`), `components/coaching/` (`FeedbackPanel`, `StarPanel`), `components/layout/` (`Footer`, mounted once in the root layout — don't add per-page footers). `lib/format.ts` holds `formatRelativeTime`.
- **API routes**: ownership-check on every user-scoped query; `maxDuration = 60` on any route calling Claude; check `stop_reason === 'max_tokens'`; strip markdown fences before `JSON.parse`; log errors as structured fields (`message`, `name`, `status`, `anthropicError`, `stack`) rather than a bare `console.error(label, error)` which buries the useful part.
- **Streaming**: `/api/cv/analyze` streams, and the client progressively parses via `lib/partial-json.ts`. The prompt's key order is load-bearing — the schema is ordered so the score arrives first.
- Tier/model routing lives in `lib/tier.ts` (free → Haiku, paid → Sonnet).

## Fixed bugs worth not reintroducing

- `GET /api/cv` double-`JSON.parse`d `jsonb` columns that Neon's driver already deserializes.
- `getModelForTier()` returned `'claude-haiku-4-5'` without the required `-20251001` suffix — silently 400'd every free-tier call.
- The onboarding checklist required a skills assessment that was never buildable, so it could never complete or self-dismiss.
- `getGenericPracticeSet` returned the same first six questions every session, so repeat practice asked identical questions.
- Self-ratings were never collected — `submitAnswer(null, null)` was the only call site while the columns, params and signature all existed.
- pdf-parse v2 depends on `@napi-rs/canvas`, whose native binary Vercel's file tracer doesn't reliably include; v1 (`pdf-parse/lib/pdf-parse.js`, imported deep to dodge its debug self-test) has no native deps.

## Removed — don't resurrect without reason

`/api/coaching/*` (tailor-cv, interview-feedback), `lib/ai/coaching.ts`, `/api/cv/[id]/match`, `app/skills`, and the `progress_metrics` table. All were unreachable or superseded; the reasoning is in the migration files and commit messages.
