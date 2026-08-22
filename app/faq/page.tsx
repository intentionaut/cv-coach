import Link from 'next/link';
import Image from 'next/image';

// Answers are deliberately written to be useful without disclosing how the
// product works internally: no prompt content, model names, scoring weights,
// or vendor detail. Anything a competitor could copy or a user could game
// stays out. Where a limit is real (we can't see an employer's ATS, an AI
// read isn't a hiring decision), it's stated plainly rather than glossed.
const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Who is Friday for?',
    a: (
      <>
        <p>
          Friday is built for people trying to get into film, television, theatre,
          broadcast and entertainment — and specifically for the stage where the
          door is hardest to open:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Film, TV and drama students, at any point in your course</li>
          <li>Recent graduates working out how to turn a degree into a job</li>
          <li>
            Early-career crew — runners, PAs, assistants — building toward the
            next role
          </li>
          <li>
            Anyone chasing their first paid role in the industry, whether or not
            you studied for it
          </li>
        </ul>
        <p className="mt-2">
          It assumes you don&apos;t already have someone in the industry to ask.
          A lot of how hiring actually works here gets passed on informally, and
          if you don&apos;t know anyone, nobody tells you. Friday is meant to fill
          some of that gap.
        </p>
      </>
    )
  },
  {
    q: 'Is this just an AI CV writer?',
    a: (
      <>
        <p>
          No — and deliberately not. Friday won&apos;t hand you finished sentences
          to paste in. It asks you the questions that get what you actually did
          onto the page, in your words.
        </p>
        <p className="mt-2">
          That&apos;s a considered choice. Generic AI-written applications are easy
          to spot, and this is an industry that notices. It also means that when
          someone asks about your CV in an interview, you can talk about it,
          because you wrote it.
        </p>
      </>
    )
  },
  {
    q: 'Do I need experience already?',
    a: (
      <p>
        No. Most people starting out have more relevant experience than they
        realise — student productions, unpaid shoots, festival volunteering,
        work in other industries that involved real coordination or pressure.
        A lot of what Friday does is help you notice and describe that, rather
        than assuming you arrive with a full credit list.
      </p>
    )
  },
  {
    q: 'What does the score mean?',
    a: (
      <>
        <p>
          It&apos;s a read on how ready your CV is — and, if you&apos;ve added a
          job description, how well it lines up with that specific role. It is
          one informed opinion, not a verdict, and definitely not the
          employer&apos;s.
        </p>
        <p className="mt-2">
          A lower score on a role that stretches you is information, not a reason
          to skip applying. What matters more than the number is the specific
          gaps underneath it.
        </p>
      </>
    )
  },
  {
    q: 'What are the automated readability checks?',
    a: (
      <>
        <p>
          Employers often use software to read CVs before a person does. Those
          checks look at whether your CV can be read by a machine at all —
          contact details it can find, recognisable sections, dates it can parse,
          text it can actually extract.
        </p>
        <p className="mt-2">
          They&apos;re separate from the coaching score because they measure
          something different: not whether your CV is good, but whether it&apos;s
          legible. The panel also lists what it <em>can&apos;t</em> check — every
          employer&apos;s system differs, and we&apos;d rather tell you the limits
          than imply we know more than we do.
        </p>
      </>
    )
  },
  {
    q: 'Can you guarantee I get past the filters, or get the job?',
    a: (
      <p>
        No, and be wary of anything that says otherwise. Every employer&apos;s
        hiring software is configured differently, and no outside tool can see
        it. Friday can make your CV clearer, better evidenced and easier to
        read — it can&apos;t promise an outcome.
      </p>
    )
  },
  {
    q: 'Is my CV private?',
    a: (
      <>
        <p>
          Your CV, cover letters and practice answers are yours. They&apos;re
          visible to you in your account, and they aren&apos;t shared with
          employers, schools or other users.
        </p>
        <p className="mt-2">
          Friday uses third-party services to run the app and generate coaching
          feedback. The{' '}
          <Link href="/privacy" className="text-text-link underline">
            Privacy Policy
          </Link>{' '}
          sets out what&apos;s collected and how it&apos;s handled.
        </p>
      </>
    )
  },
  {
    q: 'Does it only work for UK roles?',
    a: (
      <p>
        The industry conventions it knows best are UK-oriented, and some
        examples reference UK schemes and employers. The coaching itself —
        being specific, evidencing what you did, structuring an interview
        answer — travels fine. If you&apos;re applying elsewhere, treat
        region-specific detail as a starting point rather than gospel.
      </p>
    )
  },
  {
    q: 'How much does it cost?',
    a: (
      <p>
        Friday is in early access while it&apos;s being built with a small group
        of users, so pricing isn&apos;t live yet. When it is, there will be a
        free tier that&apos;s genuinely usable — this is aimed at students and
        people entering the industry, and pricing that ignores that would defeat
        the point.
      </p>
    )
  },
  {
    q: "I'm a course leader or careers adviser — can I use this with students?",
    a: (
      <p>
        Yes, and it&apos;d be good to hear from you. Friday is designed to
        complement careers teaching rather than replace it — it uses the same
        structures careers services already teach, and it&apos;s deliberately
        cautious about claiming more than it can back up. Get in touch through
        the site and we can talk about how it might fit your programme.
      </p>
    )
  }
];

export const metadata = {
  title: 'FAQ — Friday',
  description:
    'Common questions about Friday, career coaching for people getting into film, TV, theatre and broadcast.'
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/friday-logo.png" alt="" width={28} height={28} />
            <span className="font-display text-xl font-bold text-text-primary">Friday</span>
          </Link>
          <Link
            href="/dashboard"
            className="font-body text-sm text-text-link hover:text-text-cta font-medium"
          >
            Go to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
          Frequently asked questions
        </h1>
        <p className="font-body text-text-secondary mb-8 max-w-2xl">
          What Friday does, who it&apos;s for, and what it won&apos;t pretend to do.
        </p>

        <div className="space-y-3">
          {FAQS.map((item, idx) => (
            <details
              key={idx}
              className="group bg-bg-surface rounded-lg border border-border-hairline overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-bg-main transition">
                <h2 className="font-display font-bold text-text-primary">{item.q}</h2>
                <svg
                  className="w-4 h-4 text-text-secondary group-open:rotate-180 transition shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 font-body text-sm text-text-secondary border-t border-border-hairline pt-4">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 bg-accent-secondary/20 border border-border-hairline rounded-lg p-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-2">
            Still stuck on something?
          </h2>
          <p className="font-body text-sm text-text-secondary">
            Friday is early and actively being built. If something is confusing,
            broken, or missing, saying so genuinely shapes what gets built next.
          </p>
        </div>
      </main>
    </div>
  );
}
