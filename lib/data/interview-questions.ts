// Generic film industry interview questions
// Covers ~30 minutes of practice time (6-8 questions)
//
// IMPORTANT: question text is used as the unique key for tracking across sessions
// This allows users to see how their answer to "Tell me about yourself" improves over time

export interface InterviewQuestion {
  id: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string; // This is the canonical text used for cross-session tracking
  context?: string;
  scoringCriteria: {
    clarity: string;
    relevance: string;
    depth: string;
  };
}

export const GENERIC_FILM_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    category: 'introduction',
    difficulty: 'beginner',
    question: 'Tell me about yourself and why you want to work in the film industry.',
    context: 'This is typically the opening question. Keep it concise (2-3 minutes) and relevant to the role.',
    scoringCriteria: {
      clarity: 'Clear structure with beginning, middle, and end',
      relevance: 'Connects personal experience to film industry goals',
      depth: 'Shows genuine passion and understanding of the industry'
    }
  },
  {
    id: 'q2',
    category: 'experience',
    difficulty: 'beginner',
    question: 'Describe a project you worked on and your specific role in it.',
    context: 'Focus on one specific project - could be student film, volunteer work, or professional project.',
    scoringCriteria: {
      clarity: 'Clear explanation of project scope and your responsibilities',
      relevance: 'Highlights relevant skills and contributions',
      depth: 'Discusses challenges faced and how you overcame them'
    }
  },
  {
    id: 'q3',
    category: 'teamwork',
    difficulty: 'intermediate',
    question: 'Film production requires intense collaboration. Tell me about a time you had to work with a difficult team member.',
    context: 'Use STAR method: Situation, Task, Action, Result',
    scoringCriteria: {
      clarity: 'Follows clear narrative structure (STAR method)',
      relevance: 'Demonstrates conflict resolution and professionalism',
      depth: 'Shows self-awareness and learning from the experience'
    }
  },
  {
    id: 'q4',
    category: 'problem-solving',
    difficulty: 'intermediate',
    question: 'Production schedules are tight and things go wrong. Describe a time when you had to solve an unexpected problem under pressure.',
    context: 'Film sets value quick thinking and resourcefulness',
    scoringCriteria: {
      clarity: 'Specific example with clear problem description',
      relevance: 'Shows practical problem-solving skills',
      depth: 'Demonstrates ability to stay calm and think creatively under pressure'
    }
  },
  {
    id: 'q5',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'What technical skills or equipment are you most comfortable with, and how have you developed these skills?',
    context: 'Be specific about software, equipment, or techniques',
    scoringCriteria: {
      clarity: 'Clear enumeration of specific skills/tools',
      relevance: 'Explains how skills were developed (courses, practice, projects)',
      depth: 'Shows ongoing commitment to learning and improvement'
    }
  },
  {
    id: 'q6',
    category: 'industry-knowledge',
    difficulty: 'intermediate',
    question: 'What current trends in film or television excite you, and why?',
    context: 'Shows you stay current with industry developments',
    scoringCriteria: {
      clarity: 'Articulates specific trends clearly',
      relevance: 'Connects trends to personal interests or career goals',
      depth: 'Demonstrates genuine industry knowledge and critical thinking'
    }
  },
  {
    id: 'q7',
    category: 'work-ethic',
    difficulty: 'beginner',
    question: 'Film production often involves long hours and unpredictable schedules. How do you handle demanding work environments?',
    context: 'Show you understand industry realities',
    scoringCriteria: {
      clarity: 'Honest and realistic about challenges',
      relevance: 'Provides concrete examples of managing demanding situations',
      depth: 'Shows strategies for maintaining energy and quality'
    }
  },
  {
    id: 'q8',
    category: 'goals',
    difficulty: 'beginner',
    question: 'Where do you see yourself in the film industry in 3-5 years?',
    context: 'Show ambition but also realism about career progression',
    scoringCriteria: {
      clarity: 'Specific career path or goals',
      relevance: 'Goals align with realistic industry progression',
      depth: 'Shows thought about steps needed to achieve goals'
    }
  }
];

// Helper to get a subset of questions for a 30-minute session
export function getGenericPracticeSet(count: number = 6): InterviewQuestion[] {
  // Return first 'count' questions for consistent practice
  return GENERIC_FILM_QUESTIONS.slice(0, count);
}
