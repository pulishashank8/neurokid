/**
 * NextAuth API Route
 * 
 * This is the entry point for NextAuth.js. The actual configuration
 * is in `@/lib/auth.config` to avoid circular dependencies.
 */

import { handler } from '@/lib/auth.config';

export { handler as GET, handler as POST };
