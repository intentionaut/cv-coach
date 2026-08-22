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
  title: 'Practice interview calls — Friday',
  description:
    'Say your answers out loud, read back exactly what you said, and fix it somewhere it costs you nothing.'
};

export default async function PracticeInterviewCallsPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Practice interview calls"
        title="You've written the answer. You've never said it."
        standfirst="For most people, the first time an answer leaves their mouth is during the interview that matters. Then they discover it runs ninety seconds too long and loses its thread in the middle."
      />

      <Section title="Speaking is a separate skill">
        <Prose>
          <p>
            On paper you get four attempts at a sentence before anyone sees it. Out loud you get
            one, in real time, while managing nerves and someone else&apos;s silence.
          </p>
          <p>
            Film and TV also hire by phone constantly. A coordinator ringing on Thursday about a
            Monday start is an interview, whatever anyone called it. You rarely get warning, and
            you never get a second take.
          </p>
        </Prose>
      </Section>

      <Section title="How a call works" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Choose what you're preparing for">
            Attach it to one of your CVs and the questions follow that role.
          </Step>
          <Step n={2} title="Answer out loud, one take">
            You hear the question, you speak. No backspace, no second attempt. That constraint is
            the entire exercise.
          </Step>
          <Step n={3} title="Read back exactly what you said">
            Your answer comes back as text. This is the uncomfortable, genuinely useful bit — the
            repetitions and abandoned sentences are all sitting there, in a way memory politely
            edits out.
          </Step>
          <Step n={4} title="Same feedback as written practice">
            The identical STAR breakdown and the same questions back. One method, whether you
            type it or say it.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          Hearing yourself say &ldquo;um, so basically&rdquo; four times in ninety seconds fixes
          it permanently. Being told you use filler words does nothing.
        </Pullquote>
        <Prose>
          <p>
            That&apos;s the real value here — evidence, not analysis. A transcript is impossible
            to argue with, and it costs nothing to be bad in front of.
          </p>
          <p>
            What it catches: rambling, sentences that never land, an answer three times longer
            than you thought, the point you made twice. What it can&apos;t: warmth, pace, whether
            you sounded like someone worth having around at hour twelve. Get that from a person.
          </p>
        </Prose>
      </Section>

      <Section tint>
        <ForTeachers>
          <p>
            Mock interviews are the most valuable thing you offer and the hardest to scale. The
            students who most need one are reliably the least likely to book it.
          </p>
          <p>
            This is the rehearsal that happens before yours. Students arrive having already heard
            themselves, so your hour goes on judgement, nuance and industry reality instead of on
            telling someone they said &ldquo;like&rdquo; thirty times.
          </p>
        </ForTeachers>
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Say one answer out loud"
        body="Take the question you're dreading most and answer it badly, alone, where the stakes are zero."
      />
    </>
  );
}
