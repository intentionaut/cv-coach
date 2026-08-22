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
    label: 'Practice',
    items: [{ href: '/coaching', label: 'Interviews', icon: '🎤' }]
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
          <SidebarLink href="/admin/invite" label="Invite user" icon="✚" active={isActive('/admin')} />
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
      {/* Mobile bar - the sidebar itself is too wide to keep on screen */}
      <div className="lg:hidden sticky top-0 z-40 bg-bg-surface border-b border-border-hairline flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/friday-logo.png" alt="" width={24} height={24} />
          <span className="font-display text-lg font-bold text-text-primary">Friday</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="font-body px-3 py-1.5 text-sm text-text-primary border border-border-hairline rounded-lg"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-text-primary/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 bg-bg-surface border-r border-border-hairline">{nav}</div>
        </div>
      )}

      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-bg-surface border-r border-border-hairline sticky top-0 h-screen">
        {nav}
      </aside>
    </>
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
