import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getRoleById, updateRole, deleteRole } from "@/lib/rolesData";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "manage_roles");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const role = await getRoleById(id);
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  return NextResponse.json(role);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "manage_roles");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await updateRole(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "manage_roles");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (id === "super-admin") {
    return NextResponse.json(
      { error: "Cannot delete Super Admin role" },
      { status: 400 }
    );
  }
  const deleted = await deleteRole(id);
  if (!deleted) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
