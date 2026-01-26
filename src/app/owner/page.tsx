import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function OwnerHome() {
  const authenticated = await isAdminAuthenticated();
  
  if (authenticated) {
    redirect('/owner/dashboard');
  } else {
    redirect('/owner/login');
  }
}
