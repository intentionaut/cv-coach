-- Splits the single freeform "target role" field into a short job_title
-- (e.g. "Camera Trainee") and a longer job_description (pasted posting
-- text) so each can be captured, displayed, and defaulted independently -
-- notably, job_title becomes the default name for a newly created CV.
-- Existing target_role data was always freeform pasted text, so it maps
-- cleanly onto job_description; job_title starts NULL for existing rows.

ALTER TABLE cv_data RENAME COLUMN target_role TO job_description;
ALTER TABLE cv_data ADD COLUMN job_title TEXT;
