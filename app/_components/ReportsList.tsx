"use client";

import { useEffect, useState, useCallback } from "react";
import { Report, getReports, markReportReviewed } from "@/lib/api/reports";

interface Props {
  token: string;
}

export function ReportsList({ token }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreviewedOnly, setUnreviewedOnly] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports(token, unreviewedOnly);
      setReports(data);
    } catch {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [token, unreviewedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkReviewed(id: string) {
    setError(null);
    setReviewing(id);
    try {
      const updated = await markReportReviewed(token, id);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? updated : r)).filter((r) =>
          unreviewedOnly ? !r.reviewed : true,
        ),
      );
    } catch {
      setError("Failed to mark report as reviewed");
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreviewedOnly}
            onChange={(e) => setUnreviewedOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Unreviewed only
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-400">
          {unreviewedOnly ? "No unreviewed reports." : "No reports."}
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {report.recipe_title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(report.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {!report.reviewed && (
                  <button
                    onClick={() => handleMarkReviewed(report.id)}
                    disabled={reviewing === report.id}
                    className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {reviewing === report.id ? "Saving…" : "Mark reviewed"}
                  </button>
                )}
                {report.reviewed && (
                  <span className="flex-shrink-0 text-xs text-gray-400 font-medium">
                    Reviewed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {report.reason}
                </span>
              </div>

              {report.notes && (
                <p className="text-sm text-gray-600">{report.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
