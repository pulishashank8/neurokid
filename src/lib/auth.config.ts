/**
 * Production Authentication Configuration
 * 
 * Healthcare-appropriate security settings:
 * - Short session timeouts (30 min idle, 2 hour absolute)
 * - Secure cookie settings
 * - Strict redirect validation
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validators";
import bcryptjs from "bcryptjs";
import { RateLimits } from "@/lib/rate-limit";
import type { Role } from "@prisma/client";

const SESSION_MAX_AGE = 30 * 60; // 30 minutes
const SESSION_ABSOLUTE_MAX = 2 * 60 * 60; // 2 hours absolute maximum

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const parsed = LoginSchema.safeParse({
            email: credentials.email,
            password: credentials.password,
          });

          if (!parsed.success) {
            return null;
          }

          // Rate limit login attempts
          const limiter = RateLimits.login;
          const result = await limiter.check(parsed.data.email.toLowerCase());
          if (!result.allowed) {
            throw new Error("TooManyAttempts");
          }

          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
            include: { userRoles: true, profile: true },
          });

          if (!user?.hashedPassword) {
            return null;
          }

          const passwordMatch = await bcryptjs.compare(
            parsed.data.password,
            user.hashedPassword
          );

          if (!passwordMatch) {
            return null;
          }

          if (!user.emailVerified && process.env.NODE_ENV === "production") {
            throw new Error("EmailNotVerified");
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.profile?.displayName || user.profile?.username || user.email,
            username: user.profile?.username,
            roles: user.userRoles.map((ur) => ur.role),
          };
        } catch (error: any) {
          if (error.message === "TooManyAttempts") {
            throw error;
          }
          console.error("Auth error:", error);
          return null;
        }
      },
    }),

    // Google OAuth (optional)
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
    maxAge: SESSION_MAX_AGE,
    updateAge: 5 * 60, // Update session every 5 minutes of activity
  },

  jwt: {
    maxAge: SESSION_ABSOLUTE_MAX,
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-next-auth.session-token" 
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  pages: {
    signIn: "/login",
    error: "/error",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      const now = Date.now();

      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.roles = ((user as any).roles || []) as Role[];
        token.loginAt = now;
        token.lastActivity = now;
      }

      // Check absolute timeout
      if (token.loginAt) {
        const sessionAge = now - (token.loginAt as number);
        if (sessionAge > SESSION_ABSOLUTE_MAX * 1000) {
          return { ...token, exp: 0 };
        }
      }

      // Check idle timeout
      if (token.lastActivity) {
        const idleTime = now - (token.lastActivity as number);
        if (idleTime > SESSION_MAX_AGE * 1000) {
          return { ...token, exp: 0 };
        }
      }

      // Update activity timestamp
      token.lastActivity = now;

      // Refresh user data from database
      if (token.id) {
        try {
          const userData = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { userRoles: true, profile: true },
          });

          if (userData) {
            token.roles = userData.userRoles.map((ur) => ur.role);
            token.name =
              userData.profile?.displayName ||
              userData.profile?.username ||
              userData.email;
            token.username = userData.profile?.username;
            token.isBanned = userData.isBanned;
          } else {
            // User deleted, invalidate session
            return { ...token, exp: 0 };
          }
        } catch {
          // DB unavailable, keep existing token
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Check if session should be invalidated
      if (token.exp === 0 || token.isBanned) {
        return null as any;
      }

      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).roles = (token.roles as string[]) || [];
        session.user.name = token.name as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Only allow redirects to same origin or relative paths
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      const allowedHosts = [
        new URL(baseUrl).host,
        // Add any additional allowed hosts here
      ];
      
      try {
        const urlHost = new URL(url).host;
        if (allowedHosts.includes(urlHost)) {
          return url;
        }
      } catch {
        // Invalid URL, fall through to default
      }
      
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account }) {
      console.info(`User signed in: ${user.id} via ${account?.provider || "credentials"}`);
    },
    async signOut({ token }) {
      console.info(`User signed out: ${token.sub}`);
    },
  },
};
