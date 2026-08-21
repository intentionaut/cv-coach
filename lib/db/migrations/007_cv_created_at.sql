-- Needed for stable CV numbering in the switcher - updated_at changes every
-- time a CV is edited or analyzed, which would make card numbers reshuffle
-- under the user. Existing rows backfill to "now"; stable going forward.

ALTER TABLE cv_data ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
