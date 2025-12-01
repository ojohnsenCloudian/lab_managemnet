import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';
import type { OAuthConfig } from '@auth/core/providers';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin || false;
        token.passwordChangeRequired = user.passwordChangeRequired || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin || false;
        session.user.passwordChangeRequired = token.passwordChangeRequired || false;
      }
      return session;
    },
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
});

// Helper function to add Authentik OAuth provider dynamically
export async function addAuthentikProvider(config: {
  clientId: string;
  clientSecret: string;
  issuer: string;
}): Promise<OAuthConfig<any>> {
  return {
    id: 'authentik',
    name: 'Authentik',
    type: 'oauth',
    authorization: {
      url: `${config.issuer}/application/o/authorize/`,
      params: {
        scope: 'openid profile email',
        response_type: 'code',
      },
    },
    token: `${config.issuer}/application/o/token/`,
    userinfo: `${config.issuer}/application/o/userinfo/`,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    profile(profile: any) {
      return {
        id: profile.sub || profile.id,
        name: profile.name || profile.preferred_username,
        email: profile.email,
      };
    },
  };
}
