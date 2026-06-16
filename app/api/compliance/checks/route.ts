import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import { getComplianceChecks } from "@/lib/complianceCheckData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requirePermission(req, "view_dashboard");
  if (session instanceof NextResponse) return session;

  const checks = await getComplianceChecks();
  // Lean payload for the dashboard grid (no full risk text).
  const list = checks.map((c) => ({
    id: c.id,
    name: c.name,
    score: c.score,
    issueCount: c.issueCount,
    checkedByName: c.checkedByName,
    checkedAt: c.checkedAt,
  }));

  return NextResponse.json(list, {
    headers: { "Cache-Control": "no-store" },
  });
}
