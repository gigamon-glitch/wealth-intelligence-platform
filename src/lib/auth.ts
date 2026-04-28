import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { authSecret } from "@/lib/auth-secret";

/**
 * NextAuth configuration: Google OAuth for production-style login.
 * Optional DEMO_AUTH credentials provider for local testing without OAuth credentials.
 */
export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/" },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.DEMO_AUTH === "true"
      ? [
          CredentialsProvider({
            id: "demo",
            name: "Demo user",
            credentials: {
              email: { label: "Email", type: "text" },
              password: { label: "Password", type: "password" },
            },
            async authorize(creds) {
              if (!creds?.email || !creds?.password) return null;
              const user = await prisma.user.findUnique({ where: { email: creds.email } });
              if (!user?.email) return null;
              const account = await prisma.account.findFirst({
                where: { userId: user.id, provider: "credentials" },
              });
              const hash = account?.access_token;
              if (!hash) return null;
              const ok = await compare(creds.password, hash);
              return ok ? user : null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
};
