export type Tier = 'free' | 'starter' | 'pro';

export const TIERS: Tier[] = ['free', 'starter', 'pro'];

interface TierLimits {
  /** Max number of CVs a user on this tier can create. null = unlimited. */
  maxCvs: number | null;
  /** Max number of edit/analyze calls per CV on this tier. null = unlimited. */
  maxEditsPerCv: number | null;
  /** Max characters allowed in summary and each experience/project description. null = unlimited. */
  maxFieldLength: number | null;
  /** Written interview practice (text-based Q&A). */
  interviewPractice: boolean;
  /** Phone-call-style voice interview practice. */
  phoneCallPractice: boolean;
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxCvs: 1,
    maxEditsPerCv: 5,
    maxFieldLength: 500,
    interviewPractice: false,
    phoneCallPractice: false
  },
  starter: {
    maxCvs: 3,
    maxEditsPerCv: null,
    maxFieldLength: null,
    interviewPractice: true,
    phoneCallPractice: false
  },
  pro: {
    maxCvs: null,
    maxEditsPerCv: null,
    maxFieldLength: null,
    interviewPractice: true,
    phoneCallPractice: true
  }
};

export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Model selection: Free tier uses Haiku for all Claude calls to control
 * cost; Starter and Pro use Sonnet.
 */
export function getModelForTier(tier: Tier): string {
  return tier === 'free' ? 'claude-haiku-4-5' : 'claude-sonnet-5';
}

export function isValidTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as string[]).includes(value);
}
