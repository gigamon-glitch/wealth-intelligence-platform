import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInPanel } from "@/components/sign-in-panel";

/** OAuth failures redirect here with ?error= — must not be fully static. */
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Home({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect("/dashboard");

  const showDemo = process.env.DEMO_AUTH === "true";
  const showGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  const err = searchParams.error;
  const authError = typeof err === "string" ? err : Array.isArray(err) ? err[0] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <SignInPanel showDemo={showDemo} showGoogle={showGoogle} authErrorCode={authError} />
      </div>
    </div>
  );
}
