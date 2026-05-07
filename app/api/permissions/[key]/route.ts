import { NextRequest, NextResponse } from "next/server";
import { requirePermission, deletePermission } from "@/lib/rolesData";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await requirePermission(req, "manage_roles");
  if (session instanceof NextResponse) return session;

  const { key } = await params;
  const deleted = await deletePermission(key);
  if (!deleted) {
    return NextResponse.json(
      { error: "Permission not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
