-- Persist the target role text per CV so it survives switching between CVs
-- or reloading the page, instead of living only in transient React state.

ALTER TABLE cv_data ADD COLUMN target_role TEXT;
