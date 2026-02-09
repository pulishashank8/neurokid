/**
 * Authentication Configuration
 * 
 * This file contains the NextAuth configuration to avoid circular dependencies.
 * It can be imported from both API routes and server components.
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { LoginSchema } from '@/lib/validators';
import bcryptjs from 'bcryptjs';
import { createLogger } from '@/lib/logger';
import { RateLimits } from '@/lib/rate-limit';
import { AuthenticationError } from '@/domain/errors';
import type { Role } from '@/domain/types';
import { verifyCaptcha } from '@/lib/captcha';
import { 
  isCaptchaRequired, 
  recordFailedLogin, 
  clearFailedLogins 
} from '@/lib/auth/login-captcha';
import {
  isAccountLocked,
  recordFailedAttempt,
  recordSuccessfulLogin,
} from '@/lib/security/account-lockout';

const logger = createLogger({ context: 'auth' });

export const authOptions: NextAuthOptions = {
  // Custom logger to suppress client fetch errors in dev
  logger: {
    error(code, metadata) {
      // Suppress CLIENT_FETCH_ERROR in development
      if (code === 'CLIENT_FETCH_ERROR') {
        logger.warn({ code, message: metadata?.message }, '[next-auth] client fetch error');
        return;
      }
      logger.error({ code, metadata }, '[next-auth] error');
    },
    warn(code) {
      logger.warn({ code }, '[next-auth] warning');
    },
    debug(code, metadata) {
      logger.debug({ code, metadata }, '[next-auth] debug');
    },
  },

  providers: [
    // Credentials provider for email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        captchaToken: { label: 'CAPTCHA Token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          logger.info(
            { email: credentials?.email?.substring(0, 3) + '***' },
            'Login attempt'
          );

          if (!credentials?.email || !credentials?.password) {
            logger.warn('Missing credentials');
            return null;
          }

          // Validate input
          const parsed = LoginSchema.safeParse({
            email: credentials.email,
            password: credentials.password,
          });

          if (!parsed.success) {
            logger.warn({ errors: parsed.error.errors }, 'Login validation failed');
            return null;
          }

          const identifier = parsed.data.email.toLowerCase();

          // Find user first to check lockout status
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            include: { userRoles: true, profile: true },
          });

          if (!user) {
            logger.warn(
              { email: parsed.data.email.substring(0, 3) + '***' },
              'User not found'
            );
            return null;
          }

          // Check if account is locked
          const lockoutStatus = await isAccountLocked(user.id);
          if (lockoutStatus.locked) {
            logger.warn({ userId: user.id }, 'Login attempt on locked account');
            throw new AuthenticationError(
              `Account temporarily locked. Please try again after ${lockoutStatus.lockedUntil?.toLocaleString()}.`,
              'AccountLocked'
            );
          }

          // Check if CAPTCHA is required after failed attempts
          const captchaRequired = await isCaptchaRequired(identifier);
          if (captchaRequired) {
            const captchaToken = credentials.captchaToken;
            if (!captchaToken) {
              logger.warn({ email: identifier.substring(0, 3) + '***' }, 'CAPTCHA required but not provided');
              throw new AuthenticationError(
                'CAPTCHA verification required. Please complete the security check.',
                'CaptchaRequired'
              );
            }

            const captchaResult = await verifyCaptcha(captchaToken);
            if (!captchaResult.success) {
              logger.warn({ 
                email: identifier.substring(0, 3) + '***',
                errorCodes: captchaResult.errorCodes 
              }, 'CAPTCHA verification failed');
              throw new AuthenticationError(
                'CAPTCHA verification failed. Please try again.',
                'CaptchaFailed'
              );
            }
          }

          // Check login rate limit (10 attempts per minute per email)
          const rateLimiter = RateLimits.login;
          const rateLimitResult = await rateLimiter.check(identifier);
          
          if (!rateLimitResult.allowed) {
            logger.warn(
              { email: identifier.substring(0, 3) + '***' },
              'Login rate limit exceeded'
            );
            throw new AuthenticationError(
              'Too many login attempts. Please try again later.',
              'TooManyAttempts'
            );
          }

          try {
            // Check password
            const passwordMatch = await bcryptjs.compare(
              parsed.data.password,
              user.hashedPassword || ''
            );

            if (!passwordMatch) {
              logger.warn({ userId: user.id }, 'Password mismatch');
              await recordFailedLogin(identifier);
              await recordFailedAttempt(user.id, user.email);
              return null;
            }

            // Check email verification (skip in development mode)
            if (!user.emailVerified && process.env.NODE_ENV === 'production') {
              logger.warn({ userId: user.id }, 'User not verified');
              throw new AuthenticationError(
                'Email not verified. Please check your email and verify your account.',
                'EmailNotVerified'
              );
            }

            // Update lastLoginAt
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

            // Clear failed attempts on successful login
            await clearFailedLogins(identifier);
            await recordSuccessfulLogin(user.id);
            
            logger.info(
              { userId: user.id, username: user.profile?.username },
              'Login successful'
            );
            
            return {
              id: user.id,
              email: user.email,
              name:
                user.profile?.displayName ||
                user.profile?.username ||
                user.email,
              username: user.profile?.username,
              roles: user.userRoles.map((ur) => ur.role) as Role[],
            };
          } catch (err) {
            logger.error({ error: err }, 'Login authorization failed');
            
            // Dev mode: Allow login without DB only if explicitly configured
            if (
              process.env.NODE_ENV !== 'production' &&
              process.env.ALLOW_DEV_LOGIN_WITHOUT_DB === 'true' &&
              process.env.DEV_AUTH_EMAIL &&
              process.env.DEV_AUTH_PASSWORD_HASH
            ) {
              const isMatch = await bcryptjs.compare(
                parsed.data.password,
                process.env.DEV_AUTH_PASSWORD_HASH
              );
              if (
                parsed.data.email === process.env.DEV_AUTH_EMAIL &&
                isMatch
              ) {
                logger.warn('DEV LOGIN: Using environment-based dev credentials');
                return {
                  id: 'dev-user',
                  email: process.env.DEV_AUTH_EMAIL,
                  name: 'Development User',
                  roles: (process.env.DEV_AUTH_ROLES?.split(',') || ['PARENT']) as Role[],
                };
              }
            }
            return null;
          }
        } catch (outerErr: any) {
          // Re-throw authentication errors to surface them properly
          if (outerErr instanceof AuthenticationError) {
            throw outerErr;
          }
          logger.error({ error: outerErr }, 'Login outer error');
          return null;
        }
      },
    }),

    // Google OAuth provider (optional, only if env vars are set)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes - healthcare appropriate
    updateAge: 5 * 60, // Update session every 5 minutes of activity
  },

  jwt: {
    maxAge: 2 * 60 * 60, // 2 hours absolute maximum
  },

  pages: {
    signIn: '/login',
    error: '/error',
  },

  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth: create user WITHOUT auto-generating profile
      if (account?.provider === 'google' && user.email) {
        try {
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { profile: true, userRoles: true },
          });

          if (!existingUser) {
            // Create user without profile (requires onboarding)
            existingUser = await prisma.user.create({
              data: {
                email: user.email,
                lastLoginAt: new Date(),
                emailVerified: true,
                emailVerifiedAt: new Date(),
                userRoles: {
                  create: {
                    role: 'PARENT',
                  },
                },
              },
              include: { profile: true, userRoles: true },
            });
            user.id = existingUser.id;
          } else {
            // Update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            });

            // Ensure user has PARENT role
            if (existingUser.userRoles.length === 0) {
              await prisma.userRole.create({
                data: {
                  userId: existingUser.id,
                  role: 'PARENT',
                },
              });
            }
            user.id = existingUser.id;
          }
        } catch (err: any) {
          logger.error({ error: err }, 'Error creating/updating Google user');
          const errorCode = err?.code ? `DB_ERR_${err.code}` : 'DB_UNKNOWN_ERROR';
          const errorMessage = err?.message
            ? encodeURIComponent(err.message.substring(0, 100))
            : 'UnknownError';
          return `/error?error=${errorCode}_${errorMessage}`;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      const now = Date.now();

      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.roles = (user as { roles?: string[] }).roles || [];
        token.loginAt = now;
        token.lastActivity = now;
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion || 0;
      }

      // Check absolute timeout (2 hours max)
      if (token.loginAt) {
        const MAX_SESSION_DURATION = 2 * 60 * 60 * 1000;
        if (now - (token.loginAt as number) > MAX_SESSION_DURATION) {
          return { ...token, forceSignOut: true };
        }
      }

      // Check idle timeout (30 minutes)
      if (token.lastActivity) {
        const IDLE_TIMEOUT = 30 * 60 * 1000;
        if (now - (token.lastActivity as number) > IDLE_TIMEOUT) {
          return { ...token, forceSignOut: true };
        }
      }

      token.lastActivity = now;

      // Refresh user data on every token update
      if (token.id) {
        try {
          const userData = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { userRoles: true, profile: true },
          });
          if (userData) {
            // Check if user is banned
            if (userData.isBanned) {
              logger.warn({ userId: token.id }, 'Banned user attempted access');
              return { ...token, forceSignOut: true, reason: 'Account banned' };
            }
            
            // Check session version for privilege escalation protection
            const currentVersion = userData.sessionVersion || 0;
            const tokenVersion = (token.sessionVersion as number) || 0;
            if (currentVersion !== tokenVersion) {
              logger.warn(
                { userId: token.id, tokenVersion, currentVersion },
                'Session version mismatch - forcing re-authentication'
              );
              return { 
                ...token, 
                forceSignOut: true, 
                reason: 'Session expired due to account changes' 
              };
            }
            
            token.roles = userData.userRoles.map((ur) => ur.role);
            token.name =
              userData.profile?.displayName ||
              userData.profile?.username ||
              userData.email;
            token.username = userData.profile?.username;
            token.profileComplete =
              !!userData.profile?.username && !!userData.profile?.displayName;
          } else {
            (token as Record<string, unknown>).disabled = true;
            delete token.id;
            token.roles = [];
            token.profileComplete = false;
          }
        } catch {
          // If DB unavailable, keep existing data (dev fallback)
        }
      }

      return token;
    },

    async session({ session, token }) {
      try {
        if (!session) return {} as typeof session;
        if ((token as { disabled?: boolean }).disabled || (token as { forceSignOut?: boolean }).forceSignOut) {
          return { expires: new Date(0).toISOString() } as typeof session;
        }
        if (session.user) {
          (session.user as { id: string }).id = token?.id as string;
          (session.user as { username?: string }).username = token?.username as string;
          (session.user as { roles?: string[] }).roles =
            (token?.roles as string[]) || [];
          (session.user as { profileComplete?: boolean }).profileComplete =
            token?.profileComplete as boolean;
          session.user.name = token?.name as string;
        }
        return session;
      } catch (error) {
        logger.error({ error }, 'Session callback error');
        return session || ({} as typeof session);
      }
    },

    async redirect({ url, baseUrl }) {
      // Only redirect to allowed origins
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

// Create the NextAuth handler
const handler = NextAuth(authOptions);
export { handler };
