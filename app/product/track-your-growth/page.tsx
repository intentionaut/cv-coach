import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  MarketingHero,
  Section,
  Prose,
  Step,
  Pullquote,
  ForTeachers,
  HonestLimits,
  MarketingCta
} from '@/components/marketing/MarketingPage';

export const metadata = {
  title: 'Track your growth — Friday',
  description:
    'Job hunting hides your progress. Friday keeps the evidence, so you can see how much you have actually improved.'
};

export default async function TrackYourGrowthPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Track your growth"
        title="Job hunting hides your progress from you"
        standfirst="Twenty applications in, the only feedback most people have received is silence — which feels identical whether you're getting better or standing still. You're usually getting better."
      />

      <Section title="Why this is worth fixing">
        <Prose>
          <p>
            Almost every other skill gives you something to hold onto. You can hear that
            you&apos;ve got faster at editing. You can see a shot you framed well.
          </p>
          <p>
            Applying for work gives you nothing. No reply is not feedback, and it&apos;s the
            main reason capable people conclude they aren&apos;t good enough and stop — often
            weeks before the thing they were doing would have worked.
          </p>
          <p>
            So Friday keeps the evidence. Not to gamify anything, but because the honest
            answer to &ldquo;am I actually improving?&rdquo; is usually yes, and you deserve
            to be able to check.
          </p>
        </Prose>
      </Section>

      <Section title="Four things worth watching" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Your CV, then and now">
            Every review is kept, so you can see the score climb across drafts. A CV that went
            from 51 to 74 looks nothing like one that started at 74, and that difference is
            the part you earned.
          </Step>
          <Step n={2} title="Your answer to the same question, months apart">
            Answer &ldquo;tell me about yourself&rdquo; in September and again in December,
            and you can read both side by side. This tends to be the one that lands hardest —
            the earlier version is often unrecognisable.
          </Step>
          <Step n={3} title="Where you're strong, and where you're not yet">
            Once you&apos;ve practised enough for a pattern to be real, your answers get
            grouped by question type. Consistently strong on teamwork, shakier on
            problem-solving — that&apos;s a study plan, not a judgement.
          </Step>
          <Step n={4} title="What actually happened">
            Applications sent, interviews reached, offers. The only numbers that finally
            matter, kept in one place so a slow month is visible as a slow month rather than
            as evidence about you.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          A weaker category almost always means less practice, not less ability. Those are
          very different conclusions to draw about yourself.
        </Pullquote>
        <Prose>
          <p>
            That distinction runs through all of this. The point of measuring anything here is
            to show you where to put your effort next — not to rank you, and not to produce a
            number you feel judged by.
          </p>
        </Prose>
      </Section>

      <Section title="What we deliberately don't measure" tint>
        <Prose>
          <p>
            There are no streaks, no daily reminders, no badge for logging in. Those mechanics
            reward time spent in an app, and time spent in this app is not the goal.
          </p>
          <p>
            The goal is that you get hired and stop needing it. Any measurement that quietly
            works against that outcome — however good it might look on a chart — has no
            business being here.
          </p>
        </Prose>
      </Section>

      <Section>
        <ForTeachers>
          <p>
            Students can see their own progress across a term, which is useful in tutorials:
            the conversation starts from evidence rather than from how the last application
            happened to feel.
          </p>
          <p>
            Worth noting what this is not. It isn&apos;t a monitoring tool, and there&apos;s
            no staff-facing view of a cohort. What a student shows you is their choice, which
            is the right default for something holding their unfinished work and their
            rejections.
          </p>
        </ForTeachers>
      </Section>

      <Section tint>
        <HonestLimits
          items={[
            'It only knows what you record. Applications sent elsewhere and never logged are invisible to it.',
            'Patterns need a few data points. Nothing is claimed as a strength or a weak spot on one answer.',
            'A rising score means your CV reads better. It cannot promise that hiring outcomes follow.',
            'Progress is not linear. A dip after aiming at a harder role is normal and not a step backwards.'
          ]}
        />
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Give yourself something to compare against"
        body="The first CV review is only a number. It becomes evidence the second time you do it."
      />
    </>
  );
}
