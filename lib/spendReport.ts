// Pure reporting calculations for the Spend / funding module.
// No server-only imports — safe to use from client components.

import { getFundingAllocations } from "./spendData";
import type { SpendApplication } from "./spendData";

export interface SourceBreakdown {
  source: string;
  requested: number; // total estimated across all live (non-rejected) requests
  committed: number; // approved + completed
  actual: number; // completed only
}

export interface ProjectRow {
  id: string;
  projectName: string;
  status: string;
  submittedByName: string;
  sources: string[];
  requested: number;
  committed: number;
  actual: number;
}

export interface CapexSummary {
  budget: number;
  year: number;
  committed: number;
  actual: number;
  requestedPipeline: number; // not-yet-approved CAPEX requests
  remainingVsCommitted: number;
  remainingVsActual: number;
  pctCommitted: number; // committed / budget * 100
  pctActual: number; // actual / budget * 100
  overCommitted: boolean;
}

export interface SpendReport {
  capex: CapexSummary;
  bySource: SourceBreakdown[];
  byProject: ProjectRow[];
  statusCounts: Record<string, number>;
  totals: { requested: number; committed: number; actual: number };
}

const COMMITTED_STATUSES = new Set(["approved", "completed"]);

// Statuses that count as "awaiting an approval decision".
export const PENDING_STATUSES = new Set(["pending", "pending_decision"]);

/**
 * Whether an application belongs to a given financial year. The school's
 * financial year runs Jan–Dec (calendar year), matched on the submission date.
 * (If a school ever needs an April-start FY, change the bracketing here.)
 */
export function inFinancialYear(iso: string, year: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.getFullYear() === year;
}

/** Count of applications awaiting an approval decision in a financial year. */
export function pendingSpendCount(
  apps: { status: string; submittedAt: string }[],
  year: number
): number {
  return apps.filter(
    (a) => PENDING_STATUSES.has(a.status) && inFinancialYear(a.submittedAt, year)
  ).length;
}

/** The Rand figure a request is committed/actually-spent at. */
function baseAmount(app: SpendApplication): number {
  const approved =
    typeof app.approvedAmount === "number"
      ? app.approvedAmount
      : app.estimatedAmount || 0;
  return approved;
}

/** Actual spent for a completed request, including any budget overrun. */
function actualAmount(app: SpendApplication): number {
  const base = baseAmount(app);
  if (app.finishedWithinBudget === false && app.budgetOverrunAmount) {
    return base + app.budgetOverrunAmount;
  }
  return base;
}

/**
 * Spread a target Rand figure across an application's funding sources in the
 * same proportions as the entered split. Keeps CAPEX's share consistent whether
 * we're measuring the estimate, the approved amount, or the actual spend.
 */
function allocate(
  app: SpendApplication,
  target: number
): { source: string; amount: number }[] {
  const allocations = getFundingAllocations(app);
  const sum = allocations.reduce((t, a) => t + (a.amount || 0), 0);
  if (sum <= 0) {
    // No usable split — attribute everything to the first/legacy source.
    return [{ source: allocations[0]?.source || "Other", amount: target }];
  }
  return allocations.map((a) => ({
    source: a.source,
    amount: (a.amount / sum) * target,
  }));
}

export function buildSpendReport(
  apps: SpendApplication[],
  opts: { capexBudget: number; capexYear: number; financialYear?: number }
): SpendReport {
  // Scope to a financial year when asked (defaults to the CAPEX budget year),
  // so budget-vs-spend compares like-for-like against the annual budget.
  const fy =
    typeof opts.financialYear === "number" ? opts.financialYear : opts.capexYear;
  const scoped = apps.filter((a) => inFinancialYear(a.submittedAt, fy));

  const sourceMap = new Map<string, SourceBreakdown>();
  const ensure = (source: string): SourceBreakdown => {
    let row = sourceMap.get(source);
    if (!row) {
      row = { source, requested: 0, committed: 0, actual: 0 };
      sourceMap.set(source, row);
    }
    return row;
  };

  const byProject: ProjectRow[] = [];
  const statusCounts: Record<string, number> = {};
  const totals = { requested: 0, committed: 0, actual: 0 };

  for (const app of scoped) {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;

    // Rejected requests don't count toward any spend figure.
    if (app.status === "rejected") {
      byProject.push({
        id: app.id,
        projectName: app.projectName,
        status: app.status,
        submittedByName: app.submittedByName,
        sources: getFundingAllocations(app).map((a) => a.source),
        requested: 0,
        committed: 0,
        actual: 0,
      });
      continue;
    }

    const isCommitted = COMMITTED_STATUSES.has(app.status);
    const isActual = app.status === "completed";

    const requestedSplit = allocate(app, app.estimatedAmount || 0);
    const committedSplit = isCommitted ? allocate(app, baseAmount(app)) : [];
    const actualSplit = isActual ? allocate(app, actualAmount(app)) : [];

    let projRequested = 0;
    let projCommitted = 0;
    let projActual = 0;

    for (const a of requestedSplit) {
      ensure(a.source).requested += a.amount;
      projRequested += a.amount;
    }
    for (const a of committedSplit) {
      ensure(a.source).committed += a.amount;
      projCommitted += a.amount;
    }
    for (const a of actualSplit) {
      ensure(a.source).actual += a.amount;
      projActual += a.amount;
    }

    totals.requested += projRequested;
    totals.committed += projCommitted;
    totals.actual += projActual;

    byProject.push({
      id: app.id,
      projectName: app.projectName,
      status: app.status,
      submittedByName: app.submittedByName,
      sources: getFundingAllocations(app).map((a) => a.source),
      requested: projRequested,
      committed: projCommitted,
      actual: projActual,
    });
  }

  // CAPEX summary
  const capexRow = sourceMap.get("CAPEX");
  const capexCommitted = capexRow?.committed || 0;
  const capexActual = capexRow?.actual || 0;
  const capexRequested = capexRow?.requested || 0;
  const budget = opts.capexBudget || 0;

  const capex: CapexSummary = {
    budget,
    year: opts.capexYear,
    committed: capexCommitted,
    actual: capexActual,
    // Requested-but-not-yet-committed CAPEX (the pipeline against the budget).
    requestedPipeline: Math.max(capexRequested - capexCommitted, 0),
    remainingVsCommitted: budget - capexCommitted,
    remainingVsActual: budget - capexActual,
    pctCommitted: budget > 0 ? (capexCommitted / budget) * 100 : 0,
    pctActual: budget > 0 ? (capexActual / budget) * 100 : 0,
    overCommitted: capexCommitted > budget,
  };

  // Order sources: canonical-ish first by total size, biggest first.
  const bySource = [...sourceMap.values()].sort(
    (a, b) =>
      b.committed + b.requested - (a.committed + a.requested)
  );

  // Biggest projects first.
  byProject.sort((a, b) => b.requested - a.requested);

  return { capex, bySource, byProject, statusCounts, totals };
}

/** Compact ZAR formatter, e.g. R 12,500. */
export function formatRand(n: number): string {
  return "R " + Math.round(n).toLocaleString("en-ZA");
}
