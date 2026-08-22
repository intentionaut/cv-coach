import Link from 'next/link';
import Image from 'next/image';

/**
 * Site-wide footer, mounted once in the root layout.
 *
 * `mt-auto` pairs with the `min-h-full flex flex-col` body in app/layout.tsx
 * so the footer sits at the bottom of short pages (login, FAQ) instead of
 * floating mid-screen, while still being pushed down naturally by long ones.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-bg-surface border-t border-border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/friday-logo.png" alt="" width={20} height={20} />
          <p className="font-body text-xs text-text-secondary">
            &copy; {year} Friday &middot; Career coaching for film, TV and theatre
          </p>
        </div>

        <nav aria-label="Footer" className="flex items-center gap-5">
          <Link
            href="/faq"
            className="font-body text-xs text-text-link hover:text-text-cta font-medium"
          >
            FAQ
          </Link>
          <Link
            href="/privacy"
            className="font-body text-xs text-text-link hover:text-text-cta font-medium"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="font-body text-xs text-text-link hover:text-text-cta font-medium"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
