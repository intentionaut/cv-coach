-- Comparison baseline for detecting whether a re-uploaded CV actually
-- changed. Existing rows backfill to NULL - treated as "no baseline,"
-- so a CV's first re-upload after this migration always proceeds as a
-- real change rather than silently being skipped.

ALTER TABLE cv_data ADD COLUMN raw_text TEXT;
