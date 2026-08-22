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
  title: 'Practice interview calls — Friday',
  description:
    'Say your answers out loud and hear how they actually land, before the conversation that counts.'
};

export default async function PracticeInterviewCallsPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Practice interview calls"
        title="Writing an answer and saying it are not the same skill"
        standfirst="Most people say their answer out loud for the very first time during the interview itself. That's a strange way to find out it doesn't work."
      />

      <Section title="What changes when you speak">
        <Prose>
          <p>
            On paper you can revise a sentence four times before anyone sees it. Out loud you
            get one pass, in real time, while also managing nerves and someone else&apos;s
            silence.
          </p>
          <p>
            Answers that read beautifully often fall apart when spoken — they run long, lose
            their thread halfway, or arrive at a point the speaker had already forgotten they
            were making. None of that is visible on a page.
          </p>
          <p>
            Film and TV also hire by phone far more than most industries. A production
            coordinator ringing about availability on Thursday for a Monday start is a real
            interview, even though nobody called it one.
          </p>
        </Prose>
      </Section>

      <Section title="How a practice call runs" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Pick what you're preparing for">
            Point the call at one of your CVs and the questions follow that role, the same as
            written practice.
          </Step>
          <Step n={2} title="Answer out loud">
            You hear the question and respond by speaking, in one take. No editing, no
            backspace — which is the whole point.
          </Step>
          <Step n={3} title="Read back what you actually said">
            Your answer is transcribed, so you can see the real shape of it. This tends to be
            the uncomfortable, useful part: the repetitions and half-finished sentences are
            all there in a way memory quietly smooths over.
          </Step>
          <Step n={4} title="Get the same structured read">
            The feedback works exactly as it does in written practice — the same STAR
            breakdown, the same questions back rather than a script. Consistency matters here:
            you&apos;re learning one way of building an answer, not two.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          The first time you hear yourself say &ldquo;um, so basically&rdquo; four times in
          ninety seconds, you stop doing it. Being told about it in the abstract never has the
          same effect.
        </Pullquote>
        <Prose>
          <p>
            That&apos;s most of the value. Not the analysis — the evidence. A transcript is
            hard to argue with, and it costs nothing to be wrong in front of.
          </p>
        </Prose>
      </Section>

      <Section title="Being straight about what a transcript can show" tint>
        <Prose>
          <p>
            A transcript captures what you said, not how you sounded. Filler words, false
            starts, sentences that never resolve, an answer that runs three times longer than
            you thought — all of that shows up clearly and is worth working on.
          </p>
          <p>
            Warmth, pace, and whether you sounded like someone a crew would want on a long
            shoot do not. The feedback says so rather than pretending otherwise, because a
            tool that claims to assess your presence from a text file is guessing, and
            you&apos;d be right not to trust it.
          </p>
        </Prose>
      </Section>

      <Section>
        <ForTeachers>
          <p>
            Mock interviews are among the most valuable things a careers service offers and
            among the hardest to scale — there are only so many hours, and students who most
            need the practice are often the least likely to book a slot.
          </p>
          <p>
            This isn&apos;t a substitute for that conversation. It&apos;s the rehearsal that
            makes it worth having: students arrive having already heard themselves, so your
            time with them can go on judgement and nuance rather than on the basics.
          </p>
        </ForTeachers>
      </Section>

      <Section tint>
        <HonestLimits
          items={[
            'It cannot assess tone, pace, warmth or body language. It reads a transcript, and it tells you that.',
            'It is not a substitute for a mock interview with a person who knows the industry.',
            "Transcription is good, not perfect. Strong accents and background noise can garble a word or two.",
            'You need a working microphone and somewhere you can talk out loud without feeling watched.'
          ]}
        />
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Say one answer out loud"
        body="Take the question you're most dreading and answer it badly, in private, where it costs you nothing."
      />
    </>
  );
}
