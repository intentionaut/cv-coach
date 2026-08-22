'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@/components/ui/icons';
import { PRODUCT_PAGES } from '@/lib/data/product-pages';

export default function MarketingNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Route change should dismiss both, otherwise they hang open over the new
  // page.
  useEffect(() => {
    setOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes the mobile panel, and the page behind it doesn't scroll
  // while it's open - both are what anyone who's used a menu before expects.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <header className="bg-bg-surface border-b border-border-hairline sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/friday-logo.png" alt="" width={28} height={28} />
          <span className="font-display text-xl font-bold text-text-primary">Friday</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 sm:gap-5" aria-label="Main">
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

        {/* Below md the links collapse into a panel that opens downward from
            the button that summons it - no left/right mismatch to guess at,
            and the standard shape for a marketing header with this few
            links. */}
        <div className="md:hidden flex items-center gap-3">
          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="font-body px-4 py-2 text-sm bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition whitespace-nowrap"
          >
            {signedIn ? 'Dashboard' : 'Sign in'}
          </Link>
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-menu"
            className="p-2 -mr-2 rounded-lg text-text-primary hover:bg-bg-main transition"
          >
            {mobileOpen ? <CloseGlyph /> : <MenuGlyph />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-[57px] bg-text-primary/30 z-30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            id="marketing-mobile-menu"
            className="md:hidden relative z-40 bg-bg-surface border-t border-border-hairline max-h-[calc(100vh-57px)] overflow-y-auto"
          >
            <div className="px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-2">
                Product
              </p>
              <ul className="space-y-0.5 mb-4">
                {PRODUCT_PAGES.map(page => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className={`block px-3 py-2.5 rounded-lg transition ${
                        pathname === page.href ? 'bg-accent-secondary/20' : 'hover:bg-bg-main'
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
                ))}
              </ul>

              <div className="border-t border-border-hairline pt-3 space-y-0.5">
                <Link
                  href="/faq"
                  className="font-body block px-3 py-2.5 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-main transition"
                >
                  FAQ
                </Link>
                {!signedIn && (
                  <Link
                    href="/login?join=1"
                    className="font-body block px-3 py-2.5 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-main transition"
                  >
                    Ask for beta access
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function MenuGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
