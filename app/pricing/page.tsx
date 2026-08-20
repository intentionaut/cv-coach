import { notFound } from 'next/navigation';
import PricingContent from './PricingContent';

// Feature-flagged: only ever renders locally. In production this 404s
// server-side regardless of what URL is requested, since the check runs
// before any markup is produced.
export default function PricingPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <PricingContent />;
}
