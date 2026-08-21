-- Tracks whether a user actually applied with a given cover letter, and
-- lets a simple status be captured/updated as things progress. applied_at
-- is the core signal (drives the "I Applied" action + revisit prompts);
-- status supports the richer "any updates?" follow-up once they've applied.

ALTER TABLE cover_letters ADD COLUMN applied_at TIMESTAMP;
ALTER TABLE cover_letters ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'applied', 'interviewing', 'offer', 'rejected'));
