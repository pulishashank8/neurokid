import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import OwnerSidebar from '@/components/owner/Sidebar';

export default async function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();
  
  if (!authenticated) {
    redirect('/owner/login');
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
