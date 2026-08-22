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
  title: 'Learn to interview — Friday',
  description:
    'Practise real film and theatre interview questions and get told exactly which part of your answer is missing.'
};

export default async function LearnToInterviewPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Learn to interview"
        title="&ldquo;And then what happened?&rdquo;"
        standfirst="The question that catches people out. You describe the chaos brilliantly, you explain what you did, and then you stop — right before the bit that would have got you the job."
      />

      <Section title="Answers have a shape">
        <Prose>
          <p>
            Interviews feel like a personality test. They aren&apos;t. Most of the distance
            between a forgettable answer and a strong one is structure, and structure is
            something you can drill.
          </p>
          <p>
            The piece almost everyone drops is the ending. Did the scene shoot on time? Did the
            1st AD notice? What was different because you were there? Without it, you&apos;ve
            told a story. With it, you&apos;ve given evidence.
          </p>
        </Prose>
      </Section>

      <Section title="What practice looks like" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Two dozen real questions">
            Drawn from how this industry actually hires. The 5am call time. Being handed a job
            with no explanation. Two people needing something urgent at the same moment. The
            mistake you made and what happened next.
          </Step>
          <Step n={2} title="Pointed at the job you want">
            Attach a session to one of your CVs and the questions and feedback follow that role
            instead of treating every application as identical.
          </Step>
          <Step n={3} title="Your answer, broken into its parts">
            Situation, Task, Action, Result — each checked separately. You see precisely which
            piece is missing rather than being told to add &ldquo;more structure&rdquo; and left
            to guess.
          </Step>
          <Step n={4} title="Questions back, never a script">
            Missing your Result? You get asked what happened after you got back to set. You dig
            it out of your own memory, which is the only place it was ever going to come from.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          A memorised answer survives exactly one question. An answer you understand survives the
          follow-up.
        </Pullquote>
        <Prose>
          <p>
            People in this industry ask follow-ups fast, usually because they&apos;re genuinely
            interested in the shoot you just mentioned. That&apos;s the moment a rehearsed
            paragraph runs out and a real story keeps going.
          </p>
        </Prose>
      </Section>

      <Section title="Rate yourself before you see the feedback" tint>
        <Prose>
          <p>
            You&apos;re asked how you think the answer went before anything is revealed. Then
            the two reads are compared.
          </p>
          <p>
            Sometimes you&apos;ve oversold it and there&apos;s a blind spot to work on. Just as
            often it flips: you said two, it reads as four, and you find out you&apos;ve been
            walking into rooms apologising for work that was already good.
          </p>
          <p>
            The gap closes with practice. Judging your own work accurately is the part you carry
            into every interview after this one.
          </p>
        </Prose>
      </Section>

      <Section>
        <ForTeachers>
          <p>
            The framework is STAR, so students get reinforcement of what your careers service
            already teaches rather than a competing model to reconcile.
          </p>
          <p>
            One detail you might appreciate: STAR is only applied to behavioural questions. Ask
            why someone wants to work in film and the structure check steps aside, because
            teaching students to bolt a Situation onto a motivation question makes their answers
            worse, not better.
          </p>
        </ForTeachers>
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Answer one question properly"
        body="Not a whole session. Pick the one you'd least like to be asked and write a real answer to it."
      />
    </>
  );
}
