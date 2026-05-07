import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getPermissions, createPermission } from "@/lib/rolesData";

export async function GET(req: NextRequest) {
  const session = await requirePermission(req, "manage_roles");
  if (session instanceof NextResponse) return session;

  const perms = await getPermissions();
  return NextResponse.json(perms);
}

export async function POST(req: NextRequest) {
  const session = await requirePermission(req, "manage_roles");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { key, name, category } = body;
    if (!key || !name || !category) {
      return NextResponse.json(
        { error: "Key, name, and category are required" },
        { status: 400 }
      );
    }

    const perms = await getPermissions();
    if (perms.some((p) => p.key === key)) {
      return NextResponse.json(
        { error: "Permission key already exists" },
        { status: 409 }
      );
    }

    await createPermission({ key, name, category });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
