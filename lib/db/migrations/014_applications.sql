-- Promotes "application" to its own object.
--
-- cover_letters had been quietly acting as the application record: of its
-- meaningful fields, only `content` actually described a letter. company_name,
-- job_title, job_description, cv_id, status and applied_at all describe a job
-- you're going for. Three problems followed from that:
--
--   1. cv_id was NOT NULL, so an application couldn't exist before a CV was
--      attached, or before the letter was written.
--   2. A job you got by emailing a CV to a coordinator - probably most
--      early-career crew work - was untrackable, because there was no letter
--      to hang it on.
--   3. Deleting a letter destroyed the outcome history with it.
--
-- This migration is deliberately additive. Nothing is dropped, so it can be
-- applied before the code that uses it ships, and rolled back by ignoring the
-- new table. The duplicate columns on cover_letters are removed separately in
-- 015, once this is confirmed working against real data.

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Optional, unlike the old cover_letters.cv_id. You can log an application
  -- made before Friday existed, or one sent without a tailored CV.
  cv_id UUID REFERENCES cv_data(id) ON DELETE SET NULL,

  company_name VARCHAR(255),
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT,

  -- Where it came from or how it was sent (ScreenSkills, Mandy, direct email,
  -- someone you know). Free text rather than an enum: this industry's channels
  -- vary too much to fix a list, and it feeds the "which routes actually
  -- convert" question.
  source VARCHAR(120),

  -- no_response is a distinct outcome from rejected, and a common one. Folding
  -- silence into "rejected" would overstate how many applications actually got
  -- a decision.
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'applied', 'interviewing', 'offer', 'rejected', 'no_response')),

  applied_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(user_id, status);
CREATE INDEX idx_applications_cv_id ON applications(cv_id);

-- A letter now belongs to an application rather than being one. The column is
-- added without its foreign key so the backfill below can mint ids into it
-- before the matching applications exist.
ALTER TABLE cover_letters ADD COLUMN application_id UUID;

-- Backfill: every existing letter becomes an application carrying its details,
-- so no history is lost and existing rows keep working.
--
-- Ids are generated on the letters first and then inserted verbatim, rather
-- than INSERT ... RETURNING and matching rows back up afterwards. Matching on
-- (user_id, job_title, created_at) would be ambiguous for two letters written
-- for the same role in the same instant, and there is no natural key that
-- isn't; this way each letter carries the id of exactly its own application.
UPDATE cover_letters SET application_id = gen_random_uuid() WHERE application_id IS NULL;

INSERT INTO applications (
  id, user_id, cv_id, company_name, job_title, job_description,
  status, applied_at, created_at, updated_at
)
SELECT
  cl.application_id, cl.user_id, cl.cv_id, cl.company_name, cl.job_title,
  cl.job_description, cl.status, cl.applied_at, cl.created_at, cl.updated_at
FROM cover_letters cl;

ALTER TABLE cover_letters
  ADD CONSTRAINT cover_letters_application_id_fkey
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

CREATE INDEX idx_cover_letters_application_id ON cover_letters(application_id);
