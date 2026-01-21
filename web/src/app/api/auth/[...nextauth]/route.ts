import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validators";
import bcryptjs from "bcryptjs";
import { logger } from "@/lib/logger";

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
        } catch (outerErr) {
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
      // For Google OAuth: create or update user account
      if (account?.provider === "google" && user.email) {
        try {
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { profile: true, userRoles: true },
          });

          // Create user if doesn't exist
          if (!existingUser) {
            // Generate username from Google name or email
            let baseUsername = user.name?.toLowerCase().replace(/\s+/g, "") || user.email.split("@")[0];
            baseUsername = baseUsername.replace(/[^a-z0-9]/g, "");

            // Ensure username is unique
            let username = baseUsername;
            let counter = 1;
            while (true) {
              const exists = await prisma.profile.findUnique({ where: { username } });
              if (!exists) break;
              username = `${baseUsername}${counter}`;
              counter++;
            }

            // Create user with profile and role in a transaction
            existingUser = await prisma.user.create({
              data: {
                email: user.email,
                lastLoginAt: new Date(),
                profile: {
                  create: {
                    username,
                    displayName: user.name || username,
                    avatarUrl: user.image || null,
                  },
                },
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

            // Create profile if missing
            if (!existingUser.profile) {
              let baseUsername = user.name?.toLowerCase().replace(/\s+/g, "") || user.email.split("@")[0];
              baseUsername = baseUsername.replace(/[^a-z0-9]/g, "");

              let username = baseUsername;
              let counter = 1;
              while (true) {
                const exists = await prisma.profile.findUnique({ where: { username } });
                if (!exists) break;
                username = `${baseUsername}${counter}`;
                counter++;
              }

              await prisma.profile.create({
                data: {
                  userId: existingUser.id,
                  username,
                  displayName: user.name || username,
                  avatarUrl: user.image || null,
                },
              });
            }

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
        } catch (err) {
          console.error("Error creating/updating Google user:", err);
          return false;
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
          } else {
            (token as any).disabled = true;
            delete token.id;
            token.roles = [];
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
