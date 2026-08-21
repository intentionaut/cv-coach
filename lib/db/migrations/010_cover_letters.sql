-- Cover letters: each tied to one CV and one specific job application at a
-- point in time (company + role). A user may write several letters against
-- the same CV for different postings, so this is its own table rather than
-- a column on cv_data - company_name/job_title/job_description here are
-- per-letter and intentionally separate from cv_data's own job_title/
-- job_description, though the frontend pre-fills from those as a default.
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES cv_data(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT,
  content TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX idx_cover_letters_cv_id ON cover_letters(cv_id);

-- Reusable answer bank: persists per user (not per letter), independent of
-- any single cover_letters row, so a second letter only asks what's
-- genuinely new for that application instead of re-asking everything.
CREATE TABLE user_letter_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_key VARCHAR(50) NOT NULL,
  answer_text TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_key)
);
