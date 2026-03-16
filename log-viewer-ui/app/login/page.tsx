"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

const LOGIN_ENDPOINT = "/api/login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Login failed");
      }

      const data = await res.json();

      // Persist auth token / user info for later use
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authExpiresAt", data.expiresAt);
      localStorage.setItem("authEmail", data.email);
      localStorage.setItem("authUsername", data.username);

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Log in
        </h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(evt) => setEmail(evt.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(evt) => setPassword(evt.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400"
            />
          </label>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          This form will POST <span className="font-semibold">email</span> and <span className="font-semibold">password</span> to <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-950">{LOGIN_ENDPOINT}</code> and store the returned JWT token in <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-950">localStorage</code>.
        </p>
      </main>
    </div>
  );
}
