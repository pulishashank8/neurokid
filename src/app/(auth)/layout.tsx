export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="text-[var(--text-muted)] text-xs sm:text-sm text-center mt-6 sm:mt-8 px-4">
        A sensory-friendly space for the neurodivergent community
      </p>
    </div>
  );
}
