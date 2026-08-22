'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-tertiary mx-auto mb-4"></div>
          <div className="flex items-center justify-center gap-2">
            <Image src="/friday-logo.png" alt="" width={31} height={31} />
            <h2 className="font-display text-xl font-bold text-text-primary">Friday</h2>
          </div>
          <p className="font-body text-text-secondary mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/friday-logo.png" alt="" width={50} height={50} />
            <h1 className="font-display text-2xl font-bold text-text-primary">Friday</h1>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="font-body bg-cta-primary text-text-on-cta px-5 py-2 rounded-lg font-bold hover:opacity-90 transition"
          >
            Sign In
          </button>
        </div>
      </header>

      <main>
        <section className="bg-accent-tertiary text-text-on-tertiary">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Friday, the Film Career Coach
            </h2>
            <p className="font-body text-lg text-text-inverse/75 max-w-2xl mx-auto mb-8">
              AI-powered coaching to help you land your first gig in the film industry.
              Build your CV, practice interviews, and track your skills &mdash; all in
              one place.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="font-body bg-cta-primary text-text-on-cta px-8 py-3 rounded-lg font-bold hover:opacity-90 transition text-lg"
            >
              Get Started
            </button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="font-display text-2xl font-bold text-text-primary text-center mb-10">
            Your Film Career Journey
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="📝"
              title="Build Your CV"
              description="Create and manage your professional CV with your experience and projects"
            />
            <FeatureCard
              icon="🎤"
              title="Practice Interviews"
              description="Answer film industry questions and get AI-powered feedback"
            />
            <FeatureCard
              icon="⭐"
              title="Skills Assessment"
              description="Track your technical, creative, and soft skills progress"
            />
          </div>
        </section>

        <section className="bg-bg-surface">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h3 className="font-display text-2xl font-bold text-text-primary mb-4">
              Ready to get started?
            </h3>
            <p className="font-body text-text-secondary mb-8">
              Sign in to build your CV, practice interview questions, and track your
              progress toward your first film industry role.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="font-body bg-cta-primary text-text-on-cta px-8 py-3 rounded-lg font-bold hover:opacity-90 transition text-lg"
            >
              Sign In
            </button>
          </div>
        </section>
      </main>

    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-bg-surface rounded-lg p-6 border border-border-hairline">
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="font-display text-lg font-bold text-text-primary mb-2">{title}</h4>
      <p className="font-body text-sm text-text-secondary">{description}</p>
    </div>
  );
}
