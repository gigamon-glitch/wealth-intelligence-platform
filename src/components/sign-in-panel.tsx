"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { describeAuthError } from "@/lib/auth-errors";

export function SignInPanel({
  showDemo,
  showGoogle,
  authErrorCode,
}: {
  showDemo: boolean;
  showGoogle: boolean;
  authErrorCode?: string;
}) {
  const [email, setEmail] = useState("demo@wealth.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);

  const code = authErrorCode;
  const oauthErr = describeAuthError(code);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wealth Intelligence</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Net worth, cash flow, Australian tax modelling, precious metals, and an explainable AI
          advisor — unified in one dashboard.
        </p>
      </div>
      {oauthErr.title ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
        >
          <p className="font-semibold">{oauthErr.title}</p>
          <p className="mt-2 text-red-800 dark:text-red-200/90">{oauthErr.detail}</p>
        </div>
      ) : null}
      {showGoogle && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Continue with Google
        </button>
      )}
      {!showGoogle && (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Google sign-in disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or enable demo auth.
        </p>
      )}
      {showDemo && (
        <div className="rounded-xl border border-dashed border-emerald-300/60 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
            Local demo (set DEMO_AUTH=true)
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <input
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              onClick={async () => {
                setError(null);
                const res = await signIn("demo", {
                  email,
                  password,
                  callbackUrl: "/dashboard",
                  redirect: true,
                });
                if (res?.error) setError("Invalid credentials");
              }}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
            >
              Sign in (demo)
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
      <p className="text-xs text-zinc-500">
        By continuing you agree that insights are educational and not personal financial or tax
        advice.
      </p>
    </div>
  );
}
