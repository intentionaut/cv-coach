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
  title: 'Improve your CV — Friday',
  description:
    'Friday asks you the questions that get your real experience onto the page, instead of writing it for you.'
};

export default async function ImproveYourCvPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Improve your CV"
        title="You've done more than your CV says you have"
        standfirst="Most people starting out in film and theatre undersell themselves — not because they lack experience, but because nobody ever taught them how to describe it. Friday helps you work that out, in your own words."
      />

      <Section title="The problem isn't your experience. It's the translation.">
        <Prose>
          <p>
            You ran supplies across a ten-day shoot, kept three departments talking to each
            other, and sorted a props crisis an hour before call time. On your CV it says{' '}
            <em>&ldquo;assisted the art department.&rdquo;</em>
          </p>
          <p>
            That gap — between what you actually did and what you wrote down — is the single
            most common reason good early-career applications get passed over. It&apos;s a
            writing problem, not a worth problem, and it&apos;s learnable.
          </p>
        </Prose>
      </Section>

      <Section title="How it works" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Upload what you've got">
            A PDF, Word doc or plain text file. It doesn&apos;t need to be finished or good.
            A rough first draft is a perfectly sensible place to start.
          </Step>
          <Step n={2} title="Tell it what you're going for">
            Optional, but useful. Name the role, or paste the posting. Feedback on a CV aimed
            at a camera traineeship is different from one aimed at a production office.
          </Step>
          <Step n={3} title="Get asked, not told">
            Rather than rewriting your lines, Friday points at what&apos;s vague and asks the
            question that unlocks it. <em>&ldquo;This says you helped with lighting — were you
            rigging, operating, or assisting the gaffer? Do you remember the crew size?&rdquo;</em>{' '}
            You answer from memory. The words stay yours.
          </Step>
          <Step n={4} title="Rewrite, re-upload, compare">
            Bring the improved draft back and see what moved. The score history keeps the
            earlier versions, so progress is visible rather than assumed.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          Plenty of tools will write your CV for you. Then you sit in the interview trying to
          explain sentences you didn&apos;t write.
        </Pullquote>
        <Prose>
          <p>
            That&apos;s the reason Friday works the way it does. If a hiring manager asks you
            about a line on your CV, you should be able to talk about it for five minutes
            without effort — because you lived it and you chose how to describe it.
          </p>
          <p>
            The side effect is the useful bit: the skill of articulating your own work
            transfers. It shows up in your cover letters, your interviews, and the conversation
            you have with someone on a wrap party who asks what you&apos;ve been up to.
          </p>
        </Prose>
      </Section>

      <Section title="Two different kinds of feedback" tint>
        <Prose>
          <p>
            <strong className="text-text-primary">Whether it reads well.</strong> One score,
            with the reasoning behind it. If you&apos;ve added a job description, that score
            reflects how ready the CV is for that specific role — so a lower number on an
            ambitious application is information, not a verdict on you.
          </p>
          <p>
            <strong className="text-text-primary">Whether software can read it at all.</strong>{' '}
            Employers often run CVs through screening tools before a person sees them. A
            separate set of mechanical checks looks at whether your contact details are
            findable, your sections are recognisable, your dates parse, and — the one that
            catches people out — whether your file is actually text rather than an image.
            That check is instant and free, and it tells you plainly what it can&apos;t
            verify.
          </p>
        </Prose>
      </Section>

      <Section title="One CV per kind of role">
        <Prose>
          <p>
            Early careers in this industry rarely run in a straight line. You might be going
            for a runner job, a broadcast apprenticeship and a theatre production role in the
            same month — and the same CV won&apos;t serve all three well.
          </p>
          <p>
            Friday keeps them separate, each aimed at its own kind of work. Your experience is
            reusable. The framing isn&apos;t.
          </p>
        </Prose>
      </Section>

      <Section tint>
        <ForTeachers>
          <p>
            Friday is built to support what you already teach, not to shortcut it. It gives
            students structured, specific feedback between tutorials, and it deliberately
            refuses to write anything for them — so the work you see is still theirs.
          </p>
          <p>
            The scoring is transparent about its own reach. Where something can&apos;t be
            checked from a text file, the tool says so rather than implying authority it
            doesn&apos;t have. That matters if you&apos;re recommending it to a cohort.
          </p>
        </ForTeachers>
      </Section>

      <Section>
        <HonestLimits
          items={[
            'It will not write your CV. If you want finished sentences handed to you, this is the wrong tool.',
            'It cannot promise you an interview. No tool can see how a given employer screens applications.',
            'It knows UK film, TV and theatre conventions best. The coaching travels; some specifics may not.',
            'It works from what you tell it. Experience you leave out stays invisible to it, same as to a hiring manager.'
          ]}
        />
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Start with the draft you already have"
        body="It doesn't need to be tidy. The first pass is about finding what you've left out, not judging what's there."
      />
    </>
  );
}
