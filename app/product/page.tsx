import Link from 'next/link';
import { PRODUCT_PAGES } from '@/components/marketing/MarketingNav';

export const metadata = {
  title: 'Product — Friday',
  description:
    'How Friday helps you learn to describe your own work: on the page, in structure, out loud, and over time.'
};

// Exists so trimming the URL back to /product lands somewhere sensible rather
// than a 404. Also the natural home for an overview once these pages go public.
export default function ProductIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl font-bold text-text-primary mb-4 text-balance">
        Learn to talk about your own work
      </h1>
      <p className="font-body text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
        Getting hired here comes down to explaining what you&apos;ve actually done: on the page,
        in the room, and on a phone call you had ten minutes&apos; warning about. Friday helps
        you get good at it.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PRODUCT_PAGES.map(page => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="block h-full bg-bg-surface border border-border-hairline rounded-lg p-6 hover:border-accent-tertiary transition"
            >
              <h2 className="font-display text-lg font-bold text-text-primary mb-1">
                {page.label}
              </h2>
              <p className="font-body text-sm text-text-secondary leading-relaxed">{page.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
