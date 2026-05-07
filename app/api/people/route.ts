import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import { getPeople, createPerson } from "@/lib/peopleData";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const session = await requirePermission(req, "manage_people");
  if (session instanceof NextResponse) return session;

  const people = await getPeople();
  return NextResponse.json(people);
}

export async function POST(req: NextRequest) {
  const session = await requirePermission(req, "manage_people");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { position, userId, name, email, phone, profilePic } = body;
    if (!position) {
      return NextResponse.json(
        { error: "Position is required" },
        { status: 400 }
      );
    }

    await createPerson({
      id: uuidv4(),
      position,
      userId: userId || null,
      name: name || "",
      email: email || "",
      phone: phone || "",
      profilePic: profilePic || "",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
