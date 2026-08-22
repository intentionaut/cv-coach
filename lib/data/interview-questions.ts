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
  },
  {
    id: 'q10',
    category: 'behavioural',
    difficulty: 'intermediate',
    question: 'Tell me about a time something went wrong on set or in a production, and what you did about it.',
    context: 'Behavioural question - use STAR: Situation, Task, Action, Result. The Result is the part most people forget.',
    scoringCriteria: {
      clarity: 'Follows a clear narrative with an actual outcome',
      relevance: 'A real production problem, not a hypothetical',
      depth: 'Shows what they personally did, not what the team did'
    }
  },
  {
    id: 'q11',
    category: 'behavioural',
    difficulty: 'intermediate',
    question: 'Describe a time you had to work with someone difficult. How did you handle it?',
    context: 'Crews are small and long hours are normal. They want to know you can be worked with.',
    scoringCriteria: {
      clarity: 'Specific situation rather than generalities',
      relevance: 'Focuses on their own conduct, not blaming the other person',
      depth: 'Shows self-awareness and a resolution'
    }
  },
  {
    id: 'q12',
    category: 'behavioural',
    difficulty: 'beginner',
    question: 'Tell me about a time you had to learn something quickly on the job.',
    context: 'Entry-level roles are largely judged on how fast you pick things up.',
    scoringCriteria: {
      clarity: 'A concrete example with a before and after',
      relevance: 'Something genuinely new to them at the time',
      depth: 'Shows how they learn, not just that they did'
    }
  },
  {
    id: 'q13',
    category: 'behavioural',
    difficulty: 'intermediate',
    question: 'Give me an example of a time you spotted a problem before it became one.',
    context: 'Anticipation is what separates a good runner from a great one.',
    scoringCriteria: {
      clarity: 'Clear on what they noticed and why it mattered',
      relevance: 'A real production context',
      depth: 'Shows initiative without overstepping'
    }
  },
  {
    id: 'q14',
    category: 'behavioural',
    difficulty: 'advanced',
    question: 'Tell me about a time you received difficult feedback. What did you do with it?',
    context: 'Sets run on direct feedback given fast. They need to know you can take it.',
    scoringCriteria: {
      clarity: 'Honest about the feedback rather than a humblebrag',
      relevance: 'Shows a real behaviour change',
      depth: 'Reflection without defensiveness'
    }
  },
  {
    id: 'q15',
    category: 'work-ethic',
    difficulty: 'beginner',
    question: 'The call time is 5am and the shoot runs 14 hours. How do you feel about that?',
    context: 'They are checking you understand the reality, not testing your enthusiasm.',
    scoringCriteria: {
      clarity: 'Realistic and specific',
      relevance: 'Shows understanding of production hours',
      depth: 'Evidence they have done long days before, if they have'
    }
  },
  {
    id: 'q16',
    category: 'teamwork',
    difficulty: 'beginner',
    question: 'How do you handle being given a task with no explanation of why it matters?',
    context: 'Common for entry-level crew. They want willingness without resentment.',
    scoringCriteria: {
      clarity: 'A clear stance',
      relevance: 'Understands hierarchy on set without being passive',
      depth: 'Balances doing the job with wanting to learn'
    }
  },
  {
    id: 'q17',
    category: 'industry-knowledge',
    difficulty: 'intermediate',
    question: 'Walk me through what happens on a shoot day, from call time to wrap.',
    context: 'Tests whether they have actually been on a set or only read about it.',
    scoringCriteria: {
      clarity: 'Follows a sensible order',
      relevance: 'Uses correct terminology naturally',
      depth: 'Detail that only comes from being there'
    }
  },
  {
    id: 'q18',
    category: 'industry-knowledge',
    difficulty: 'intermediate',
    question: 'Which department do you want to end up in, and what have you done to find out if it suits you?',
    context: 'Direction matters more than certainty at this stage.',
    scoringCriteria: {
      clarity: 'A specific department or path',
      relevance: 'Evidence of actually exploring it',
      depth: 'Understands what the work involves day to day'
    }
  },
  {
    id: 'q19',
    category: 'problem-solving',
    difficulty: 'intermediate',
    question: 'You are asked to do two urgent things at once by two different people. What do you do?',
    context: 'Happens constantly. They want to see judgement, not paralysis.',
    scoringCriteria: {
      clarity: 'A concrete approach',
      relevance: 'Understands who to ask and when',
      depth: 'Communicates rather than silently failing one task'
    }
  },
  {
    id: 'q20',
    category: 'experience',
    difficulty: 'beginner',
    question: 'What is a project you have worked on that you are genuinely proud of, and why?',
    context: 'Student and unpaid work counts. Specificity beats scale.',
    scoringCriteria: {
      clarity: 'Concrete project with their actual role',
      relevance: 'Explains their contribution honestly',
      depth: 'Says why it mattered to them, not just what it was'
    }
  },
  {
    id: 'q21',
    category: 'behavioural',
    difficulty: 'intermediate',
    question: 'Tell me about a time you made a mistake at work. What happened next?',
    context: 'They want honesty and recovery, not a claim that you never err.',
    scoringCriteria: {
      clarity: 'Owns the mistake plainly',
      relevance: 'A real one, with real stakes',
      depth: 'Shows what changed afterwards'
    }
  },
  {
    id: 'q22',
    category: 'technical',
    difficulty: 'beginner',
    question: 'What kit, software or processes are you already comfortable with?',
    context: 'Be honest about level. Overstating gets found out on day one.',
    scoringCriteria: {
      clarity: 'Specific names and honest levels',
      relevance: 'Relevant to the role applied for',
      depth: 'Distinguishes familiarity from competence'
    }
  },
  {
    id: 'q23',
    category: 'goals',
    difficulty: 'beginner',
    question: 'Why this company or production specifically, rather than any other?',
    context: 'Generic answers are obvious. Evidence of having looked them up matters.',
    scoringCriteria: {
      clarity: 'Names something specific about them',
      relevance: 'Connects to their own interests genuinely',
      depth: 'Beyond flattery - a real reason'
    }
  },
  {
    id: 'q24',
    category: 'work-ethic',
    difficulty: 'intermediate',
    question: 'How do you keep track of what you have been asked to do on a busy day?',
    context: 'Practical and revealing. There is no wrong system, only no system.',
    scoringCriteria: {
      clarity: 'Describes an actual method',
      relevance: 'Workable in a fast production environment',
      depth: 'Evidence they have needed it before'
    }
  }
];

// Builds a practice set for a session.
//
// Always opens with an introduction question and always includes at least one
// behavioural one (those are what the STAR structure check applies to). The
// rest is sampled at random so repeat sessions aren't identical - previously
// this returned the same first six every time, which meant a second session
// asked exactly the same questions as the first and the repeat-practice loop
// had nowhere to go.
//
// The introduction staple is deliberate: question text is the canonical key
// for tracking an answer's improvement across sessions, so keeping one
// constant question gives a stable basis for that comparison.
export function getGenericPracticeSet(count: number = 6): InterviewQuestion[] {
  const shuffle = <T,>(arr: T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const intros = GENERIC_FILM_QUESTIONS.filter(q => q.category === 'introduction');
  const behavioural = GENERIC_FILM_QUESTIONS.filter(q => q.category === 'behavioural');
  const opener = intros[0] ?? GENERIC_FILM_QUESTIONS[0];

  const picked: InterviewQuestion[] = [opener];
  if (behavioural.length > 0 && count > 1) {
    picked.push(shuffle(behavioural)[0]);
  }

  const chosenIds = new Set(picked.map(q => q.id));
  const remaining = shuffle(GENERIC_FILM_QUESTIONS.filter(q => !chosenIds.has(q.id)));

  return [...picked, ...remaining].slice(0, count);
}
