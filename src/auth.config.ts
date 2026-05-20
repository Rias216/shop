import type { NextAuthConfig } from "next-auth";

const authSessionMaxAgeSec = 60 * 60 * 8; // 8 hours
const authSessionUpdateAgeSec = 60 * 60; // 1 hour

export const authConfig: NextAuthConfig = {
  providers: [],
  // Required for IP-based deploys and reverse proxies without a domain yet.
  trustHost: true,
  pages: { signIn: "/admin/login" },
  session: {
    strategy: "jwt",
    maxAge: authSessionMaxAgeSec,
    updateAge: authSessionUpdateAgeSec,
  },
  jwt: {
    maxAge: authSessionMaxAgeSec,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
