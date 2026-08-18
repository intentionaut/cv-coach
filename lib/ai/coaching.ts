/**
 * AI Coaching utilities using Claude API (Anthropic)
 * Serverless API proxy to keep API key secure
 */

interface CVTailoringRequest {
  cvData: any;
  jobDescription: string;
  jobRequirements: string[];
}

interface InterviewFeedbackRequest {
  question: string;
  answer: string;
  scoringCriteria: Array<{
    criterion: string;
    weight: number;
    description: string;
  }>;
}

/**
 * Call the AI coaching API route for CV tailoring
 */
export async function getCVTailoringSuggestions(
  request: CVTailoringRequest
): Promise<{
  tailoredSummary: string;
  highlightedExperience: string[];
  highlightedSkills: string[];
  matchScore: number;
  suggestions: string[];
}> {
  const response = await fetch('/api/coaching/tailor-cv', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Failed to get CV tailoring suggestions');
  }

  return response.json();
}

/**
 * Call the AI coaching API route for interview feedback
 */
export async function getInterviewFeedback(
  request: InterviewFeedbackRequest
): Promise<{
  overallScore: number;
  strengths: string[];
  improvements: string[];
  criteriaScores: Record<string, { score: number; feedback: string }>;
  suggestedRevision?: string;
}> {
  const response = await fetch('/api/coaching/interview-feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Failed to get interview feedback');
  }

  return response.json();
}

/**
 * Get personalized coaching recommendations
 */
export async function getCoachingRecommendations(userId: string): Promise<{
  recommendations: Array<{
    type: 'skill' | 'question' | 'cv';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }>;
}> {
  const response = await fetch(`/api/coaching/recommendations?userId=${userId}`);

  if (!response.ok) {
    throw new Error('Failed to get coaching recommendations');
  }

  return response.json();
}
