import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import { getDocuments, createDocument, uploadDocumentFile } from "@/lib/documentData";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const session = await requirePermission(req, "check_documents");
  if (session instanceof NextResponse) return session;

  const docs = await getDocuments();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await requirePermission(req, "check_documents");
  if (session instanceof NextResponse) return session;

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
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

    await uploadDocumentFile(id, file.name, buffer);
    await createDocument({
      id,
      name,
      description: description || "",
      filename: file.name,
      ext,
      uploadedBy: session.id,
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
      lastCheckScore: null,
      lastCheckDate: null,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
