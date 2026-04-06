"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";

interface LevelStats {
  level: string;
  count: number;
}

interface TimelineStats {
  period: string;
  count: number;
}

interface DailyStats {
  totalLogs: number;
  errorCount: number;
  criticalCount: number;
  averageLogsPerHour: number;
}

interface ErrorsBySourceStats {
  source: string;
  count: number;
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth();
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [timelineStats, setTimelineStats] = useState<TimelineStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [errorsBySourceStats, setErrorsBySourceStats] = useState<ErrorsBySourceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<string>("day");
  const [startInput, setStartInput] = useState<string>("");
  const [endInput, setEndInput] = useState<string>("");
  const [appliedStart, setAppliedStart] = useState<string>("");
  const [appliedEnd, setAppliedEnd] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, groupBy, appliedStart, appliedEnd]);

  async function fetchStats() {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const levelsParams = new URLSearchParams();
      const timelineParams = new URLSearchParams({ groupBy });
      if (appliedStart) {
        levelsParams.set("startDate", appliedStart);
        timelineParams.set("startDate", appliedStart);
      }
      if (appliedEnd) {
        levelsParams.set("endDate", appliedEnd);
        timelineParams.set("endDate", appliedEnd);
      }
      const errorsBySourceParams = new URLSearchParams();
      if (appliedStart) errorsBySourceParams.set("startDate", appliedStart);
      if (appliedEnd) errorsBySourceParams.set("endDate", appliedEnd);
      const levelsQuery = levelsParams.toString();
      const timelineQuery = timelineParams.toString();
      const errorsBySourceQuery = errorsBySourceParams.toString();

      const [levelsRes, timelineRes, dailyRes, errorsBySourceRes] = await Promise.all([
        fetch(`/api/logs/stats/levels${levelsQuery ? `?${levelsQuery}` : ""}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        fetch(`/api/logs/stats/timeline?${timelineQuery}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        fetch("/api/logs/stats/daily", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        fetch(`/api/logs/stats/errors-and-criticals-by-source${errorsBySourceQuery ? `?${errorsBySourceQuery}` : ""}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      ]);

      if (!levelsRes.ok || !timelineRes.ok || !dailyRes.ok || !errorsBySourceRes.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const levelsData = await levelsRes.json();
      const timelineData = await timelineRes.json();
      const dailyData = await dailyRes.json();
      const errorsBySourceData = await errorsBySourceRes.json();

      setLevelStats(levelsData);
      setTimelineStats(timelineData);
      setDailyStats(dailyData);
      setErrorsBySourceStats(Array.isArray(errorsBySourceData) ? errorsBySourceData.map((x: { Source?: string; source?: string; Count?: number; count?: number }) => ({ source: x.Source ?? x.source ?? "", count: x.Count ?? x.count ?? 0 })) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }

  function getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "information":
      case "info":
        return "bg-blue-500";
      case "debug":
        return "bg-gray-500";
      default:
        return "bg-zinc-500";
    }
  }

  function getLevelTextColor(level: string): string {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-700 dark:text-red-400";
      case "warning":
        return "text-yellow-700 dark:text-yellow-400";
      case "information":
      case "info":
        return "text-blue-700 dark:text-blue-400";
      case "debug":
        return "text-gray-700 dark:text-gray-400";
      default:
        return "text-zinc-700 dark:text-zinc-400";
    }
  }

  function getLevelPieColor(level: string): string {
    switch (level.toLowerCase()) {
      case "error":
        return "#ef4444";
      case "warning":
        return "#eab308";
      case "information":
      case "info":
        return "#3b82f6";
      case "debug":
        return "#6b7280";
      default:
        return "#71717a";
    }
  }

  function createPieChart(stats: LevelStats[]) {
    if (stats.length === 0) return null;

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    let currentAngle = -90;
    
    const slices = stats.map((stat) => {
      const percentage = (stat.count / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = 50 + 45 * Math.cos(startRad);
      const y1 = 50 + 45 * Math.sin(startRad);
      const x2 = 50 + 45 * Math.cos(endRad);
      const y2 = 50 + 45 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 45 45 0 ${largeArc} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      return {
        path: pathData,
        color: getLevelPieColor(stat.level),
        level: stat.level,
        count: stat.count,
        percentage: percentage.toFixed(1)
      };
    });

    return slices;
  }

  const totalLogs = levelStats.reduce((sum, stat) => sum + stat.count, 0);
  const maxCount = Math.max(...levelStats.map(s => s.count), 1);
  const maxTimelineCount = Math.max(...timelineStats.map(s => s.count), 1);
  const maxErrorsBySource = Math.max(...errorsBySourceStats.map(s => s.count), 1);

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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Overview of log statistics and trends
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Start</span>
                <input
                  type="date"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">End</span>
                <input
                  type="date"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setAppliedStart(startInput);
                  setAppliedEnd(endInput);
                }}
                className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartInput("");
                  setEndInput("");
                  setAppliedStart("");
                  setAppliedEnd("");
                }}
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
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
              <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading statistics...</div>
            </div>
          ) : (
            <>
              {dailyStats && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Logs</p>
                        <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                          {dailyStats.totalLogs.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950/30">
                        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">All time</p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Errors (24h)</p>
                        <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                          {dailyStats.errorCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/30">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Last 24 hours</p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Critical (24h)</p>
                        <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {dailyStats.criticalCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-950/30">
                        <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Last 24 hours</p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Avg/Hour</p>
                        <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                          {dailyStats.averageLogsPerHour.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </p>
                      </div>
                      <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/30">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Last 24 hours</p>
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Logs by Level
                </h2>
                
                <div className="mb-6 flex items-center justify-center gap-8">
                  <div className="relative" style={{ width: '240px', height: '240px' }}>
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {createPieChart(levelStats)?.map((slice, index) => (
                        <g key={index}>
                          <path
                            d={slice.path}
                            fill={slice.color}
                            className="transition-opacity hover:opacity-80"
                            style={{ cursor: 'pointer' }}
                          >
                            <title>{`${slice.level}: ${slice.count} (${slice.percentage}%)`}</title>
                          </path>
                        </g>
                      ))}
                      <circle cx="50" cy="50" r="20" fill="white" className="dark:fill-zinc-900" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        {totalLogs.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Logs</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {levelStats.map((stat) => (
                      <div key={stat.level} className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: getLevelPieColor(stat.level) }}
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${getLevelTextColor(stat.level)}`}>
                            {stat.level}
                          </span>
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                            {stat.count.toLocaleString()} ({((stat.count / totalLogs) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                  {levelStats.map((stat) => (
                    <div key={stat.level}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className={`font-medium ${getLevelTextColor(stat.level)}`}>
                          {stat.level}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {stat.count.toLocaleString()} ({((stat.count / totalLogs) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full ${getLevelColor(stat.level)} transition-all duration-500`}
                          style={{ width: `${(stat.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Log Frequency
                  </h2>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="h-8 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                <div className="relative h-80">
                  <div className="absolute inset-0 flex items-end justify-between gap-2 pb-8">
                    {timelineStats.slice(0, 15).map((stat, index) => {
                      const heightPercent = (stat.count / maxTimelineCount) * 100;
                      return (
                        <div key={index} className="flex flex-1 flex-col items-center gap-2">
                          <div className="relative flex w-full flex-col items-center">
                            <div className="mb-1 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                              {stat.count}
                            </div>
                            <div
                              className="w-full rounded-t bg-sky-500 transition-all duration-500 hover:bg-sky-600"
                              style={{ height: `${Math.max(heightPercent * 2.5, 4)}px` }}
                              title={`${stat.count} logs`}
                            />
                          </div>
                          <div className="w-full text-center text-[10px] text-zinc-600 dark:text-zinc-400" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                            {new Date(stat.period).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              ...(groupBy === "hour" && { hour: "2-digit" })
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-300 dark:bg-zinc-700" />
                </div>
                {timelineStats.length > 15 && (
                  <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">
                    Showing most recent 15 periods
                  </p>
                )}
              </div>
            </div>

              <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Top 10 Errors and criticals by source
                </h2>
                <div className="space-y-4">
                  {errorsBySourceStats.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No data for the selected period.</p>
                  ) : (
                    errorsBySourceStats.map((stat) => (
                      <div key={stat.source}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="truncate font-medium text-zinc-700 dark:text-zinc-300" title={stat.source}>
                            {stat.source || "(unknown)"}
                          </span>
                          <span className="ml-2 shrink-0 font-semibold text-zinc-900 dark:text-zinc-50">
                            {stat.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full bg-red-500 transition-all duration-500 hover:bg-red-600"
                            style={{ width: `${(stat.count / maxErrorsBySource) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
