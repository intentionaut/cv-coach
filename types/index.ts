// Core data types for Friday

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  passwordHash: string;
}

export interface CVData {
  id: string;
  userId: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    portfolio?: string;
    linkedin?: string;
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  updatedAt: Date;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  verified: boolean;
}

export type SkillCategory =
  | 'technical' // Camera, lighting, editing software
  | 'creative' // Storytelling, direction, cinematography
  | 'production' // Project management, budgeting
  | 'soft'; // Communication, teamwork, problem-solving

export interface Project {
  id: string;
  title: string;
  role: string;
  description: string;
  date: string;
  url?: string;
  skills: string[];
}

export interface JobRole {
  id: string;
  title: string;
  company?: string;
  description: string;
  requirements: string[];
  createdAt: Date;
}

export interface TailoredCV {
  id: string;
  userId: string;
  roleId: string;
  cvData: CVData;
  tailoredSummary: string;
  highlightedExperience: string[];
  highlightedSkills: string[];
  matchScore: number; // 0-100
  suggestions: string[];
  createdAt: Date;
}

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  context?: string;
  modelAnswer?: string;
  scoringCriteria: ScoringCriterion[];
}

export type QuestionCategory =
  | 'behavioral' // Tell me about a time when...
  | 'technical' // Camera settings, equipment knowledge
  | 'creative' // Vision, storytelling approach
  | 'situational' // How would you handle...
  | 'portfolio'; // Walk me through your work

export interface ScoringCriterion {
  criterion: string;
  weight: number; // 0-1, should sum to 1
  description: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  roleId?: string;
  questionId: string;
  question: string;
  writtenAnswer?: string;
  audioUrl?: string;
  transcription?: string;
  aiFeedback?: AIFeedback;
  selfScore?: number; // 1-5
  completedAt: Date;
  timeSpent: number; // seconds
}

export interface AIFeedback {
  overallScore: number; // 0-100
  strengths: string[];
  improvements: string[];
  criteriaScores: {
    [criterion: string]: {
      score: number;
      feedback: string;
    };
  };
  suggestedRevision?: string;
}

export interface SkillsAssessment {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  selfRating: number; // 1-5
  assessmentType: 'self' | 'interview' | 'project';
  evidence?: string;
  assessedAt: Date;
}

export interface ProgressMetrics {
  userId: string;
  totalInterviews: number;
  averageScore: number;
  improvementTrend: number; // -100 to +100
  strongCategories: QuestionCategory[];
  needsWorkCategories: QuestionCategory[];
  confidenceLevel: number; // 1-5
  lastPracticed: Date;
}

export interface CoachingRecommendation {
  type: 'skill' | 'question' | 'cv';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}
