import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import { getComplianceCheckById } from "@/lib/complianceCheckData";

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
