import { NextRequest, NextResponse } from "next/server";
import { requireLogin } from "@/lib/rolesData";
import { getUserById, updateUser } from "@/lib/userData";

export async function GET(req: NextRequest) {
  const session = await requireLogin(req);
  if (session instanceof NextResponse) return session;

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { password, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PUT(req: NextRequest) {
  const session = await requireLogin(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, surname, email } = body;
    const updated = await updateUser(session.id, { name, surname, email });
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { password, ...safe } = updated;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
