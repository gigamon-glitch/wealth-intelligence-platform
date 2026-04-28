/**
 * Shared between `auth.ts` and `middleware.ts`.
 * Edge middleware does not import Prisma/authOptions — it must use the same secret logic.
 */
export function authSecret(): string {
  const raw = process.env.NEXTAUTH_SECRET?.trim();
  if (raw) return raw;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[auth] NEXTAUTH_SECRET is missing or empty — using a dev-only placeholder. Set it in .env: openssl rand -base64 32",
    );
    return "dev-only-placeholder-secret-change-me";
  }
  console.warn(
    "[auth] NEXTAUTH_SECRET is empty in production build — set NEXTAUTH_SECRET on your host",
  );
  return "build-placeholder-set-NEXTAUTH_SECRET-in-production";
}
