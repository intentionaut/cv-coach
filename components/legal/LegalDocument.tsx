import Link from 'next/link';

export default function LegalDocument({
  title,
  updatedAt,
  children
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-display text-xl font-bold text-text-primary">{title}</h1>
          <Link
            href="/login"
            className="font-body px-4 py-2 text-sm text-text-secondary hover:bg-bg-main rounded-lg transition"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="font-body text-sm text-text-secondary mb-8">Updated at {updatedAt}</p>
        <div className="font-body prose-legal text-text-primary space-y-6">{children}</div>
      </main>
    </div>
  );
}
