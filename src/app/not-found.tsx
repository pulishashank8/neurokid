import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
      <h1 className="text-6xl font-bold text-emerald-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">Page Not Found</h2>
      <p className="text-[var(--muted)] mb-8 text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
      >
        Go Home
      </Link>
    </div>
  );
}
