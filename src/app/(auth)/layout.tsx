import { PlayfulBackground } from "@/components/animations/PlayfulBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayfulBackground>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </PlayfulBackground>
  );
}
