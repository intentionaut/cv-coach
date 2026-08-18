-- Database schema for CV Coach
-- PostgreSQL (Neon)

-- Users table: authentication and profile
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- CV data table: stores user's CV information
CREATE TABLE cv_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  personal_info JSONB NOT NULL,
  summary TEXT,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cv_user_id ON cv_data(user_id);

-- Job roles table: roles the user is targeting
CREATE TABLE job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_roles_user_id ON job_roles(user_id);

-- Tailored CVs table: CV versions optimized for specific roles
CREATE TABLE tailored_cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES job_roles(id) ON DELETE CASCADE,
  cv_data JSONB NOT NULL,
  tailored_summary TEXT,
  highlighted_experience JSONB DEFAULT '[]'::jsonb,
  highlighted_skills JSONB DEFAULT '[]'::jsonb,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tailored_cvs_user_id ON tailored_cvs(user_id);
CREATE INDEX idx_tailored_cvs_role_id ON tailored_cvs(role_id);

-- Interview questions bank: curated questions for film industry
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  model_answer TEXT,
  scoring_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_category ON interview_questions(category);
CREATE INDEX idx_questions_difficulty ON interview_questions(difficulty);

-- Interview sessions table: practice sessions and recordings
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
  question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  written_answer TEXT,
  audio_url TEXT,
  transcription TEXT,
  ai_feedback JSONB,
  self_score INTEGER CHECK (self_score >= 1 AND self_score <= 5),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  time_spent INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_question_id ON interview_sessions(question_id);
CREATE INDEX idx_sessions_completed_at ON interview_sessions(completed_at DESC);

-- Skills assessments table: track skill progression
CREATE TABLE skills_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID,
  skill_name VARCHAR(255) NOT NULL,
  self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 5),
  assessment_type VARCHAR(50) NOT NULL,
  evidence TEXT,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_user_id ON skills_assessments(user_id);
CREATE INDEX idx_assessments_skill_name ON skills_assessments(skill_name);
CREATE INDEX idx_assessments_assessed_at ON skills_assessments(assessed_at DESC);

-- Progress metrics table: aggregate coaching metrics
CREATE TABLE progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_interviews INTEGER DEFAULT 0,
  average_score DECIMAL(5, 2) DEFAULT 0,
  improvement_trend DECIMAL(5, 2) DEFAULT 0,
  strong_categories JSONB DEFAULT '[]'::jsonb,
  needs_work_categories JSONB DEFAULT '[]'::jsonb,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  last_practiced TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_user_id ON progress_metrics(user_id);

-- Coaching recommendations table: personalized suggestions
CREATE TABLE coaching_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_user_id ON coaching_recommendations(user_id);
CREATE INDEX idx_recommendations_priority ON coaching_recommendations(priority);
CREATE INDEX idx_recommendations_completed ON coaching_recommendations(completed);
