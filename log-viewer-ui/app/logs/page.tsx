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
  const [mounted, setMounted] = useState(false);
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

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  async function handleViewDetails(logId: number) {
    setLoadingDetails(true);
    setShowModal(true);
    
    try {
      const token = getAuthToken();
      const url = `/api/logs/${logId}`;
      console.log("Fetching log details from:", url);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch log details: ${response.statusText}`);
      }

      const logDetails: LogEntry = await response.json();
      console.log("Log details received:", logDetails);
      setSelectedLog(logDetails);
    } catch (err) {
      console.error("Failed to fetch log details:", err);
      setSelectedLog(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setSelectedLog(null);
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

  if (!mounted || authLoading) {
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
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Showing {logs.length} of {totalCount} logs
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-10 w-36 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400 dark:focus:ring-sky-900"
                >
                  <option value="All">All Levels</option>
                  <option value="Debug">Debug</option>
                  <option value="Information">Information</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-44 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400 dark:focus:ring-sky-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-44 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400 dark:focus:ring-sky-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-10 w-44 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400 dark:focus:ring-sky-900"
                >
                  <option value="All">All Sources</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Application
                </label>
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  className="h-10 w-44 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400 dark:focus:ring-sky-900"
                >
                  <option value="All">All Applications</option>
                  {applications.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="h-10 w-52 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-400 dark:focus:ring-sky-900 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="h-10 rounded-md bg-sky-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearFilters}
                  className="h-10 rounded-md border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
                >
                  Clear
                </button>
              </div>
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
              {logs.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 dark:text-zinc-400">
                  No logs found
                </div>
              ) : (
                <>
                  <div 
                    className="mb-6 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    style={{ 
                      maxHeight: '50vh',
                      overflow: 'auto',
                      position: 'relative'
                    }}
                  >
                    <table 
                      className="border-collapse text-left"
                      style={{ 
                        width: '100%',
                        minWidth: '1500px',
                        tableLayout: 'fixed'
                      }}
                    >
                      <thead 
                        className="border-b-2 border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}
                      >
                        <tr>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '70px' }}>ID</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '170px' }}>Timestamp</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '120px' }}>Level</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '350px' }}>Message</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '130px' }}>Source</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '130px' }}>Application</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '110px' }}>Machine</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '110px' }}>User ID</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '150px' }}>Request</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '120px' }}>Correlation</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '90px' }}>Thread</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400" style={{ width: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                        {logs.map((log) => (
                          <tr
                            key={log.id}
                            className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          >
                            <td className="px-3 py-3 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100" style={{ width: '70px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.id}</td>
                            <td className="px-3 py-3 text-xs text-zinc-700 dark:text-zinc-300" style={{ width: '170px', whiteSpace: 'nowrap' }}>
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td className="px-3 py-3" style={{ width: '120px', whiteSpace: 'nowrap' }}>
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getLevelColor(log.level)}`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="px-3 py-3" style={{ width: '350px' }}>
                              <div className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={log.message}>
                                {log.message}
                              </div>
                              {log.exceptionMessage && (
                                <div className="mt-1.5 text-xs font-medium leading-snug text-red-600 dark:text-red-400" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.exceptionMessage}>
                                  Exception: {log.exceptionMessage}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-xs text-zinc-700 dark:text-zinc-300" style={{ width: '130px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.source}>{log.source}</div>
                            </td>
                            <td className="px-3 py-3 text-xs text-zinc-700 dark:text-zinc-300" style={{ width: '130px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.applicationName}>{log.applicationName}</div>
                            </td>
                            <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-400" style={{ width: '110px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.machineName}>{log.machineName}</div>
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400" style={{ width: '110px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.userId || "-"}</div>
                            </td>
                            <td className="px-3 py-3" style={{ width: '150px' }}>
                              {log.requestMethod && log.requestPath ? (
                                <div>
                                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100" style={{ whiteSpace: 'nowrap' }}>{log.requestMethod}</div>
                                  <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.requestPath}>{log.requestPath}</div>
                                </div>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400" style={{ width: '120px', whiteSpace: 'nowrap' }}>{log.correlationId ? log.correlationId.substring(0, 8) : "-"}</td>
                            <td className="px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400" style={{ width: '90px', whiteSpace: 'nowrap' }}>{log.threadId || "-"}</td>
                            <td className="px-3 py-3" style={{ width: '100px' }}>
                              <button
                                onClick={() => handleViewDetails(log.id)}
                                className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mb-8 flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Previous
                      </button>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Log Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseModal}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Close
                </button>
                <button
                  onClick={handleCloseModal}
                  className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-zinc-600 dark:text-zinc-400">Loading details...</div>
                </div>
              ) : selectedLog ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">ID</label>
                      <p className="mt-1 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedLog.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Timestamp</label>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{formatTimestamp(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Level</label>
                      <p className="mt-1">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getLevelColor(selectedLog.level)}`}>
                          {selectedLog.level}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Source</label>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.source}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Application</label>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.applicationName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Machine</label>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.machineName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">User ID</label>
                      <p className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.userId || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Thread ID</label>
                      <p className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.threadId || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Correlation ID</label>
                      <p className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.correlationId || "-"}</p>
                    </div>
                    {selectedLog.requestMethod && selectedLog.requestPath && (
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Request</label>
                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selectedLog.requestMethod}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">{selectedLog.requestPath}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Message</label>
                    <p className="mt-1 rounded-md bg-zinc-50 p-3 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">{selectedLog.message}</p>
                  </div>

                  {selectedLog.exceptionMessage && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Exception</label>
                      <p className="mt-1 rounded-md bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-200">{selectedLog.exceptionMessage}</p>
                    </div>
                  )}

                  {selectedLog.stackTrace && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Stack Trace</label>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-900 p-3 font-mono text-xs text-zinc-100 dark:bg-zinc-950">{selectedLog.stackTrace}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-red-600 dark:text-red-400">
                  Failed to load log details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}