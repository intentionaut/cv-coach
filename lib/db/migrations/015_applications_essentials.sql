-- Trims applications back to what they're for, and finishes the contract half
-- of 014's expand/contract.
--
-- 014 built a job-search tracker. That was wrong: LinkedIn, Mandy and
-- ScreenSkills already track job searches, and Friday competing with them
-- would be a worse version of something that exists. An application here is
-- the record that a piece of coaching work actually got sent somewhere - it is
-- created only when the user clicks "I applied", which is also what attaches
-- the CV or cover letter to it.
--
-- What survives is the structured data worth having: the role, and where
-- possible the company receiving it.
--
-- RUN THIS AFTER the code that stops using these columns is deployed. It only
-- drops things the app no longer reads, so deploying first is the safe order.

-- 1. Deleting an application should not destroy the letter written for it.
--    The letter is the user's own work and now exists independently, so it's
--    detached instead. (014 had this as CASCADE, from when a letter couldn't
--    exist without one.)
ALTER TABLE cover_letters DROP CONSTRAINT cover_letters_application_id_fkey;

ALTER TABLE cover_letters
  ADD CONSTRAINT cover_letters_application_id_fkey
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL;

-- 2. Remove the applications 014 invented on the user's behalf.
--    Its backfill turned every existing cover letter into an application,
--    including drafts that were never sent. Under the current model those
--    aren't applications at all - nobody said they applied. Detach first so
--    the letters themselves are untouched.
UPDATE cover_letters
SET application_id = NULL
WHERE application_id IN (SELECT id FROM applications WHERE status = 'draft');

DELETE FROM applications WHERE status = 'draft';

-- 3. Drop the tracker fields. `source` ("which channel found this") and
--    `notes` only make sense if this is where you manage a job search.
ALTER TABLE applications DROP COLUMN source;
ALTER TABLE applications DROP COLUMN notes;

-- 4. There is no draft state any more. An application exists because it was
--    sent; the status column only describes what came back.
ALTER TABLE applications DROP CONSTRAINT applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'no_response'));

ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'applied';

-- applied_at is now always known at creation time.
UPDATE applications SET applied_at = created_at WHERE applied_at IS NULL;
ALTER TABLE applications ALTER COLUMN applied_at SET NOT NULL;

-- 5. Finish 014's contract step: status and applied_at were duplicated onto
--    cover_letters back when a letter *was* the application. Nothing reads
--    them now. company_name, job_title and job_description stay - a letter is
--    written for a role whether or not it's ever sent, so it needs its own.
ALTER TABLE cover_letters DROP COLUMN status;
ALTER TABLE cover_letters DROP COLUMN applied_at;
