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

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth();
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [timelineStats, setTimelineStats] = useState<TimelineStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<string>("day");

  useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, groupBy]);

  async function fetchStats() {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      const [levelsRes, timelineRes] = await Promise.all([
        fetch("/api/logs/stats/levels", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        fetch(`/api/logs/stats/timeline?groupBy=${groupBy}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      ]);

      if (!levelsRes.ok || !timelineRes.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const levelsData = await levelsRes.json();
      const timelineData = await timelineRes.json();

      setLevelStats(levelsData);
      setTimelineStats(timelineData);
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

  const totalLogs = levelStats.reduce((sum, stat) => sum + stat.count, 0);
  const maxCount = Math.max(...levelStats.map(s => s.count), 1);
  const maxTimelineCount = Math.max(...timelineStats.map(s => s.count), 1);

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
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Logs by Level
                </h2>
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {totalLogs.toLocaleString()}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Logs</div>
                </div>
                <div className="space-y-4">
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
          )}
        </div>
      </div>
    </>
  );
}
