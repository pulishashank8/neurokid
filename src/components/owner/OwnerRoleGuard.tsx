/**
 * Owner Role Guard
 * 
 * Protects owner dashboard pages by verifying OWNER role.
 * Redirects unauthorized users to login.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface OwnerRoleGuardProps {
  children: React.ReactNode;
}

export function OwnerRoleGuard({ children }: OwnerRoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Don't guard the login page itself
  const isLoginPage = pathname === '/owner/login';

  useEffect(() => {
    // Skip guard for login page
    if (isLoginPage) {
      setHasAccess(true);
      setIsVerifying(false);
      return;
    }

    const verifyOwnerRole = async () => {
      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated') {
        router.push('/owner/login');
        return;
      }

      if (status === 'authenticated' && session?.user) {
        // Check if user has OWNER role
        const roles = (session.user as any).roles || [];
        const isOwner = roles.includes('OWNER');

        if (isOwner) {
          setHasAccess(true);
          setIsVerifying(false);
        } else {
          // User is authenticated but doesn't have OWNER role
          router.push('/owner/login?error=unauthorized');
        }
      }
    };

    verifyOwnerRole();
  }, [session, status, router, isLoginPage, pathname]);

  // Loading state (skip for login page)
  if (!isLoginPage && (status === 'loading' || isVerifying)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Verifying Access</h2>
          <p className="text-slate-400">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state (shouldn't show this since we redirect, but just in case)
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You don't have permission to access this dashboard.</p>
          <button
            onClick={() => router.push('/owner/login')}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Authorized - render the protected content
  return <>{children}</>;
}
