-- Add interview practice sessions table
-- Groups multiple question responses into cohesive practice sessions
-- Supports tracking confidence and improvement over time

CREATE TABLE interview_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL, -- Optional: can be generic or role-specific
  title VARCHAR(255) NOT NULL,
  session_type VARCHAR(50) DEFAULT 'general', -- 'general', 'role-specific'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_time_minutes INTEGER DEFAULT 0,
  overall_confidence INTEGER CHECK (overall_confidence >= 1 AND overall_confidence <= 5),
  overall_clarity INTEGER CHECK (overall_clarity >= 1 AND overall_clarity <= 5),
  notes TEXT
);

CREATE INDEX idx_practice_sessions_user_id ON interview_practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_role_id ON interview_practice_sessions(role_id);
CREATE INDEX idx_practice_sessions_started_at ON interview_practice_sessions(started_at DESC);

-- Add practice_session_id to interview_sessions
ALTER TABLE interview_sessions ADD COLUMN practice_session_id UUID REFERENCES interview_practice_sessions(id) ON DELETE CASCADE;
CREATE INDEX idx_sessions_practice_session_id ON interview_sessions(practice_session_id);

-- Add confidence and clarity scores to individual question responses
ALTER TABLE interview_sessions ADD COLUMN confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 5);
ALTER TABLE interview_sessions ADD COLUMN clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 5);

-- Add question category and difficulty for analytics
-- This allows us to track performance on specific question types across roles
ALTER TABLE interview_sessions ADD COLUMN question_category VARCHAR(50);
ALTER TABLE interview_sessions ADD COLUMN question_difficulty VARCHAR(20);
CREATE INDEX idx_sessions_category ON interview_sessions(question_category);
CREATE INDEX idx_sessions_user_role ON interview_sessions(user_id, role_id) WHERE role_id IS NOT NULL;

-- Create view for question performance analytics by role
-- This enables queries like: "Which question categories does this user perform best in for Production Assistant roles?"
CREATE VIEW question_performance_by_role AS
SELECT
  user_id,
  role_id,
  question_category,
  question_difficulty,
  COUNT(*) as attempts,
  AVG(confidence_score) as avg_confidence,
  AVG(clarity_score) as avg_clarity,
  AVG((confidence_score + clarity_score) / 2.0) as avg_combined_score,
  MAX(completed_at) as last_attempted
FROM interview_sessions
WHERE confidence_score IS NOT NULL AND clarity_score IS NOT NULL
GROUP BY user_id, role_id, question_category, question_difficulty;

-- Create view for identifying user strengths by question type
CREATE VIEW user_question_strengths AS
SELECT
  user_id,
  question_category,
  COUNT(*) as total_attempts,
  AVG(confidence_score) as avg_confidence,
  AVG(clarity_score) as avg_clarity,
  AVG((confidence_score + clarity_score) / 2.0) as avg_score
FROM interview_sessions
WHERE confidence_score IS NOT NULL AND clarity_score IS NOT NULL
GROUP BY user_id, question_category
HAVING COUNT(*) >= 2; -- At least 2 attempts to establish pattern
