-- Link coaching_recommendations to a specific CV, so a user with multiple
-- CVs (see 004_pricing_tiers.sql) gets separate cached analysis per CV
-- instead of one analysis shared across all of them.

ALTER TABLE coaching_recommendations
  ADD COLUMN cv_id UUID REFERENCES cv_data(id) ON DELETE CASCADE;

-- Backfill: every existing cv_analysis row today belongs to the user's one
-- existing CV (current app logic never created more than one per user).
UPDATE coaching_recommendations cr
SET cv_id = cd.id
FROM cv_data cd
WHERE cr.user_id = cd.user_id
  AND cr.type = 'cv_analysis'
  AND cr.cv_id IS NULL;

CREATE INDEX idx_recommendations_cv_id ON coaching_recommendations(cv_id);
