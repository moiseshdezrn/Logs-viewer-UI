"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  exceptionMessage?: string;
  stackTrace?: string;
  userId?: string;
  machineName: string;
  requestPath?: string;
  requestMethod?: string;
  correlationId?: string;
  threadId?: number;
  applicationName: string;
}

interface PagedResult {
  items: LogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function LogsPage() {
  const { isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [level, setLevel] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [source, setSource] = useState<string>("All");
  const [application, setApplication] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  const [sources, setSources] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading) {
      fetchFilterOptions();
      fetchLogs();
    }
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchLogs();
    }
  }, [page]);

  async function fetchFilterOptions() {
    try {
      const token = getAuthToken();
      
      const [sourcesRes, appsRes] = await Promise.all([
        fetch("/api/logs/sources", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("/api/logs/applications", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  }

  async function fetchLogs() {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "25"
      });

      if (level !== "All") {
        params.append("Level", level);
      }
      if (startDate) {
        params.append("StartDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append("EndDate", new Date(endDate).toISOString());
      }
      if (source !== "All") {
        params.append("Source", source);
      }
      if (application !== "All") {
        params.append("Application", application);
      }
      if (search) {
        params.append("Search", search);
      }

      const response = await fetch(`/api/logs?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data: PagedResult = await response.json();
      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  function handleApplyFilters() {
    setPage(1);
    fetchLogs();
  }

  function handleClearFilters() {
    setLevel("All");
    setStartDate("");
    setEndDate("");
    setSource("All");
    setApplication("All");
    setSearch("");
    setPage(1);
    setTimeout(() => {
      fetchLogs();
    }, 0);
  }

  function getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300";
      case "information":
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300";
      case "debug":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300";
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 pt-16 dark:bg-black">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Logs</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Showing {logs.length} of {totalCount} logs
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-9 w-32 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="All">All</option>
                  <option value="Debug">Debug</option>
                  <option value="Information">Information</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-40 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-40 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-9 w-40 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="All">All</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Application
                </label>
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  className="h-9 w-40 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="All">All</option>
                  {applications.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="h-9 w-48 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400"
                />
              </div>

              <button
                onClick={handleApplyFilters}
                className="h-9 rounded bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="h-9 rounded border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading logs...</div>
            </div>
          ) : (
            <>
              <div className="overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" style={{ maxHeight: "calc(100vh - 320px)" }}>
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">ID</th>
                      <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                      <th className="px-4 py-3 whitespace-nowrap">Level</th>
                      <th className="px-4 py-3 whitespace-nowrap">Message</th>
                      <th className="px-4 py-3 whitespace-nowrap">Source</th>
                      <th className="px-4 py-3 whitespace-nowrap">Application</th>
                      <th className="px-4 py-3 whitespace-nowrap">Machine</th>
                      <th className="px-4 py-3 whitespace-nowrap">User ID</th>
                      <th className="px-4 py-3 whitespace-nowrap">Request</th>
                      <th className="px-4 py-3 whitespace-nowrap">Correlation ID</th>
                      <th className="px-4 py-3 whitespace-nowrap">Thread ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3 font-mono text-xs">{log.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getLevelColor(log.level)}`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-md">
                          <div className="truncate" title={log.message}>
                            {log.message}
                          </div>
                          {log.exceptionMessage && (
                            <div className="mt-1 truncate text-xs text-red-600 dark:text-red-400" title={log.exceptionMessage}>
                              {log.exceptionMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">{log.source}</td>
                        <td className="px-4 py-3 text-xs">{log.applicationName}</td>
                        <td className="px-4 py-3 text-xs">{log.machineName}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.userId || "-"}</td>
                        <td className="px-4 py-3 text-xs">
                          {log.requestMethod && log.requestPath ? (
                            <span className="font-mono">
                              {log.requestMethod} {log.requestPath}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {log.correlationId ? log.correlationId.substring(0, 8) : "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{log.threadId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logs.length === 0 && !loading && (
                <div className="py-12 text-center text-zinc-600 dark:text-zinc-400">
                  No logs found
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}