"use client";

import { useAuth, authFetch } from "@/lib/useAuth";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface SpendRecord {
  id: string;
  projectName: string;
  estimatedAmount: number;
  status: string;
  submittedByName: string;
  submittedAt: string;
  approvals: { userName: string; decision: string }[];
}

export default function SpendPage() {
  const { session, loading } = useAuth("submit_spend");
  const [apps, setApps] = useState<SpendRecord[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchApps = useCallback(async () => {
    const res = await authFetch("/api/spend");
    if (res.ok) setApps(await res.json());
  }, []);

  useEffect(() => {
    if (session) fetchApps();
  }, [session, fetchApps]);

  const filtered =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  const statusColors: Record<string, string> = {
    pending: "bg-risk-low/10 text-risk-low",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-risk-high/10 text-risk-high",
    requires_changes: "bg-risk-medium/10 text-risk-medium",
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Spend Applications</h1>
          <p className="text-gray-500 text-sm">
            {apps.length} application{apps.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/spend/new"
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Application
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "pending", "approved", "rejected", "requires_changes"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "requires_changes"
                ? "Changes Required"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Project</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted By</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{app.projectName}</td>
                <td className="px-6 py-4 text-gray-600">
                  R{app.estimatedAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-gray-600">{app.submittedByName}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(app.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      statusColors[app.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {app.status === "requires_changes"
                      ? "Changes Required"
                      : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/spend/${app.id}`}
                    className="text-primary hover:text-primary-dark text-xs font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No spend applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
