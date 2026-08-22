import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { canSeeMarketingPages } from '@/lib/flags';
import FilmDivider from '@/components/ui/FilmDivider';
import CoachingExchange from '@/components/marketing/CoachingExchange';

/**
 * The homepage.
 *
 * Positioning, in Dunford's terms: the competitive alternative for a film
 * graduate isn't Kickresume, it's a chatbot they already have open and a
 * careers advisor who's never worked a set. So the page argues against those,
 * not against other CV tools.
 *
 * The differentiator is the refusal - Friday won't hand over finished prose,
 * because the interview asks you to talk about your own work and pasted text
 * collapses at the first follow-up question. That's the one thing a general
 * model can't credibly claim and a competitor can't copy by next week, so it
 * leads. It's framed as what you gain rather than what we withhold: the
 * audience is early-career and anxious, and a bald refusal reads as cold.
 *
 * Deliberately absent: testimonials (one alpha user - inventing social proof
 * is worse than having none), outcome claims we can't evidence, and a
 * "what this won't do" section. The honesty is woven in instead; quarantining
 * it into its own section is a tic, not candour.
 *
 * **Fully static, and public to everyone.** No `useSession`, no session read,
 * no client JS - the CTAs are plain links. This used to be a client component
 * gated on session status, which meant crawlers and first-time visitors got
 * 18KB of loading spinner and none of the copy. Reading the session at all
 * would make the route dynamic and cost it CDN caching, which is the wrong
 * trade on the page we most want found and loaded fast. Signed-in users are
 * bounced to the dashboard by middleware instead, at the edge.
 *
 * Any future SEO landing page should follow the same shape.
 */

export const metadata: Metadata = {
  title: 'Friday — learn to talk about your own work',
  description:
    "Career coaching for people going for their first roles in film, TV and theatre. Friday won't write your CV for you - it shows you what's missing and asks the questions that get the answer out of you.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Friday — learn to talk about your own work',
    description:
      'Career coaching for people going for their first roles in film, TV and theatre.',
    type: 'website'
  }
};

export default function Home() {
  // Appears on its own once NEXT_PUBLIC_MARKETING_PAGES flips to 'public' -
  // linking to pages that 404 for visitors would be worse than no nav. No
  // email to pass: anyone still on this page is signed out by definition, so
  // the owner-preview case can't apply here.
  const showProductNav = canSeeMarketingPages();

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface border-b border-border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src="/friday-logo.png" alt="" width={40} height={40} />
            <span className="font-display text-2xl font-bold text-text-primary">Friday</span>
          </div>
          <div className="flex items-center gap-4">
            {showProductNav && (
              <Link
                href="/product"
                className="font-body hidden sm:inline text-sm font-medium text-text-secondary hover:text-text-primary transition"
              >
                Product
              </Link>
            )}
            <Link
              href="/faq"
              className="font-body hidden sm:inline text-sm font-medium text-text-secondary hover:text-text-primary transition"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="font-body bg-cta-primary text-text-on-cta px-5 py-2 rounded-lg font-bold hover:opacity-90 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero - the refusal, framed as what you gain, with the product's
            own voice alongside it as proof rather than another claim. */}
        <section className="bg-accent-tertiary text-text-on-tertiary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-text-inverse/70 mb-4">
                  Film · TV · Theatre
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold mb-5 text-balance">
                  Learn to talk about your own work
                </h1>
                <p className="font-body text-lg text-text-inverse/80 mb-8">
                  Friday is career coaching for people going for their first roles in the
                  industry. It won&apos;t write your CV for you. It&apos;ll show you what&apos;s
                  missing, ask the questions that get the answer out of you, and help you build
                  something you can defend when someone asks about it.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    href="/login"
                    className="font-body inline-block bg-cta-primary text-text-on-cta px-8 py-3 rounded-lg font-bold hover:opacity-90 transition text-lg"
                  >
                    Start with your CV
                  </Link>
                  <span className="font-body text-sm text-text-inverse/70">In private beta.</span>
                </div>
              </div>

              <div>
                <CoachingExchange
                  line="Responsible for various on-set duties"
                  question="Which two of those duties would you be trusted with again? And who decided you were the one doing them?"
                />
                <p className="font-body text-sm text-text-inverse/70 mt-4">
                  No rewritten line, no paste-ready sentence. The answer is yours, and
                  it&apos;s the same answer the interview will ask for.
                </p>
              </div>
            </div>
          </div>
          <FilmDivider tone="dark" />
        </section>

        {/* 2. The problem, in the audience's own language */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-3 text-balance">
            &ldquo;Tailor your CV for every role&rdquo; is not advice
          </h2>
          <p className="font-body text-text-secondary max-w-2xl mb-10">
            It&apos;s the thing everyone says and nobody explains. Especially when your credits
            section is still empty and your most recent job was behind a bar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Problem
              title="You haven't got credits yet"
              body="The experience you do have doesn't look like film experience, and nobody's told you which parts of it count. Some of it counts more than you think."
            />
            <Problem
              title="You can see the job ad. Not what matters in it."
              body="Every posting asks for the same six things. Working out which two actually decide it, for this role, on this production, is the part nobody teaches."
            />
            <Problem
              title="Then they ask you about it"
              body="A CV gets you in the room. The room asks you to talk about it, and that's a different skill — one you can't borrow from a document someone else wrote."
            />
          </div>
        </section>

        {/* 3. How it actually works - the real four stages */}
        <section className="bg-bg-surface border-y border-border-hairline">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-10">
              How it works
            </h2>
            <div className="space-y-8">
              <Stage
                number={1}
                title="Upload the CV you've already got"
                body="You get an honest read on it, scored against how this industry actually hires — not a generic template score. Plus the mechanical checks, so you know it survives the software before a person ever sees it."
              />
              <Stage
                number={2}
                title="Work out what to change, and change it yourself"
                body="Specific notes on what's weak and why. Where an example helps, it comes from a different production to yours — close enough to show the pattern, far enough that you can't paste it. The line ends up in your words, which is the point."
              />
              <Stage
                number={3}
                title="Write a cover letter that sounds like you"
                body="Answer a handful of questions about your work once. Friday keeps them, so every letter after the first asks you less and still comes out specific."
              />
              <Stage
                number={4}
                title="Apply — then tell it what happened"
                body="Interview, offer, rejection, silence. Over a few applications that's how you find out which version of your CV is actually working, instead of guessing."
              />
            </div>
          </div>
          <FilmDivider />
        </section>

        {/* 4. The real objection: they already have a chatbot open */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-3 text-balance">
            Why not just use AI myself?
          </h2>
          <p className="font-body text-text-secondary max-w-2xl mb-10">
            Fair question, and you should ask it. You can get a reasonable-looking CV out of a
            chatbot in about five minutes. It&apos;s worth being clear about what you&apos;re
            left with when you do, and what&apos;s different here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reason
              title="A document you can't defend"
              body="Ask for a CV and you'll get one. Then someone reads it back to you in an interview and asks what you actually did, and you're explaining a sentence you didn't write. Friday makes you write the line. It takes longer and it holds up."
            />
            <Reason
              title="It knows this industry, specifically"
              body="How credits are read, why the order of a crew list matters, what a first job in the camera department is really asking for, how freelance and production work sits on a page. A general model averages every industry at once. This one doesn't."
            />
            <Reason
              title="It's building a skill, not an artefact"
              body="Every prompt is aimed at getting you to articulate your own experience — which is the same skill the interview tests, and the same one you'll need for the next role, and the one after. The CV is the by-product."
            />
            <Reason
              title="It carries across, and it closes the loop"
              body="Your answers follow you from one letter to the next. Interview practice knows which role you're going for. And because you log what came back, the advice gets grounded in what actually happened to you — not just what generally works."
            />
          </div>
        </section>

        {/* 5. Close */}
        <section className="bg-bg-surface border-t border-border-hairline">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-4 text-balance">
              Start with the CV you&apos;ve got
            </h2>
            <p className="font-body text-text-secondary mb-8 max-w-xl mx-auto">
              Not the one you keep meaning to rewrite. Upload it as it is, get a straight read on
              what&apos;s working, and see what a rewrite looks like when you&apos;re the one
              writing it.
            </p>
            <Link
              href="/login"
              className="font-body inline-block bg-cta-primary text-text-on-cta px-8 py-3 rounded-lg font-bold hover:opacity-90 transition text-lg"
            >
              Start with your CV
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold text-text-primary mb-2 text-balance">{title}</h3>
      <p className="font-body text-sm text-text-secondary">{body}</p>
    </div>
  );
}

function Stage({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 sm:gap-6">
      <span
        className="font-display shrink-0 w-9 h-9 rounded-full bg-accent-secondary/30 text-text-primary font-bold flex items-center justify-center tabular-nums"
        aria-hidden="true"
      >
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold text-text-primary mb-1 text-balance">
          {title}
        </h3>
        <p className="font-body text-text-secondary max-w-2xl">{body}</p>
      </div>
    </div>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-bg-surface rounded-lg p-6 border border-border-hairline">
      <h3 className="font-display text-lg font-bold text-text-primary mb-2 text-balance">{title}</h3>
      <p className="font-body text-sm text-text-secondary">{body}</p>
    </div>
  );
}
