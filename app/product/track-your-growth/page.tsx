import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  MarketingHero,
  Section,
  Prose,
  Step,
  Pullquote,
  ForTeachers,
  MarketingCta
} from '@/components/marketing/MarketingPage';

export const metadata = {
  title: 'Track your growth — Friday',
  description:
    'Silence is not feedback. Friday keeps the receipts, so you can see how far you have actually come.'
};

export default async function TrackYourGrowthPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Track your growth"
        title="Twenty applications. No replies. No idea if you're getting better."
        standfirst="You are. You just have no way of seeing it, because silence looks identical whether you're improving or standing still. Friday keeps the receipts."
      />

      <Section title="Every other skill gives you something back">
        <Prose>
          <p>
            You can hear that your edits got tighter. You can look at a shot and know it&apos;s
            better than the one you framed last year.
          </p>
          <p>
            Applying for work gives you nothing at all. And that void is the main reason capable
            people decide they aren&apos;t good enough and stop — often a fortnight before the
            thing they were doing would have worked.
          </p>
        </Prose>
      </Section>

      <Section title="Four kinds of proof" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Your CV, draft by draft">
            Every review is kept. A CV that climbed from 51 to 74 looks nothing like one that
            started at 74, and that difference is entirely yours.
          </Step>
          <Step n={2} title="The same answer, months apart">
            Answer &ldquo;tell me about yourself&rdquo; in September, then again in December, and
            read them side by side. This is the one that gets people. The old version is often
            unrecognisable.
          </Step>
          <Step n={3} title="Your patterns">
            Once you&apos;ve practised enough for it to mean something, your answers group by
            question type. Strong on teamwork, thinner on problem-solving. That&apos;s a revision
            plan, not a verdict.
          </Step>
          <Step n={4} title="What actually happened">
            Applications sent. Interviews reached. Offers. The numbers that finally count, in one
            place, so a quiet month reads as a quiet month rather than as a fact about you.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          A weaker category nearly always means less practice, not less ability. Those are very
          different things to believe about yourself.
        </Pullquote>
        <Prose>
          <p>
            Everything measured here exists to show you where to aim next. None of it exists to
            rank you.
          </p>
          <p>
            There are no streaks, no daily nudges, no badge for turning up. Those reward time
            spent in an app, and time spent in this app was never the goal. The goal is you get
            hired and stop needing it.
          </p>
        </Prose>
      </Section>

      <Section tint>
        <ForTeachers>
          <p>
            Students can see their own progress across a term, which changes what a tutorial can
            be. The conversation starts from evidence instead of from how last week&apos;s
            rejection happened to feel.
          </p>
          <p>
            There&apos;s no staff dashboard showing you a cohort. What a student shows you is theirs
            to choose — the right default for something holding their unfinished work
            and their knockbacks.
          </p>
        </ForTeachers>
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Give yourself something to compare against"
        body="The first review is just a number. It turns into proof the second time you do it."
      />
    </>
  );
}
