import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email offline_access',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    maxAge: 8 * 60 * 60, // 8 hours — standard school-day duration
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, extract Azure AD group memberships from the token
      if (account && profile) {
        // Azure AD includes group IDs in the 'groups' claim when configured
        token.azureAdGroups = (profile as Record<string, unknown>).groups as string[] ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      // Expose group IDs on the session for role resolution
      session.user.azureAdGroups = (token.azureAdGroups as string[]) ?? [];
      return session;
    },
  },
});
