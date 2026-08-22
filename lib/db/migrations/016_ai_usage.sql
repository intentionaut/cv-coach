-- Records what every AI call actually cost.
--
-- Until now `message.usage` was read in exactly five places, all of them
-- inside console.error() for truncation. On the success path the token counts
-- were thrown away, which made "what does a CV analysis cost us" unanswerable
-- and unbackfillable - the numbers only exist in the API response, once.
--
-- This is deliberately its own table rather than columns on cv_data or
-- applications: one user action can span several calls (upload parses, then
-- analysis streams), retries cost real money even when the user sees nothing,
-- and a row here is an accounting fact that shouldn't disappear when the CV
-- it refers to is deleted.

CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kept on user delete would be nicer for accounting, but the product
  -- promises deletion means deletion. Aggregate before you purge.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Which product surface spent the money: cv_analysis, cv_upload,
  -- cover_letter, cover_letter_review, interview_answer, voice_answer,
  -- voice_transcription. Named for the user-facing thing, not the route, so
  -- it survives refactors.
  surface VARCHAR(60) NOT NULL,

  provider VARCHAR(20) NOT NULL DEFAULT 'anthropic',
  model VARCHAR(60) NOT NULL,

  -- The tier at the time of the call. Pricing routing is per-tier, so a
  -- blended average across tiers is meaningless without this.
  tier VARCHAR(20),

  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,

  -- Transcription is billed by audio length, not tokens.
  audio_seconds NUMERIC(10, 2),

  -- Computed and frozen at write time. Model prices change - Sonnet 5's
  -- introductory rate ends 2026-08-31 - and a historical cost recalculated at
  -- today's prices is a fiction. The token counts stay alongside it so the
  -- maths can always be re-checked.
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,

  -- False for calls that errored or hit max_tokens. You pay for those too,
  -- and a rising failed spend is worth seeing.
  succeeded BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX idx_ai_usage_surface ON ai_usage(surface, created_at);
