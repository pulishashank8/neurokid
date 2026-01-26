import { redirect } from 'next/navigation';
import { isAdminAuthenticated, validateAdminPassword, setAdminSession, isPasswordConfigured } from '@/lib/admin-auth';

export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const passwordConfigured = isPasswordConfigured();
  
  if (!passwordConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
            <p className="text-gray-500 mt-4">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">NeuroKid Owner Dashboard</h1>
          <p className="text-gray-500 mt-2">Enter your owner password to continue</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            Invalid password. Please try again.
          </div>
        )}
        
        <form action={login}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Owner Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
