import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canSeeMarketingPages } from '@/lib/flags';
import MarketingNav from '@/components/marketing/MarketingNav';

/**
 * Gates every /product page behind the marketing flag.
 *
 * Gated here rather than per-page so a new marketing page is covered the
 * moment it's created - the easiest kind of mistake to make is adding a fifth
 * page and forgetting the check.
 *
 * notFound() rather than a redirect: while these are in preview they should
 * be indistinguishable from pages that don't exist, so an unreleased URL
 * doesn't hint at what's coming.
 */
export default async function ProductLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!canSeeMarketingPages(session?.user?.email)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <MarketingNav signedIn={!!session?.user} />
      {children}
    </div>
  );
}
