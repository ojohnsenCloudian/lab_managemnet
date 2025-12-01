import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
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
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.passwordChangeRequired = (user as any).passwordChangeRequired;
      }

      // Handle OAuth login (Authentik)
      if (account?.provider === 'authentik' && account?.access_token) {
        try {
          const oauthProvider = await db.oAuthProvider.findUnique({
            where: { name: 'authentik' },
          });

          if (oauthProvider) {
            const response = await fetch(oauthProvider.userInfoUrl, {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
              },
            });
            const profile = await response.json();

            const dbUser = await db.user.upsert({
              where: { email: profile.email },
              update: {
                oauthProviderId: profile.sub,
                oauthProvider: 'authentik',
                name: profile.name || profile.preferred_username,
              },
              create: {
                email: profile.email,
                name: profile.name || profile.preferred_username,
                oauthProviderId: profile.sub,
                oauthProvider: 'authentik',
                isAdmin: false,
                passwordChangeRequired: false,
              },
            });

            token.id = dbUser.id;
            token.isAdmin = dbUser.isAdmin;
            token.passwordChangeRequired = dbUser.passwordChangeRequired;
          }
        } catch (error) {
          console.error('Error fetching user info from Authentik:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.passwordChangeRequired = token.passwordChangeRequired as boolean;
      }
      return session;
    },
  },
});

// Helper function to add Authentik provider dynamically
export async function addAuthentikProvider(config: {
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}) {
  await db.oAuthProvider.upsert({
    where: { name: 'authentik' },
    update: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authorizationUrl: config.authorizationUrl,
      tokenUrl: config.tokenUrl,
      userInfoUrl: config.userInfoUrl,
      isEnabled: true,
    },
    create: {
      name: 'authentik',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authorizationUrl: config.authorizationUrl,
      tokenUrl: config.tokenUrl,
      userInfoUrl: config.userInfoUrl,
      isEnabled: true,
    },
  });
}
