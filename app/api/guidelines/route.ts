import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireLogin } from "@/lib/rolesData";
import { getGuidelines, createGuideline, uploadGuidelineFile } from "@/lib/guidelineData";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const session = await requireLogin(req);
  if (session instanceof NextResponse) return session;

  const guidelines = await getGuidelines();
  return NextResponse.json(guidelines);
}

export async function POST(req: NextRequest) {
  const session = await requirePermission(req, "manage_guidelines");
  if (session instanceof NextResponse) return session;

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const source = formData.get("source") as string;
    const file = formData.get("file") as File;

    if (!name || !file) {
      return NextResponse.json(
        { error: "Name and file are required" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const ext = file.name.split(".").pop() || "pdf";
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadGuidelineFile(id, ext, buffer);
    await createGuideline({
      id,
      name,
      description: description || "",
      source: source || "Other",
      filename: file.name,
      ext,
      uploadedBy: session.id,
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
