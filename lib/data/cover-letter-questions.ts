// The Socratic question set for cover letters. Deliberately small and
// fixed - selection of which questions to ask is plain code (diff against
// what's already been answered), never a Claude call. Keeping the key list
// fixed is what makes that diff possible.

export interface ReusableQuestion {
  key: string;
  prompt: string;
  helper: string;
}

// Answered once, stored in user_letter_answers, reused across every future
// letter until the user edits them again.
export const REUSABLE_QUESTIONS: ReusableQuestion[] = [
  {
    key: 'motivation',
    prompt: "What draws you to this industry or kind of work?",
    helper: "Not the job posting's language - your own reason."
  },
  {
    key: 'proud_moment',
    prompt: "Tell me about a specific moment you're proud of.",
    helper: "A project, a problem you solved, something you made happen."
  },
  {
    key: 'strengths',
    prompt: "In your own words, what do you bring that's hard to put in a bullet point?",
    helper: "How you work, not just what you've done."
  }
];

export const REUSABLE_QUESTION_KEYS = REUSABLE_QUESTIONS.map(q => q.key);

// Given the user's current answer bank, which reusable questions still need
// asking. Missing or blank counts as unanswered.
export function getNeededAnswers(existing: Record<string, string | undefined>): string[] {
  return REUSABLE_QUESTION_KEYS.filter(key => !existing[key]?.trim());
}
