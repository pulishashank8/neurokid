import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validators";
import bcryptjs from "bcryptjs";
import { logger } from "@/lib/logger";
import { RATE_LIMITERS } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  // No adapter needed when using JWT strategy
  providers: [
    // Credentials provider for email/password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          logger.info({ email: credentials?.email?.substring(0, 3) + '***' }, 'Login attempt');

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

          // Check login rate limit (10 attempts per minute per email)
          const canLogin = await RATE_LIMITERS.login.checkLimit(parsed.data.email.toLowerCase());
          if (!canLogin) {
            logger.warn({ email: parsed.data.email.substring(0, 3) + '***' }, 'Login rate limit exceeded');
            throw new Error("TooManyAttempts");
          }

          try {
            // Find user by email
            const user = await prisma.user.findUnique({
              where: { email: parsed.data.email },
              include: { userRoles: true, profile: true },
            });

            if (!user) {
              logger.warn({ email: parsed.data.email.substring(0, 3) + '***' }, 'User not found');
              return null;
            }

            // Check password
            const passwordMatch = await bcryptjs.compare(
              parsed.data.password,
              user.hashedPassword || ""
            );

            if (!passwordMatch) {
              logger.warn({ userId: user.id }, 'Password mismatch');
              return null;
            }

            // Check email verification (skip in development mode)
            if (!user.emailVerified && process.env.NODE_ENV === 'production') {
              logger.warn({ userId: user.id }, 'User not verified');
              throw new Error("EmailNotVerified");
            }

            // Update lastLoginAt
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

            logger.info({ userId: user.id, username: user.profile?.username }, 'Login successful');
            return {
              id: user.id,
              email: user.email,
              name: user.profile?.displayName || user.profile?.username || user.email,
              username: user.profile?.username,
              roles: user.userRoles.map((ur: any) => ur.role),
            };
          } catch (err) {
            logger.error({ error: err }, 'Login authorization failed');
            // Fallback: allow dev login without DB if env flag is set (non-production only)
            if (
              process.env.NODE_ENV !== "production" &&
              process.env.ALLOW_DEV_LOGIN_WITHOUT_DB === "true"
            ) {
              const devAccounts: Record<string, { password: string; roles: string[] }> = {
                "admin@neurokid.local": { password: "admin123", roles: ["ADMIN"] },
                "parent@neurokid.local": { password: "parent123", roles: ["PARENT"] },
              };
              const acct = devAccounts[parsed.data.email];
              if (acct && acct.password === parsed.data.password) {
                return {
                  id: parsed.data.email,
                  email: parsed.data.email,
                  name: parsed.data.email,
                  roles: acct.roles,
                } as any;
              }
            }
            return null;
          }
        } catch (outerErr: any) {
          // Re-throw rate limit errors to surface them properly
          if (outerErr?.message === "TooManyAttempts") {
            throw new Error("TooManyAttempts");
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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/error",
  },

  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth: create user WITHOUT auto-generating profile (requires onboarding)
      if (account?.provider === "google" && user.email) {
        try {
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { profile: true, userRoles: true },
          });

          // Create user if doesn't exist (without profile - will complete in onboarding)
          if (!existingUser) {
            existingUser = await prisma.user.create({
              data: {
                email: user.email,
                lastLoginAt: new Date(),
                emailVerified: true,
                emailVerifiedAt: new Date(),
                userRoles: {
                  create: {
                    role: "PARENT",
                  },
                },
              },
              include: { profile: true, userRoles: true },
            });

            // Store user ID for JWT
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
                  role: "PARENT",
                },
              });
            }

            // Store user ID for JWT
            user.id = existingUser.id;
          }
        } catch (err: any) {
          console.error("Error creating/updating Google user:", err);
          const errorCode = err?.code ? `DB_ERR_${err.code}` : "DB_UNKNOWN_ERROR";
          const errorMessage = err?.message ? encodeURIComponent(err.message.substring(0, 100)) : "UnknownError";
          return `/error?error=${errorCode}_${errorMessage}`;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.roles = (user as any).roles || [];
      }

      // Refresh user data including username on every token update
      if (token.id) {
        try {
          const userData = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { userRoles: true, profile: true },
          });
          if (userData) {
            token.roles = userData.userRoles.map((ur: any) => ur.role);
            token.name = userData.profile?.displayName || userData.profile?.username || userData.email;
            token.username = userData.profile?.username;
            token.profileComplete = !!userData.profile?.username && !!userData.profile?.displayName;
          } else {
            (token as any).disabled = true;
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
      if ((token as any).disabled) {
        // Return an empty session instead of null
        return { expires: session.expires, user: undefined } as any;
      }
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).roles = token.roles as string[];
        (session.user as any).profileComplete = token.profileComplete as boolean;
        // Ensure session.user.name is set to displayName/username
        session.user.name = token.name as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Only redirect to allowed origins
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
