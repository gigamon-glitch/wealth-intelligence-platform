/** NextAuth error query param values — see https://next-auth.js.org/configuration/pages#error-page */
export function describeAuthError(code: string | undefined): { title: string; detail: string } {
  switch (code) {
    case "OAuthSignin":
      return {
        title: "Could not start Google sign-in",
        detail: "Check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and that Google OAuth is enabled for this project.",
      };
    case "OAuthCallback":
    case "Callback":
      return {
        title: "Google sign-in did not finish",
        detail:
          "Common causes: PostgreSQL not running (OAuth needs the database to create your user), wrong redirect URI in Google Cloud, or using 127.0.0.1 while NEXTAUTH_URL says localhost (must match exactly).",
      };
    case "OAuthCreateAccount":
      return {
        title: "Could not create your account",
        detail: "Usually a database error. Ensure Docker Postgres is up, run `npx prisma db push`, and try again.",
      };
    case "OAuthAccountNotLinked":
      return {
        title: "Account already exists with another sign-in method",
        detail: "Sign in with the method you used originally, or contact support to link accounts.",
      };
    case "EmailSignin":
      return {
        title: "Email sign-in failed",
        detail: "Check your email provider configuration.",
      };
    case "CredentialsSignin":
      return {
        title: "Invalid credentials",
        detail: "Check email and password.",
      };
    case "SessionRequired":
      return {
        title: "Session required",
        detail: "Please sign in to continue.",
      };
    case "Configuration":
      return {
        title: "Auth configuration error",
        detail: "Check NEXTAUTH_SECRET, NEXTAUTH_URL, and server logs.",
      };
    case "AccessDenied":
      return {
        title: "Access denied",
        detail: "You cancelled sign-in or the app blocked this account.",
      };
    default:
      if (!code) {
        return { title: "", detail: "" };
      }
      return {
        title: "Sign-in error",
        detail: `Code: ${code}. Check the terminal where Next.js is running for details.`,
      };
  }
}
