'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { isOwner } from '@/lib/flags';

/**
 * Persistent navigation for the signed-in app.
 *
 * Replaces a hub-and-spoke arrangement where every page's only exit was
 * "Back to Dashboard" - you couldn't get from your CV to your cover letters
 * without bouncing through the middle. That's fine on a first visit and
 * tiresome by the tenth.
 *
 * Items are grouped rather than listed flat. Everything stays visible -
 * hiding what you haven't started yet leaves people wondering what they're
 * missing - but grouping gives it hierarchy so it doesn't read as a wall of
 * options. Deliberately no counts or badges here: progress belongs on the
 * dashboard, and a nav that reports numbers at you becomes noise you learn to
 * ignore.
 *
 * The dashboard keeps the numbered first-run sequence. This is for people who
 * already know where they're going.
 */

const GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: string }>;
}> = [
  {
    label: 'My documents',
    items: [
      { href: '/cv', label: 'CVs', icon: '📝' },
      { href: '/cover-letters', label: 'Cover letters', icon: '✉️' }
    ]
  },
  {
    // Applications leads: it's the outcome, and interview practice is
    // preparation for it rather than a peer.
    label: 'Progress',
    items: [
      { href: '/applications', label: 'Applications', icon: '🎬' },
      { href: '/coaching', label: 'Interviews', icon: '🎤' }
    ]
  }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer on navigation, otherwise it covers the page you
  // just asked for.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes it, and the page behind doesn't scroll while it's open -
  // both are what anyone who has used a drawer before will expect.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const firstName = session?.user?.name?.split(' ')[0];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="flex flex-col h-full" aria-label="Sections">
      <div className="px-5 pt-5 pb-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/friday-logo.png" alt="" width={28} height={28} />
          <span className="font-display text-xl font-bold text-text-primary">Friday</span>
        </Link>
        {firstName && (
          <p className="font-body text-sm text-text-secondary mt-1.5">Welcome back, {firstName}</p>
        )}
      </div>

      {/* Dashboard sits above the groups: it's the overview of everything
          below it, not a peer of any one section. */}
      <div className="px-3">
        <SidebarLink
          href="/dashboard"
          label="Dashboard"
          icon="🏠"
          active={pathname === '/dashboard'}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {GROUPS.map(group => (
          <div key={group.label}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary px-3 mb-2">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => (
                <li key={item.href}>
                  <SidebarLink
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isActive(item.href)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="px-3 py-4 border-t border-border-hairline space-y-0.5 shrink-0">
        {isOwner(session?.user?.email) && (
          <SidebarLink
            href="/admin/metrics"
            label="Metrics"
            icon="📊"
            active={isActive('/admin/metrics')}
          />
        )}
        {isOwner(session?.user?.email) && (
          <SidebarLink href="/admin/invite" label="Invite user" icon="✚" active={isActive('/admin/invite')} />
        )}
        <SidebarLink href="/settings" label="Settings" icon="⚙️" active={isActive('/settings')} />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="font-body w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-main hover:text-text-primary transition text-left"
        >
          <span className="w-5 text-center" aria-hidden="true">↪</span>
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile bar - the sidebar itself is too wide to keep on screen.
          The toggle sits on the left, where the drawer it opens comes from:
          a control on one side that reveals a panel on the other makes the
          user guess. Hamburger, left edge, left drawer - the convention. */}
      <div className="lg:hidden sticky top-0 z-40 bg-bg-surface border-b border-border-hairline flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar-drawer"
          className="-ml-1 p-2 rounded-lg text-text-primary hover:bg-bg-main transition"
        >
          <MenuIcon />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/friday-logo.png" alt="" width={24} height={24} />
          <span className="font-display text-lg font-bold text-text-primary">Friday</span>
        </Link>
      </div>

      {/* Scrim and drawer are siblings, both fixed to the viewport, so the
          drawer is always full height and the scrim always covers the page.
          The drawer stays mounted and translates off-screen so it animates in
          both directions; `inert` keeps its links out of the tab order while
          it's hidden. */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-text-primary/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        id="app-sidebar-drawer"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-bg-surface border-r border-border-hairline transition-transform duration-200 motion-reduce:transition-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        inert={!mobileOpen}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute top-3 right-3 p-2 rounded-lg text-text-secondary hover:bg-bg-main hover:text-text-primary transition"
        >
          <CloseIcon />
        </button>
        {nav}
      </div>

      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-bg-surface border-r border-border-hairline sticky top-0 h-screen">
        {nav}
      </aside>
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`font-body flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
        active
          ? 'bg-accent-secondary/25 text-text-primary font-semibold'
          : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
      }`}
    >
      <span className="w-5 text-center" aria-hidden="true">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
