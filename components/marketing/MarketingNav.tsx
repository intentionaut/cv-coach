'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@/components/ui/icons';

export const PRODUCT_PAGES = [
  {
    href: '/product/improve-your-cv',
    label: 'Improve your CV',
    blurb: 'Feedback that asks questions instead of writing it for you'
  },
  {
    href: '/product/learn-to-interview',
    label: 'Learn to interview',
    blurb: 'Structure your answers using what careers services already teach'
  },
  {
    href: '/product/practice-interview-calls',
    label: 'Practice interview calls',
    blurb: 'Say it out loud before you have to say it for real'
  },
  {
    href: '/product/track-your-growth',
    label: 'Track your growth',
    blurb: 'See what changed between your first draft and your fifth'
  }
];

export default function MarketingNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape - a dropdown that traps you is a
  // small thing that makes a site feel broken.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Route change should dismiss it, otherwise it hangs open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="bg-bg-surface border-b border-border-hairline sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/friday-logo.png" alt="" width={28} height={28} />
          <span className="font-display text-xl font-bold text-text-primary">Friday</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Main">
          <div className="relative" ref={wrapRef}>
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-haspopup="true"
              className="font-body flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-text-primary hover:text-text-cta transition"
            >
              Product
              <ChevronDownIcon className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 sm:left-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-bg-surface border border-border-hairline rounded-lg shadow-lg overflow-hidden">
                <ul>
                  {PRODUCT_PAGES.map(page => {
                    const active = pathname === page.href;
                    return (
                      <li key={page.href}>
                        <Link
                          href={page.href}
                          className={`block px-4 py-3 hover:bg-bg-main transition ${
                            active ? 'bg-accent-secondary/20' : ''
                          }`}
                        >
                          <span className="font-body text-sm font-semibold text-text-primary block">
                            {page.label}
                          </span>
                          <span className="font-body text-xs text-text-secondary block mt-0.5">
                            {page.blurb}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <Link
            href="/faq"
            className="font-body px-2 py-1.5 text-sm font-medium text-text-primary hover:text-text-cta transition"
          >
            FAQ
          </Link>

          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="font-body px-4 py-2 text-sm bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition whitespace-nowrap"
          >
            {signedIn ? 'Dashboard' : 'Sign in'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
