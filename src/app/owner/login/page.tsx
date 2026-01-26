import { redirect } from 'next/navigation';
import { isAdminAuthenticated, validateAdminPassword, setAdminSession, isPasswordConfigured } from '@/lib/admin-auth';
import { Shield, Lock, Sparkles, AlertTriangle, Clock } from 'lucide-react';

export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; expired?: string }>;
}) {
  const passwordConfigured = isPasswordConfigured();
  
  if (!passwordConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
        </div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Configuration Error</h1>
            <p className="text-slate-400">
              The ADMIN_PASSWORD secret is not configured. Please set the ADMIN_PASSWORD 
              environment variable to enable owner access.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    redirect('/owner/dashboard');
  }

  const params = await searchParams;
  const error = params.error;
  const expired = params.expired;

  async function login(formData: FormData) {
    'use server';
    
    const password = formData.get('password') as string;
    
    if (validateAdminPassword(password)) {
      await setAdminSession();
      redirect('/owner/dashboard');
    } else {
      redirect('/owner/login?error=invalid');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]"></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border border-white/10">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 backdrop-blur-xl pt-16 pb-10 px-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Secure Access</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Owner Dashboard</h1>
            <p className="text-slate-400">Enter your password to continue</p>
          </div>
          
          {expired && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl mb-6">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Your session expired due to inactivity. Please log in again.</p>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Invalid password. Please try again.</p>
            </div>
          )}
          
          <form action={login}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Owner Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </button>
          </form>
          
          <p className="text-center text-slate-500 text-sm mt-6">
            Session expires after 15 minutes of inactivity
          </p>
        </div>
      </div>
    </div>
  );
}
