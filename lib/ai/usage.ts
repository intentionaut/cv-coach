import db from '@/lib/db/client';

/**
 * Cost accounting for AI calls.
 *
 * Every Claude and Deepgram call records what it cost, because the token
 * counts exist exactly once - in the API response - and can never be
 * recovered afterwards. Without this, "cost per CV" and "gross margin per
 * paying user" are permanently unanswerable.
 *
 * Logging must never break a user action. Every function here swallows its
 * own errors: a failed insert costs us a row of accounting, a thrown error
 * costs the user their CV analysis.
 */

/** The surface that spent the money, named for the user-facing thing. */
export type UsageSurface =
  | 'cv_upload'
  | 'cv_analysis'
  | 'cover_letter'
  | 'cover_letter_review'
  | 'interview_answer'
  | 'voice_answer'
  | 'voice_transcription';

interface ModelPrice {
  /** USD per million tokens. */
  input: number;
  output: number;
  /** Cache reads bill at 10% of input, writes at 125%. */
  cacheRead: number;
  cacheWrite: number;
}

/**
 * USD per million tokens, current as of 2026-08-22.
 *
 * Sonnet 5 is on introductory pricing ($2/$10) until 2026-08-31, after which
 * it returns to $3/$15. That's a ~50% rise on every paid-tier call, so the
 * date is handled explicitly rather than left as a surprise. Costs are frozen
 * into each row at write time, so changing these numbers never rewrites
 * history.
 */
const SONNET_5_INTRO_ENDS = Date.parse('2026-09-01T00:00:00Z');

function sonnet5Price(at: Date): ModelPrice {
  const introactive = at.getTime() < SONNET_5_INTRO_ENDS;
  const input = introactive ? 2.0 : 3.0;
  const output = introactive ? 10.0 : 15.0;
  return { input, output, cacheRead: input * 0.1, cacheWrite: input * 1.25 };
}

function flatPrice(input: number, output: number): ModelPrice {
  return { input, output, cacheRead: input * 0.1, cacheWrite: input * 1.25 };
}

function priceFor(model: string, at: Date): ModelPrice | null {
  if (model.startsWith('claude-sonnet-5')) return sonnet5Price(at);
  if (model.startsWith('claude-haiku-4-5')) return flatPrice(1.0, 5.0);
  if (model.startsWith('claude-opus-5') || model.startsWith('claude-opus-4'))
    return flatPrice(5.0, 25.0);
  if (model.startsWith('claude-sonnet-4')) return flatPrice(3.0, 15.0);
  return null;
}

/** Deepgram Nova pre-recorded transcription, USD per minute of audio. */
const DEEPGRAM_USD_PER_MINUTE = 0.0043;

/** Anything Claude's SDK returns as `usage`, without depending on its type. */
interface RawUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function costOf(model: string, usage: RawUsage, at: Date = new Date()): number {
  const price = priceFor(model, at);
  // An unrecognised model logs at zero cost rather than guessing. The token
  // counts are still stored, so it can be repriced later - a wrong number is
  // worse than a visibly missing one.
  if (!price) return 0;
  const perToken = (millions: number) => millions / 1_000_000;
  return (
    (usage.input_tokens || 0) * perToken(price.input) +
    (usage.output_tokens || 0) * perToken(price.output) +
    (usage.cache_read_input_tokens || 0) * perToken(price.cacheRead) +
    (usage.cache_creation_input_tokens || 0) * perToken(price.cacheWrite)
  );
}

/**
 * Record one Claude call. Fire-and-forget - callers should not await this on
 * the critical path, and never need to try/catch it.
 */
export async function logUsage(params: {
  userId: string;
  surface: UsageSurface;
  model: string;
  usage: RawUsage | null | undefined;
  tier?: string | null;
  /** False when the call errored or hit max_tokens. We still paid for it. */
  succeeded?: boolean;
}): Promise<void> {
  try {
    const usage = params.usage || {};
    const at = new Date();
    await db.query(
      `INSERT INTO ai_usage (
         user_id, surface, provider, model, tier,
         input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
         cost_usd, succeeded
       ) VALUES ($1, $2, 'anthropic', $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        params.userId,
        params.surface,
        params.model,
        params.tier || null,
        usage.input_tokens || 0,
        usage.output_tokens || 0,
        usage.cache_read_input_tokens || 0,
        usage.cache_creation_input_tokens || 0,
        costOf(params.model, usage, at),
        params.succeeded !== false
      ]
    );
  } catch (error: any) {
    console.error('Failed to log AI usage:', {
      surface: params.surface,
      model: params.model,
      message: error?.message
    });
  }
}

/** Record one transcription, which bills by audio length rather than tokens. */
export async function logTranscriptionUsage(params: {
  userId: string;
  model: string;
  audioSeconds: number;
  succeeded?: boolean;
}): Promise<void> {
  try {
    const cost = (params.audioSeconds / 60) * DEEPGRAM_USD_PER_MINUTE;
    await db.query(
      `INSERT INTO ai_usage (
         user_id, surface, provider, model, audio_seconds, cost_usd, succeeded
       ) VALUES ($1, 'voice_transcription', 'deepgram', $2, $3, $4, $5)`,
      [
        params.userId,
        params.model,
        Number.isFinite(params.audioSeconds) ? params.audioSeconds : 0,
        Number.isFinite(cost) ? cost : 0,
        params.succeeded !== false
      ]
    );
  } catch (error: any) {
    console.error('Failed to log transcription usage:', { message: error?.message });
  }
}
