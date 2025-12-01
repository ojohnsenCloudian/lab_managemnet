import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import OAuth from "next-auth/providers/oauth";
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
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
    OAuth({
      id: "authentik",
      name: "Authentik",
      async authorization({ params, provider }) {
        // Load OAuth config from database dynamically
        const oauthConfig = await db.oAuthProvider.findFirst({
          where: { name: "Authentik", isEnabled: true },
        });

        if (!oauthConfig) {
          throw new Error("OAuth provider not configured or disabled");
        }

        const scope = oauthConfig.scope || "openid profile email";
        const url = new URL(oauthConfig.authorizationUrl);
        url.searchParams.set("client_id", oauthConfig.clientId);
        url.searchParams.set("redirect_uri", provider.callbackUrl);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", scope);
        if (params?.state) {
          url.searchParams.set("state", params.state as string);
        }

        return url.toString();
      },
      async token({ params, provider }) {
        const oauthConfig = await db.oAuthProvider.findFirst({
          where: { name: "Authentik", isEnabled: true },
        });

        if (!oauthConfig) {
          throw new Error("OAuth provider not configured");
        }

        const response = await fetch(oauthConfig.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: params.code as string,
            redirect_uri: provider.callbackUrl,
            client_id: oauthConfig.clientId,
            client_secret: oauthConfig.clientSecret,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Token exchange failed: ${error}`);
        }

        return await response.json();
      },
      async userinfo({ tokens, provider }) {
        const oauthConfig = await db.oAuthProvider.findFirst({
          where: { name: "Authentik", isEnabled: true },
        });

        if (!oauthConfig) {
          throw new Error("OAuth provider not configured");
        }

        const response = await fetch(oauthConfig.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }

        return await response.json();
      },
      profile(profile: any) {
        return {
          id: profile.sub || profile.id,
          email: profile.email,
          name: profile.name || profile.preferred_username || profile.email,
        };
      },
    }),
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
