import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import {
  getComplianceCheckById,
  updateRiskStatus,
  RISK_STATUSES,
  RiskStatus,
} from "@/lib/complianceCheckData";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "check_compliance");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const check = await getComplianceCheckById(id);
  if (!check) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }

  return NextResponse.json(check, {
    headers: { "Cache-Control": "no-store" },
  });
}

// Update the workflow status of a single risk within a check.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "check_compliance");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const riskIndex = body?.riskIndex;
  const status = body?.status ?? null;

  const statusValid =
    status === null || RISK_STATUSES.includes(status as RiskStatus);
  if (typeof riskIndex !== "number" || !statusValid) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await updateRiskStatus(id, riskIndex, status as RiskStatus | null);
  if (!updated) {
    return NextResponse.json({ error: "Check or risk not found" }, { status: 404 });
  }

  return NextResponse.json(updated, {
    headers: { "Cache-Control": "no-store" },
  });
}
