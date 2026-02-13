'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Sparkles, AlertTriangle, Mail, Key, LogOut } from 'lucide-react';

export default function OwnerLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const errorParam = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/owner/dashboard';

  useEffect(() => {
    // Only redirect if authenticated AND no error parameter
    // This prevents redirect loop for users without OWNER role
    if (status === 'authenticated' && session?.user && !errorParam) {
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl, errorParam]);

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setError('You need OWNER role to access this dashboard. Please sign out and use an owner account, or contact an administrator to grant you OWNER role.');
    } else if (errorParam === 'expired') {
      setError('Your session has expired. Please sign in again.');
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'TooManyAttempts') {
          setError('Too many login attempts. Please try again later.');
        } else if (result.error === 'EmailNotVerified') {
          setError('Please verify your email before logging in.');
        } else {
          setError('Invalid email or password.');
        }
      } else if (result?.ok) {
        // Successfully signed in - NextAuth will handle the redirect
        // But we need to verify OWNER role on the dashboard page
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
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
            <p className="text-slate-400">Sign in with your OWNER account</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
              {errorParam === 'unauthorized' && status === 'authenticated' && (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/owner/login' })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out and Use Different Account
                </button>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!showMfa ? (
              <>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="owner@neurokid.com"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label htmlFor="mfa" className="block text-sm font-medium text-slate-300 mb-2">
                  Two-Factor Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="mfa"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : showMfa ? 'Verify & Sign In' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              🔒 Protected by role-based access control
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Only users with OWNER role can access this dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
