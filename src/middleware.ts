import { withAuth } from "next-auth/middleware";
import { authSecret } from "@/lib/auth-secret";

/**
 * Default `next-auth/middleware` only reads `process.env.NEXTAUTH_SECRET`.
 * On the Edge runtime that can be missing while API routes use `authOptions.secret`.
 * Passing `secret` explicitly keeps JWT verification aligned with NextAuth handlers.
 */
export default withAuth({
  secret: authSecret(),
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assets/:path*",
    "/expenses/:path*",
    "/loans/:path*",
    "/investments",
    "/investments/:path*",
    "/tax/:path*",
    "/advisor/:path*",
    "/goals/:path*",
  ],
};
