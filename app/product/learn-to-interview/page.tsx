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
  title: 'Learn to interview — Friday',
  description:
    'Practise real film and theatre interview questions, with feedback on how your answers are built rather than a script to memorise.'
};

export default async function LearnToInterviewPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Learn to interview"
        title="Good answers have a shape. It can be learned."
        standfirst="Interviews feel like a personality test and aren't. Most of what separates a strong answer from a forgettable one is structure — which means it's something you can practise rather than something you either have or don't."
      />

      <Section title="Where early-career answers usually come apart">
        <Prose>
          <p>
            Ask someone about a time things went wrong on set and you&apos;ll usually get a
            vivid description of the chaos, a decent account of what they did, and then —
            nothing. The story stops before the ending.
          </p>
          <p>
            The missing piece is almost always the result. Did the scene shoot on time? Did
            anyone notice? What changed because you were there? Without it, an interviewer is
            left holding an anecdote instead of evidence.
          </p>
        </Prose>
      </Section>

      <Section title="What you practise against" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Real questions, not trick ones">
            Two dozen questions drawn from how this industry actually hires — early call
            times, being handed a task with no explanation, spotting a problem before it
            became one, what you&apos;d do when two people need something urgently at once.
          </Step>
          <Step n={2} title="Tied to the job you're going for">
            Point a session at one of your CVs and the questions and feedback take that role
            into account, rather than treating every application as the same.
          </Step>
          <Step n={3} title="Structure, broken into parts">
            For behavioural questions, your answer is checked against Situation, Task, Action
            and Result — each one separately, so you can see exactly which piece is missing
            rather than being told your answer needs &ldquo;more structure&rdquo;.
          </Step>
          <Step n={4} title="Questions back, not a model answer">
            Where something&apos;s missing, you get the question that helps you find it in
            your own memory. Nothing is written for you to memorise.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          A memorised answer survives exactly one question. An answer you understand survives
          the follow-up.
        </Pullquote>
        <Prose>
          <p>
            Interviewers in this industry ask follow-ups almost immediately, usually because
            they&apos;re genuinely curious about the shoot you mentioned. That&apos;s the
            moment a rehearsed script falls over and a real story keeps going.
          </p>
          <p>
            So the goal here isn&apos;t a polished paragraph. It&apos;s knowing your own
            material well enough that you can start anywhere in it.
          </p>
        </Prose>
      </Section>

      <Section title="Rate yourself first" tint>
        <Prose>
          <p>
            Before you see any feedback, you&apos;re asked how you think the answer went. The
            order matters — once you&apos;ve read someone else&apos;s assessment, you
            can&apos;t un-know it, and your own judgement gets quietly replaced by theirs.
          </p>
          <p>
            Then the two are compared. Sometimes you&apos;ve overestimated an answer and
            there&apos;s a blind spot worth looking at. Just as often it goes the other way:
            you rated yourself a two and it read as a four, which is worth knowing about
            before you walk into a room and apologise for yourself.
          </p>
          <p>
            Over time that gap narrows. Learning to judge your own work accurately is
            arguably more useful than any individual piece of feedback, because it&apos;s the
            part you take with you when the tool isn&apos;t there.
          </p>
        </Prose>
      </Section>

      <Section>
        <ForTeachers>
          <p>
            The structure taught here is STAR, which is almost certainly what your careers
            service already uses — so students get reinforcement rather than a competing
            framework to reconcile.
          </p>
          <p>
            Two design choices you might care about. STAR is only applied to behavioural
            questions; where it doesn&apos;t sensibly fit, such as &ldquo;why do you want to
            work in film&rdquo;, it isn&apos;t forced, because teaching students to bolt a
            Situation onto a motivation question makes their answers worse. And the
            self-assessment step is deliberate metacognitive practice, not a satisfaction
            rating.
          </p>
        </ForTeachers>
      </Section>

      <Section tint>
        <HonestLimits
          items={[
            'It will not write your answers. You will be asked questions, not given scripts.',
            "It can't tell you how a specific interviewer will react. It can tell you whether your answer holds together.",
            'Written practice sees your words, not your delivery. Practice calls cover that separately.',
            'The question bank is broad, not exhaustive. Real interviews will ask things it did not.'
          ]}
        />
      </Section>

      <MarketingCta
        signedIn={signedIn}
        heading="Answer one question properly"
        body="Not a whole session. Pick one, write a real answer, and see what a structured read of it looks like."
      />
    </>
  );
}
