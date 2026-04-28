import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">The page you requested does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Go home
      </Link>
    </div>
  );
}
