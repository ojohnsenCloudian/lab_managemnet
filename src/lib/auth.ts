import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // Check if this is an OAuth user (no password set)
        if (!user.password) {
          // OAuth users are authenticated via OAuth flow, not credentials
          // They should use the OAuth login button
          return null;
        }

        // Regular credentials check
        if (!credentials?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          passwordChangeRequired: user.passwordChangeRequired,
        };
      },
    }),
    // OAuth provider temporarily disabled - NextAuth v5 beta doesn't support dynamic OAuth providers
    // OAuth functionality will be added in a future update
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.passwordChangeRequired = (user as any).passwordChangeRequired ?? false;
      }

      // Handle OAuth login - create or update user
      if (account?.provider === "authentik" && account.access_token) {
        // Find or create user from OAuth profile
        const existingUser = await db.user.findUnique({
          where: { email: token.email as string },
        });

        if (existingUser) {
          token.id = existingUser.id;
          token.isAdmin = existingUser.isAdmin;
          token.passwordChangeRequired = existingUser.passwordChangeRequired;
        } else {
          // Create new user from OAuth
          const newUser = await db.user.create({
            data: {
              email: token.email as string,
              name: token.name as string,
              isAdmin: false,
              passwordChangeRequired: false,
              oauthProvider: "Authentik",
            },
          });
          token.id = newUser.id;
          token.isAdmin = false;
          token.passwordChangeRequired = false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.passwordChangeRequired = token.passwordChangeRequired as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig);
