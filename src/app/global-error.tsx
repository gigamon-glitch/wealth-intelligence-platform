"use client";

/**
 * Catches errors in the root layout. Must define its own <html> and <body>.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-zinc-100 antialiased">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-zinc-400">{error.message || "Application error."}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
