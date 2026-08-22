// Deterministic ATS-compatibility checks.
//
// Two deliberate design decisions here:
//
// 1. NO AI. Every check below is mechanical and verifiable, so this costs
//    nothing per run and returns instantly. That also means the result is
//    reproducible - the same CV always scores the same, which matters for a
//    number a user might show a careers adviser.
//
// 2. HONEST COVERAGE. Real applicant tracking systems vary by employer, and
//    plenty of what breaks them (column layouts, text inside images, font
//    embedding) simply isn't visible from extracted text. Rather than imply
//    authority we don't have, `NOT_ASSESSABLE` is reported alongside the
//    score so the denominator is always explicit - the same discipline the
//    CV coaching prompt uses when it refuses to invent detail.
//
// Note on tone: the CV *content* coaching is deliberately Socratic (ask,
// don't tell). ATS mechanics are the exception - "add your email address"
// is a fact, not a reflection prompt, so fixes here are direct.

export type AtsStatus = 'pass' | 'warn' | 'fail';

export interface AtsCheck {
  id: string;
  label: string;
  status: AtsStatus;
  /** What was actually found - stated plainly. */
  detail: string;
  /** Concrete action, only when there's something to do. */
  fix?: string;
}

export interface AtsReport {
  checks: AtsCheck[];
  passed: number;
  /** Checks that ran. Excludes anything skipped for lack of input. */
  assessed: number;
  /** Things no text-based tool can verify - shown to the user verbatim. */
  notAssessable: string[];
}

export interface AtsInput {
  contact?: { name?: string; email?: string; phone?: string; location?: string };
  summary?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{ degree?: string; institution?: string }>;
  skills?: string[];
  rawText?: string | null;
}

// Deliberately NOT checked here: keyword overlap against a job description.
// Naive term matching can only compare surface words - it can't tell that
// "coordinated a crew" answers a posting asking for "team leadership" - so
// it pushes toward keyword-stuffing, the exact ATS-first framing the CV
// coaching prompt was rewritten to move away from. Claude's analysis reads
// the posting properly and gives better, less contradictory advice.

/** Things that genuinely cannot be determined from extracted text. */
const NOT_ASSESSABLE = [
  'Whether your specific employer’s ATS parses your file - they all differ',
  'Column or table layouts, which often scramble on import',
  'Text inside images or graphics, which most systems cannot read at all',
  'Font embedding and encoding problems specific to your file'
];

export function runAtsChecks(input: AtsInput): AtsReport {
  const checks: AtsCheck[] = [];
  const contact = input.contact || {};
  const experience = input.experience || [];
  const education = input.education || [];
  const skills = input.skills || [];
  const raw = (input.rawText || '').trim();

  // --- Contact block: the single most common hard failure. An ATS that
  // can't find a way to contact you may discard the record outright. ---
  checks.push(
    contact.name?.trim()
      ? { id: 'name', label: 'Name found', status: 'pass', detail: 'Your name was picked up correctly.' }
      : {
          id: 'name',
          label: 'Name found',
          status: 'fail',
          detail: 'No name could be identified.',
          fix: 'Put your full name on its own line at the top, as plain text rather than inside a header or image.'
        }
  );

  checks.push(
    contact.email?.trim()
      ? { id: 'email', label: 'Email address', status: 'pass', detail: `Found ${contact.email}.` }
      : {
          id: 'email',
          label: 'Email address',
          status: 'fail',
          detail: 'No email address found.',
          fix: 'Add your email as plain text near the top. If it is only in a header or footer, move it into the body.'
        }
  );

  checks.push(
    contact.phone?.trim()
      ? { id: 'phone', label: 'Phone number', status: 'pass', detail: 'A contact number was found.' }
      : {
          id: 'phone',
          label: 'Phone number',
          status: 'warn',
          detail: 'No phone number found.',
          fix: 'Add a number - production roles often move fast and a call is quicker than email.'
        }
  );

  checks.push(
    contact.location?.trim()
      ? { id: 'location', label: 'Location', status: 'pass', detail: 'A location was found.' }
      : {
          id: 'location',
          label: 'Location',
          status: 'warn',
          detail: 'No location found.',
          fix: 'Add at least a city or region - many productions filter by where crew are based.'
        }
  );

  // --- Standard sections. ATS parsers look for recognisable headings and
  // map content underneath them; missing sections often parse as nothing. ---
  const summaryWords = (input.summary || '').trim().split(/\s+/).filter(Boolean).length;
  checks.push(
    summaryWords >= 15
      ? { id: 'summary', label: 'Professional summary', status: 'pass', detail: `Summary present (${summaryWords} words).` }
      : summaryWords > 0
        ? {
            id: 'summary',
            label: 'Professional summary',
            status: 'warn',
            detail: `Your summary is very short (${summaryWords} words).`,
            fix: 'Aim for roughly 2-3 sentences, so there is enough for a parser and a human to work with.'
          }
        : {
            id: 'summary',
            label: 'Professional summary',
            status: 'fail',
            detail: 'No summary section found.',
            fix: 'Add a short summary under a clear "Profile" or "Summary" heading.'
          }
  );

  checks.push(
    experience.length > 0
      ? { id: 'experience', label: 'Work experience section', status: 'pass', detail: `${experience.length} role${experience.length === 1 ? '' : 's'} found.` }
      : {
          id: 'experience',
          label: 'Work experience section',
          status: 'fail',
          detail: 'No work experience entries could be parsed.',
          fix: 'Use a plain "Experience" heading with each role as text, not inside a table.'
        }
  );

  // Dates matter more than people expect: many systems sort and filter on
  // them, and an entry without a parseable date can be dropped from results.
  if (experience.length > 0) {
    const undated = experience.filter(e => !e.startDate?.trim()).length;
    checks.push(
      undated === 0
        ? { id: 'dates', label: 'Dates on every role', status: 'pass', detail: 'All roles have a start date.' }
        : {
            id: 'dates',
            label: 'Dates on every role',
            status: 'warn',
            detail: `${undated} role${undated === 1 ? '' : 's'} missing a start date.`,
            fix: 'Add dates in a consistent format such as "Jun 2025 - Aug 2025". Parsers sort and filter on these.'
          }
    );

    const thin = experience.filter(e => (e.description || '').trim().split(/\s+/).filter(Boolean).length < 8).length;
    checks.push(
      thin === 0
        ? { id: 'descriptions', label: 'Roles have detail', status: 'pass', detail: 'Every role has a description.' }
        : {
            id: 'descriptions',
            label: 'Roles have detail',
            status: 'warn',
            detail: `${thin} role${thin === 1 ? '' : 's'} have little or no description.`,
            fix: 'Give each role at least a line or two - keyword matching has nothing to work with otherwise.'
          }
    );
  }

  checks.push(
    education.length > 0
      ? { id: 'education', label: 'Education section', status: 'pass', detail: `${education.length} entr${education.length === 1 ? 'y' : 'ies'} found.` }
      : {
          id: 'education',
          label: 'Education section',
          status: 'warn',
          detail: 'No education entries found.',
          fix: 'Add education under a clear heading, including in-progress study.'
        }
  );

  checks.push(
    skills.length >= 5
      ? { id: 'skills', label: 'Skills section', status: 'pass', detail: `${skills.length} skills listed.` }
      : skills.length > 0
        ? {
            id: 'skills',
            label: 'Skills section',
            status: 'warn',
            detail: `Only ${skills.length} skill${skills.length === 1 ? '' : 's'} listed.`,
            fix: 'List your skills explicitly - keyword filters match against this section most directly.'
          }
        : {
            id: 'skills',
            label: 'Skills section',
            status: 'fail',
            detail: 'No skills section found.',
            fix: 'Add a "Skills" heading with a comma-separated list, including equipment and software.'
          }
  );

  // --- File-level parse quality, only checkable when we kept the original
  // extracted text. This is where genuinely fatal problems show up. ---
  if (raw) {
    const wordCount = raw.split(/\s+/).filter(Boolean).length;

    checks.push(
      wordCount >= 150
        ? { id: 'extractable', label: 'Text is machine-readable', status: 'pass', detail: 'Your CV’s text extracted cleanly.' }
        : {
            id: 'extractable',
            label: 'Text is machine-readable',
            status: 'fail',
            detail: `Only ${wordCount} words could be extracted from the file.`,
            fix: 'This usually means the CV is an image or scan. Export a text-based PDF from your editor - most systems cannot read image CVs at all.'
          }
    );

    // eslint-disable-next-line no-control-regex
    const garbled = (raw.match(/[\x00-\x08\x0E-\x1F�]/g) || []).length;
    checks.push(
      garbled / Math.max(raw.length, 1) < 0.01
        ? { id: 'encoding', label: 'No garbled characters', status: 'pass', detail: 'Characters decoded cleanly.' }
        : {
            id: 'encoding',
            label: 'No garbled characters',
            status: 'warn',
            detail: 'Some characters did not decode cleanly.',
            fix: 'Re-export the file from your editor. Unusual fonts and special characters sometimes break on import.'
          }
    );

    checks.push(
      wordCount >= 250 && wordCount <= 1000
        ? { id: 'length', label: 'Sensible length', status: 'pass', detail: `${wordCount} words - about right for one to two pages.` }
        : wordCount < 250
          ? {
              id: 'length',
              label: 'Sensible length',
              status: 'warn',
              detail: `${wordCount} words is on the short side.`,
              fix: 'Thin CVs give filters little to match. More detail on what you actually did usually helps.'
            }
          : {
              id: 'length',
              label: 'Sensible length',
              status: 'warn',
              detail: `${wordCount} words is long for an early-career CV.`,
              fix: 'Two pages is the usual ceiling. Cut the least relevant material rather than shrinking the type.'
            }
    );
  }

  const passed = checks.filter(c => c.status === 'pass').length;

  // Ordered by what needs attention, not by the order checks happen to run
  // in. Anything actionable surfaces first; passing checks are reassurance,
  // not information, so they sink to the bottom. Sort is stable, so the
  // grouping above is preserved within each severity band.
  const severity: Record<AtsStatus, number> = { fail: 0, warn: 1, pass: 2 };
  const ordered = [...checks].sort((a, b) => severity[a.status] - severity[b.status]);

  return {
    checks: ordered,
    passed,
    assessed: checks.length,
    notAssessable: NOT_ASSESSABLE
  };
}
