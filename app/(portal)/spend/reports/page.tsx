"use client";

import { useAuth, authFetch } from "@/lib/useAuth";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  buildSpendReport,
  formatRand,
  type SpendReport,
} from "@/lib/spendReport";
import { STATUS_DISPLAY } from "@/lib/spendData";
import type { SpendApplication } from "@/lib/spendData";

interface SpendSettings {
  capexBudget: number;
  capexYear: number;
}

export default function SpendReportsPage() {
  const { session, loading } = useAuth("view_all_spend");
  const [report, setReport] = useState<SpendReport | null>(null);
  const [settings, setSettings] = useState<SpendSettings | null>(null);
  const [fetching, setFetching] = useState(true);

  const load = useCallback(async () => {
    setFetching(true);
    const [spendRes, settingsRes] = await Promise.all([
      authFetch("/api/spend"),
      authFetch("/api/settings/spend"),
    ]);
    const apps: SpendApplication[] = spendRes.ok ? await spendRes.json() : [];
    const s: SpendSettings = settingsRes.ok
      ? await settingsRes.json()
      : { capexBudget: 0, capexYear: new Date().getFullYear() };
    setSettings(s);
    setReport(
      buildSpendReport(apps, {
        capexBudget: s.capexBudget,
        capexYear: s.capexYear,
      })
    );
    setFetching(false);
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  if (loading || fetching || !report || !settings)
    return <div className="p-6">Loading...</div>;

  const { capex, bySource, byProject } = report;

  // Bar scale for the CAPEX budget chart.
  const capexMax = Math.max(capex.budget, capex.committed, capex.actual, 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Spend Reports</h1>
          <p className="text-gray-500 text-sm">
            CAPEX budget vs. spend, funding sources, and per-project breakdown
            {" · "}
            {capex.year}
          </p>
        </div>
        <Link
          href="/admin/spend-settings"
          className="text-xs text-primary hover:text-primary-dark font-medium"
        >
          Edit budget &rarr;
        </Link>
      </div>

      {/* CAPEX summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="CAPEX Budget" value={formatRand(capex.budget)} />
        <SummaryCard
          label="Committed"
          value={formatRand(capex.committed)}
          sub={`${capex.pctCommitted.toFixed(0)}% of budget`}
          tone={capex.overCommitted ? "danger" : "default"}
        />
        <SummaryCard
          label="Actual Spent"
          value={formatRand(capex.actual)}
          sub={`${capex.pctActual.toFixed(0)}% of budget`}
        />
        <SummaryCard
          label="Remaining"
          value={formatRand(capex.remainingVsCommitted)}
          sub="after commitments"
          tone={capex.remainingVsCommitted < 0 ? "danger" : "success"}
        />
      </div>

      {/* CAPEX budget vs spend bars */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-medium text-sm text-gray-500 mb-4">
          CAPEX BUDGET vs SPEND
        </h3>
        <div className="space-y-4">
          <BudgetBar
            label="Budget"
            amount={capex.budget}
            max={capexMax}
            color="bg-gray-300"
          />
          <BudgetBar
            label="Committed (approved + completed)"
            amount={capex.committed}
            max={capexMax}
            color={capex.overCommitted ? "bg-risk-high" : "bg-primary"}
          />
          <BudgetBar
            label="Actual (completed)"
            amount={capex.actual}
            max={capexMax}
            color="bg-emerald-500"
          />
        </div>
        {capex.requestedPipeline > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            + {formatRand(capex.requestedPipeline)} in CAPEX requests still
            awaiting approval.
          </p>
        )}
        {capex.overCommitted && (
          <p className="mt-2 text-xs font-medium text-risk-high">
            Commitments exceed the CAPEX budget by{" "}
            {formatRand(-capex.remainingVsCommitted)}.
          </p>
        )}
      </div>

      {/* By funding source */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-medium text-sm text-gray-500 mb-4">
          BY FUNDING SOURCE
        </h3>
        {bySource.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No spend recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr className="border-b border-gray-100">
                <th className="py-2 font-medium">Source</th>
                <th className="py-2 font-medium text-right">Requested</th>
                <th className="py-2 font-medium text-right">Committed</th>
                <th className="py-2 font-medium text-right">Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bySource.map((s) => (
                <tr key={s.source}>
                  <td className="py-2.5 text-gray-700">
                    {s.source}
                    {s.source === "CAPEX" && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                        budgeted
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-gray-500">
                    {formatRand(s.requested)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-dark">
                    {formatRand(s.committed)}
                  </td>
                  <td className="py-2.5 text-right text-emerald-600">
                    {formatRand(s.actual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Per project */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-medium text-sm text-gray-500 mb-4">
          SPEND PER PROJECT
        </h3>
        {byProject.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No applications yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b border-gray-100">
                  <th className="py-2 font-medium">Project</th>
                  <th className="py-2 font-medium">Sources</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Requested</th>
                  <th className="py-2 font-medium text-right">Committed</th>
                  <th className="py-2 font-medium text-right">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byProject.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5">
                      <Link
                        href={`/spend/${p.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {p.projectName}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {p.submittedByName}
                      </p>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(p.sources)].map((src) => (
                          <span
                            key={src}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs text-gray-500">
                        {STATUS_DISPLAY[p.status] || p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-500">
                      {formatRand(p.requested)}
                    </td>
                    <td className="py-2.5 text-right font-medium text-dark">
                      {formatRand(p.committed)}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600">
                      {formatRand(p.actual)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "danger";
}) {
  const valueColor =
    tone === "danger"
      ? "text-risk-high"
      : tone === "success"
      ? "text-emerald-600"
      : "text-dark";
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function BudgetBar({
  label,
  amount,
  max,
  color,
}: {
  label: string;
  amount: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((Math.abs(amount) / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-dark">{formatRand(amount)}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
