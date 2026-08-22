import AppSidebar from '@/components/layout/AppSidebar';

/**
 * Shell for the signed-in app.
 *
 * A route group, so the URLs are unchanged - /cv is still /cv. It exists
 * purely to give the sidebar one mounting point, which also means the layout
 * survives client-side navigation: moving between sections doesn't remount
 * the nav or re-fetch its counts.
 *
 * Marketing, legal, login and the design system deliberately sit outside it.
 * Those aren't places you navigate the product from.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex min-h-screen bg-bg-main">
      <AppSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
