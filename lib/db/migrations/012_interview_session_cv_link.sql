-- Links an interview practice session to the CV (and therefore the role)
-- it's preparing for. Until now the interview flow had no connection to
-- CV data at all - sessions were hardcoded as 'general', so a user could
-- build a CV for "Camera Trainee, BBC", write a cover letter for it, then
-- practise nine generic questions unrelated to either.
--
-- ON DELETE SET NULL rather than CASCADE: practice history is the user's
-- record of their own improvement over time, and deleting a CV shouldn't
-- destroy it. Such sessions simply revert to general practice.
ALTER TABLE interview_practice_sessions
  ADD COLUMN cv_id UUID REFERENCES cv_data(id) ON DELETE SET NULL;

CREATE INDEX idx_practice_sessions_cv_id ON interview_practice_sessions(cv_id);
