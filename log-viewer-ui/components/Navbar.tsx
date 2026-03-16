"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { authData, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 hover:text-sky-600 dark:hover:text-sky-400 transition">
            Log Viewer
          </a>
          <a
            href="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Dashboard
          </a>
          <a
            href="/logs"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Logs
          </a>
        </div>

        <div className="flex items-center gap-4">
          {authData && (
            <>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {authData.username}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {authData.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
