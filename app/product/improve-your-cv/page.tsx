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
  title: 'Improve your CV — Friday',
  description:
    'Your CV is probably underselling you. Friday helps you find the detail you left out and say it in your own words.'
};

export default async function ImproveYourCvPage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;

  return (
    <>
      <MarketingHero
        eyebrow="Improve your CV"
        title="&ldquo;Assisted the art department.&rdquo;"
        standfirst="What actually happened: the props delivery collapsed ninety minutes before the scene, you called round three hire houses, found the replacements, and the shoot stayed on schedule. Nobody reading your CV will ever know that."
      />

      <Section title="Everyone starting out has this problem">
        <Prose>
          <p>
            You know what you did on set. Writing it down is a completely different skill, and
            nobody teaches it. So it comes out flat — &ldquo;supported the team&rdquo;,
            &ldquo;various duties&rdquo;, &ldquo;helped where needed&rdquo; — and a hiring
            manager skims past three years of real work in eight seconds.
          </p>
          <p>
            That gap isn&apos;t about your experience. It&apos;s about translation. And
            translation is fixable.
          </p>
        </Prose>
      </Section>

      <Section title="How it works" tint>
        <div className="space-y-6 max-w-2xl">
          <Step n={1} title="Upload whatever you have">
            PDF, Word, plain text. Rough is fine. Half-finished is fine.
          </Step>
          <Step n={2} title="Name the job">
            Optional, but it sharpens everything. A CV for a camera traineeship needs different
            emphasis from one for a production office, and Friday reads the posting properly.
          </Step>
          <Step n={3} title="Answer the questions it asks you">
            This is the part that does the work. Instead of rewriting your line, Friday asks:
            were you rigging or operating? How big was the crew? How many shoot days? You
            remember. You answer. The line becomes specific.
          </Step>
          <Step n={4} title="Come back with the new draft">
            Upload the rewrite and see what shifted. The score history keeps every version, so
            you can watch a CV go from 51 to 74 across a fortnight.
          </Step>
        </div>
      </Section>

      <Section>
        <Pullquote>
          Plenty of tools will write your CV for you. Then you&apos;re in the room, being asked
          about a sentence you didn&apos;t write.
        </Pullquote>
        <Prose>
          <p>
            Friday never writes a line for you. Not as a limitation — as the entire design.
            Every question it asks pulls a real detail out of your memory and onto the page, so
            when someone says &ldquo;tell me about this shoot&rdquo;, you can talk for five
            minutes without thinking.
          </p>
          <p>
            You keep the skill afterwards. It shows up in your cover letters, your interviews,
            and the conversation at the wrap party when someone asks what you&apos;ve been
            working on.
          </p>
        </Prose>
      </Section>

      <Section title="Two questions, answered separately" tint>
        <Prose>
          <p>
            <strong className="text-text-primary">Does it read well?</strong> One score, and the
            reasoning behind it. Add a job description and the score reflects that specific
            role, so aiming high shows up as a stretch rather than a failure.
          </p>
          <p>
            <strong className="text-text-primary">Can a machine read it at all?</strong> Most
            employers run applications through screening software first. A separate instant
            check looks at whether your contact details are findable, your dates parse, your
            sections are recognisable — and whether your beautifully designed PDF is secretly an
            image, which is the one that quietly kills applications.
          </p>
        </Prose>
      </Section>

      <Section title="Three jobs, three CVs">
        <Prose>
          <p>
            In one month you might go for a runner role, a broadcast apprenticeship and a
            theatre production job. The same CV won&apos;t land all three.
          </p>
          <p>
            Keep a separate one for each kind of work, each with its own feedback and its own
            history. Your experience is reusable. The framing is what changes.
          </p>
        </Prose>
      </Section>

      <Section tint>
        <ForTeachers>
          <p>
            Friday gives students structured feedback between tutorials, and it never writes
            anything for them — so what lands on your desk is still their work, in their voice.
          </p>
          <p>
            It also shows its reasoning. Students see why a line is weak, not just that it
            scored badly, which makes the next tutorial a conversation about judgement rather
            than a proofread.
          </p>
        </ForTeachers>
      </Section>

      <MarketingCta
        source="product/improve-your-cv"
        signedIn={signedIn}
        heading="Find out what you left out"
        body="Upload the CV you already have. The first pass usually surfaces two or three things you'd forgotten you'd done."
      />
    </>
  );
}
