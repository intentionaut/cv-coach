-- Add pricing tier support.
-- tier is manually admin-settable for now (no payment processor yet).
-- cv_data gets a name (for multi-CV support) and an edit_count (for the
-- Free tier's edit cap). user_id was never uniquely constrained, so
-- multiple CVs per user already worked at the schema level.

ALTER TABLE users ADD COLUMN tier VARCHAR(20) NOT NULL DEFAULT 'free'
  CHECK (tier IN ('free', 'starter', 'pro'));

ALTER TABLE cv_data ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'My CV';
ALTER TABLE cv_data ADD COLUMN edit_count INTEGER NOT NULL DEFAULT 0;
